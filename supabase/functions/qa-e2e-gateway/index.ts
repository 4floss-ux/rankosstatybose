import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

// Statybos24 staging-only actor broker.
// Production JWT is validated with production Supabase Auth and the existing
// production QA allowlist. No client-chosen user ID, email or permissions.
const PROD_URL = "https://vxbfihnhielqambosmkc.supabase.co";
const PROD_PUBLISHABLE = "sb_publishable_fV4wji_VDNfHeBzmtvlwQw_D7jZjBiB";
const STAGE_REF = "wpldojonwvccdmpmlbfe";
const ORIGINS = new Set([
  "https://statybos24.lt", "https://www.statybos24.lt",
  "https://redesign-rankosstatybose.4floss.workers.dev",
  "http://localhost:5173",
]);
function cors(request: Request) {
  const origin = request.headers.get("origin") || "";
  return ORIGINS.has(origin) ? {
    "access-control-allow-origin": origin,
    "access-control-allow-headers": "authorization,apikey,content-type,x-client-info",
    "access-control-allow-methods": "POST,OPTIONS", "vary": "origin",
  } : {};
}
const respond = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status, headers: { "content-type": "application/json", "cache-control": "no-store", ...cors(req) },
  });

async function authorizedProdUser(token: string): Promise<boolean> {
  const prod = createClient(PROD_URL, PROD_PUBLISHABLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await prod.auth.getUser(token);
  if (error || !data.user?.id || !data.user.email_confirmed_at) return false;
  // Reuse the central server-side allowlist, rather than duplicating emails in JS.
  const check = await fetch(PROD_URL + "/functions/v1/qa-preview", {
    method: "POST",
    headers: {
      authorization: "Bearer " + token, apikey: PROD_PUBLISHABLE,
      "content-type": "application/json",
    },
    body: '{"op":"check"}',
  });
  if (!check.ok) return false;
  const result = await check.json().catch(() => null);
  return result?.ok === true && result?.authorized === true;
}

type Supa = ReturnType<typeof createClient>;
async function stageActors(db: Supa) {
  const users: Array<{id:string,email?:string}> = [];
  for (let page=1;page<=3;page++) {
    const {data,error} = await db.auth.admin.listUsers({page,perPage:100});
    if (error) throw Error("Actor list unavailable");
    users.push(...(data.users||[]).map(u => ({id:u.id,email:u.email})));
    if (!data.users || data.users.length < 100) break;
  }
  return users;
}

async function ensureWorkers(db: Supa) {
  const existing = await stageActors(db);
  for (let i=1;i<=10;i++) {
    const suffix = String(i).padStart(2,"0");
    const email = "qa-worker-" + suffix + "@example.invalid";
    if (existing.some(u => u.email?.toLowerCase() === email)) continue;
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    const password = Array.from(bytes).map(b=>b.toString(16).padStart(2,"0")).join("") + "X7!z";
    const {error} = await db.auth.admin.createUser({
      email, email_confirm: true, password,
      user_metadata: {
        role:"worker",first_name:"Bandomasis",last_name:"Kandidatas " + suffix,
        display_name:"Bandomasis Kandidatas " + suffix,
        birth_date:"1990-01-" + suffix,
        phone:"+370601" + String(1000+i).padStart(4,"0"),
      },
    });
    if (error && !/already registered|already exists/i.test(error.message)) {
      console.error("QA actor creation rejected", {index:i,code:error.code});
      throw Error("Test worker account could not be created: " + i);
    }
  }
  const users = await stageActors(db);
  const workers = Array.from({length:10}, (_,i) => {
    const suffix=String(i+1).padStart(2,"0");
    const user=users.find(x=>x.email?.toLowerCase()==="qa-worker-"+suffix+"@example.invalid");
    if (!user) throw Error("Test actor lookup incomplete");
    return {id:user.id,email:user.email!};
  });
  return workers;
}

async function seedAssociations(db: Supa, workers: Array<{id:string,email:string}>) {
  const now = new Date().toISOString();
  for (let i=1;i<=10;i++) {
    const worker = workers[i-1];
    const suffix = i.toString(16).padStart(12,"0");
    const {error:profileError} = await db.from("worker_profiles")
      .upsert({user_id:worker.id,last_active_at:now,availability_confirmed_at:now},{onConflict:"user_id"});
    if (profileError) throw Error("Test worker profile unavailable");
    const {error:appError} = await db.from("job_ad_applications")
      .update({worker_id:worker.id}).eq("id","f2000000-0000-4000-8000-"+suffix);
    if (appError) throw Error("Test application association failed");
    const {error:inviteError} = await db.from("job_invitations")
      .update({worker_id:worker.id}).eq("id","f3000000-0000-4000-8000-"+suffix);
    if (inviteError) throw Error("Test invitation association failed");
    if (i>1) {
      const {error:extraError} = await db.from("job_ad_applications").upsert({
        id:"f4000000-0000-4000-8000-"+suffix,
        ad_id:"f1000000-0000-4000-8000-000000000001",worker_id:worker.id,
        message:"TESTINĖ kandidatūra į pirmą skelbimą ("+i+")",
        status:i%2 ? "viewed":"sent",
      },{onConflict:"id"});
      if (extraError) throw Error("Test group application creation failed");
    }
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, {status:204,headers:cors(req)});
  if (req.method !== "POST") return respond(req,{error:"Method not allowed"},405);
  const origin = req.headers.get("origin");
  if (origin && !ORIGINS.has(origin)) return respond(req,{error:"Origin denied"},403);
  const token = req.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1] || "";
  if (!token || token.startsWith("sb_")) return respond(req,{error:"Sign in required"},401);
  if (!await authorizedProdUser(token)) return respond(req,{error:"Not authorized"},403);
  const url=Deno.env.get("SUPABASE_URL") || "";
  const secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url.includes(STAGE_REF + ".supabase.co") || !secret) {
    return respond(req,{error:"Staging environment unavailable"},503);
  }
  let body:{op?:string, role?:string, workerIndex?:number};
  try {
    const raw=await req.text();
    if (raw.length>256) throw Error("too big");
    body=JSON.parse(raw);
    if (!body || typeof body !== "object") throw Error("invalid");
  } catch { return respond(req,{error:"Bad request"},400); }
  if (body.op === "check") return respond(req,{ok:true,ready:true});
  if (body.op !== "actor") return respond(req,{error:"Unsupported operation"},400);
  if (!["worker","employer","admin"].includes(body.role||"")) {
    return respond(req,{error:"Unknown role"},400);
  }
  if (body.role === "worker" &&
      (!Number.isInteger(body.workerIndex) || (body.workerIndex||0)<1 || (body.workerIndex||0)>10)) {
    return respond(req,{error:"Invalid worker"},400);
  }
  const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  try {
    const workers=await ensureWorkers(db);
    await seedAssociations(db,workers);
    let email:string;
    if (body.role === "worker") {
      email = workers[(body.workerIndex||1)-1].email;
    } else {
      const {data:profiles,error:pError}=await db.from("profiles")
        .select("id,role,display_name")
        .eq("role",body.role).like("display_name","Testinis %").limit(3);
      if(pError || !profiles?.length) throw Error("Test role not found");
      const users=await stageActors(db);
      const account=users.find(u=>u.id===profiles[0].id && !!u.email);
      if(!account?.email) throw Error("Test identity missing");
      email=account.email;
    }
    const {data:magic,error:magicError}=await db.auth.admin.generateLink({type:"magiclink",email});
    const tokenHash=magic?.properties?.hashed_token;
    if(magicError || !tokenHash) throw Error("Could not create isolated test session");
    return respond(req,{ok:true,token_hash:tokenHash,verify_type:"magiclink",role:body.role});
  } catch(e) {
    console.error("staging QA actor failure", {name:e instanceof Error?e.message:"unknown"});
    return respond(req,{error:"Test accounts are not ready. Check staging QA logs."},503);
  }
});
