import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
const PRODUCTION_URL = "https://vxbfihnhielqambosmkc.supabase.co";
const PRODUCTION_PUBLIC_KEY = "sb_publishable_fV4wji_VDNfHeBzmtvlwQw_D7jZjBiB";
const HASHES = new Set([
  "b960bbdbaa9f429d4c78f90e2c980e756d51c89f65b5a32917bd6eb1f4943a4c",
  "dff5bbf81cbcd479ce632a992586a8e140d740b3bd2c4ad669e23a119651d919",
  "c0912188fa877c3b2fa6ea6eed6d0b910726452330d3a942ad95e7acde4d141b"
]);
const TEST_ORIGIN = "https://4floss-ux.github.io";
const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": TEST_ORIGIN,
  "access-control-allow-headers": "authorization, content-type,apikey,x-client-info",
  "access-control-allow-methods": "POST, OPTIONS"
};
function answer(code: number, body: Record<string,unknown>) {
  return new Response(JSON.stringify(body), {status:code,headers:HEADERS});
}
async function allowedEmail(email: string) {
  const sha = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email.trim().toLowerCase()));
  const hex = Array.from(new Uint8Array(sha)).map(x=>x.toString(16).padStart(2,"0")).join("");
  return HASHES.has(hex);
}

type DemoRole = "worker" | "employer" | "admin";
const DEMO_WORKERS: [string,string,string,string][] = [
 ["Mantas","Testaitis","Vilnius","Mūrininkas"],
 ["Lukas","Bandaitis","Kaunas","Apdailininkas"],
 ["Paulius","Statybinis","Klaipėda","Stogdengys"],
 ["Tomas","Mūrinas","Šiauliai","Elektrikas"],
 ["Darius","Dažinis","Panevėžys","Dažytojas"],
 ["Arūnas","Meistraitis","Alytus","Betonuotojas"],
 ["Vytautas","Plytelinis","Utena","Santechnikas"],
 ["Karolis","Stoginis","Marijampolė","Plytelių klojėjas"],
 ["Rokas","Betoninis","Jonava","Fasadų meistras"],
];
const DEMO_EMPLOYERS: [string,string,string,string][] = [
 ["Andrius","Bandys","Vilnius","TESTAS Statybų komanda 02"],
 ["Rasa","Testė","Kaunas","TESTAS Statybų komanda 03"],
 ["Mindaugas","Mūras","Klaipėda","TESTAS Statybų komanda 04"],
 ["Justina","Mokė","Šiauliai","TESTAS Statybų komanda 05"],
 ["Saulius","Darbas","Panevėžys","TESTAS Statybų komanda 06"],
 ["Aistė","Bandomė","Alytus","TESTAS Statybų komanda 07"],
 ["Tadas","Statys","Utena","TESTAS Statybų komanda 08"],
 ["Inga","Meistrė","Marijampolė","TESTAS Statybų komanda 09"],
 ["Gintaras","Stogas","Jonava","TESTAS Statybų komanda 10"],
];
// All addresses are synthetic under the reserved .test TLD. Accounts cannot
// sign in with a password and no email is sent on Admin API createUser.
async function ensureQaPeople(db: ReturnType<typeof createClient>): Promise<void> {
 const users = await db.auth.admin.listUsers({page:1,perPage:100});
 if(users.error) throw new Error("Cannot inspect staging test users");
 const existing = new Set((users.data?.users||[]).map(u=>String(u.email||"").toLowerCase()));
 const queue: Array<{email:string,metadata:Record<string,unknown>}>=[];
 for (const role of ["worker","employer"] as const) {
   const people = role==="worker" ? DEMO_WORKERS : DEMO_EMPLOYERS;
   for (let i=0;i<people.length;i++){
      const [first,last,city,extra]=people[i];
      const num=String(i+2).padStart(2,"0");
      const email=`qa.${role}.${num}@statybos24.test`;
      if(existing.has(email))continue;
      const metadata: Record<string,unknown>={
        role,first_name:first,last_name:last,city,
        phone: role==="worker" ? "+3706000"+String(i+2).padStart(4,"0")
                              : "+3706001"+String(i+2).padStart(4,"0"),
        employer_type:"individual",
      };
      if(role==="worker") metadata.birth_date=`${1988+i}-01-15`;
      else metadata.company_name=extra;
      queue.push({email,metadata});
   }
 }
 // Bounded sequential creation: signup triggers create the real profiles,
 // worker profile and employer company using the same production schema.
 const failures:string[]=[];
 for(const entry of queue){
   const result=await db.auth.admin.createUser({
     email:entry.email,email_confirm:true,user_metadata:entry.metadata,
   });
   if(result.error && !/already|registered|exists/i.test(result.error.message)){
     failures.push(result.error.code||"create_failed");
   }
   if(!result.error && result.data?.user?.id && entry.metadata.role==="worker"){
     await db.from("worker_profiles").update({
       short_bio:"TESTAS · Statybų specialistas. Bandomasis darbuotojo profilis.",
       years_experience:4,
       availability_confirmed_at:new Date().toISOString()
     }).eq("user_id",result.data.user.id);
     const workerNum=Number(entry.email.split("@")[0].split(".").pop() || 0);
     if(workerNum>=2 && workerNum<=10){
       const jobId="f0000000-0000-4000-8000-"+String(workerNum).padStart(12,"0");
       await db.from("job_invitations").insert({
         job_id:jobId,worker_id:result.data.user.id,
         status:"pending",message:"TESTAS · Kviečiame į bandomąjį darbą.",
         invited_at:new Date().toISOString()
       });
     }
   }
   if(!result.error && result.data?.user?.id && entry.metadata.role==="employer"){
     const company=await db.from("companies").select("id")
       .eq("owner_id",result.data.user.id).maybeSingle();
     if(company.data?.id){
       await db.from("job_ads").insert({
         company_id:company.data.id,created_by:result.data.user.id,
         title:"TESTAS · "+String(entry.metadata.company_name||"Statybų komanda")+" ieško darbuotojo",
         city:String(entry.metadata.city||"Vilnius"),
         salary_min:1500,salary_max:2100,
         description:"Tik testavimui. Bandomosios įmonės skelbimas ir darbuotojų paieška.",
         status:"active",published_at:new Date().toISOString(),
         expires_at:new Date(Date.now()+30*86400000).toISOString()
       });
     }
   }
 }
 if(failures.length)console.error("QA seed incomplete:",failures.join(","));
}

async function refreshQaWorkerPresence(db: ReturnType<typeof createClient>): Promise<void> {
  // Staging-only test account refresh: the normal production matching logic
  // requires a recent worker login + availability confirmation (<24 hours).
  // These are dedicated, synthetic test workers, never production users.
  const list = await db.from("profiles")
    .select("id,display_name,role").eq("role","worker").limit(50);
  if(list.error) throw new Error("Could not inspect isolated test workers");
  const names = new Set(DEMO_WORKERS.map(([first,last])=>first+" "+last));
  const testIds = (list.data||[])
    .filter(p=>names.has(p.display_name)||p.id==="ddc83b32-ceed-430e-8db1-2e55140fec88")
    .map(p=>p.id);
  if(testIds.length===0) return;
  const at = new Date().toISOString();
  const update = await db.from("worker_profiles")
    .update({last_active_at:at,availability_confirmed_at:at})
    .in("user_id",testIds);
  if(update.error) console.error("QA test worker refresh failed",update.error.code);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null,{status:204,headers:HEADERS});
  if (req.method !== "POST") return answer(405,{error:"Unsupported method"});
  const origin = req.headers.get("origin");
  if (origin && origin !== TEST_ORIGIN) return answer(403,{error:"Origin denied"});
  const bearer = req.headers.get("authorization") || "";
  const prodToken = /^Bearer\s+(\S+)$/i.exec(bearer)?.[1];
  if (!prodToken || prodToken.startsWith("sb_")) return answer(401,{error:"Real Statybos24 sign-in is required"});
  const prod = createClient(PRODUCTION_URL, PRODUCTION_PUBLIC_KEY, {
    auth:{persistSession:false,autoRefreshToken:false}
  });
  const {data:identity,error:identityError} = await prod.auth.getUser(prodToken);
  if (identityError || !identity?.user?.email || !identity.user.email_confirmed_at ||
      !await allowedEmail(identity.user.email)) {
    return answer(403,{error:"Tester account is not authorized"});
  }
  let body: {role?:string;actor_id?:string};
  try {
    const text = await req.text();
    if (text.length>150) return answer(413,{error:"Too long"});
    body=JSON.parse(text);
  } catch {return answer(400,{error:"Invalid request"});}
  const role = body?.role;
  if (role === "check") {
    const stageUrl = Deno.env.get("SUPABASE_URL") || "";
    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if(!stageUrl.includes("wpldojonwvccdmpmlbfe")||!secret)
      return answer(503,{error:"Staging-only check is not configured"});
    const stage = createClient(stageUrl,secret,{auth:{persistSession:false,autoRefreshToken:false}});
    await refreshQaWorkerPresence(stage);
    return answer(200,{ok:true,authorized:true});
  }
  if (!["worker","employer","admin","list"].includes(String(role)))
    return answer(400,{error:"Invalid role"});
  const url = Deno.env.get("SUPABASE_URL") || "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url.includes("wpldojonwvccdmpmlbfe") || !service) {
    return answer(503,{error:"Staging-only authentication is not configured"});
  }
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const defaultIds:Record<string,string>={
    worker:"ddc83b32-ceed-430e-8db1-2e55140fec88",
    employer:"2be77bf0-3c64-45c5-9db0-a2a296fa7834",
    admin:"4238515f-2976-4b11-99d5-4df643361240"
  };
  if (role === "list") {
    // Only an owner verified by production Auth can provision test users.
    // Never create or mutate users on the production project.
    await ensureQaPeople(db);
    await refreshQaWorkerPresence(db);
    const all=await db.from("profiles").select("id,role,display_name,city")
      .in("role",["worker","employer","admin"]).order("display_name",{ascending:true}).limit(70);
    if(all.error)return answer(503,{error:"Could not load test people",code:all.error.code});
    const actors=(all.data||[]).filter(item => item.id===defaultIds[item.role]
      || item.display_name?.includes("TESTAS")
      || DEMO_WORKERS.some(([first,last])=>item.display_name===first+" "+last)
      || DEMO_EMPLOYERS.some(([first,last])=>item.display_name===first+" "+last))
      .map(item=>({id:item.id,role:item.role,name:item.display_name,city:item.city}));
    const workerCount=actors.filter(a=>a.role==="worker").length;
    const employerCount=actors.filter(a=>a.role==="employer").length;
    return answer(200,{ok:true,actors,
      warning:workerCount<10||employerCount<10 ?
       "Ne visi bandomieji žmonės sukurti. Atnaujinkite testavimo puslapį." : null
    });
  }
  const candidateId=typeof body?.actor_id==="string" ? body.actor_id : defaultIds[String(role)];
  if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/.test(candidateId||""))
    return answer(400,{error:"Invalid test identity"});
  const profile=await db.from("profiles").select("id,role,display_name")
    .eq("id",candidateId).eq("role",role).maybeSingle();
  if(profile.error || !profile.data)return answer(403,{error:"Test identity is not allowed"});
  const {data:actor,error:actorError}=await db.auth.admin.getUserById(candidateId);
  if (actorError || !actor?.user?.email) {
    console.error("qa-actor: staging user lookup failed", actorError?.status, actorError?.code);
    return answer(503,{error:"Test identity lookup failed",code:"TEST_ACTOR_AUTH_LOOKUP_ERROR"});
  }
  if(!actor.user.email.toLowerCase().endsWith("@statybos24.test") && candidateId!==defaultIds[String(role)]) {
    return answer(403,{error:"Not a synthetic test account"});
  }
  const link=await db.auth.admin.generateLink({type:"magiclink",email:actor.user.email});
  const hash=link.data?.properties?.hashed_token;
  if(link.error||!hash)return answer(503,{error:"Unable to switch test identity"});
  return answer(200,{ok:true,role,token_hash:hash,type:"magiclink"});
});