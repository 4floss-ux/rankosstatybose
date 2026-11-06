import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

// Server-side authenticated access only. This preview never writes real records.
const ALLOWED_EMAIL_DIGESTS = new Set([
  "b960bbdbaa9f429d4c78f90e2c980e756d51c89f65b5a32917bd6eb1f4943a4c",
  "dff5bbf81cbcd479ce632a992586a8e140d740b3bd2c4ad669e23a119651d919",
  "c0912188fa877c3b2fa6ea6eed6d0b910726452330d3a942ad95e7acde4d141b",
]);
async function approvedVerifiedEmail(email: string): Promise<boolean> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email.trim().toLowerCase()));
  const digest = Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2,"0")).join("");
  return ALLOWED_EMAIL_DIGESTS.has(digest);
}
const ORIGINS = new Set([
  "https://statybos24.lt",
  "https://www.statybos24.lt",
  "https://redesign-rankosstatybose.4floss.workers.dev",
  "http://localhost:5173",
]);
const TYPES = [
  "jobs", "ads", "candidates", "workers", "employers",
  "invitations", "interviews", "messages", "favorites",
  "notifications", "documents", "payments", "bookings",
  "attendance", "ratings",
] as const;
type Collection = typeof TYPES[number];
type DemoItem = {
  id: string;
  title: string;
  status: string;
  number: number;
  city: string;
  note: string;
  daysLeft?: number;
  amount?: number;
  targetId?: string;
  [key: string]: string | number | boolean | undefined;
};
type State = Record<Collection, DemoItem[]>;
const titleByType: Record<Collection, string> = {
  jobs: "Dienos darbas", ads: "Darbo skelbimas",
  candidates: "Bandomasis kandidatas", workers: "Bandomasis darbuotojas",
  employers: "Bandomoji įmonė", invitations: "Kvietimas į darbą",
  interviews: "Pokalbis", messages: "Bandomoji žinutė",
  favorites: "Įsimintas skelbimas", notifications: "Pranešimas",
  documents: "Bandomasis CV", payments: "Mokėjimo peržiūra",
  bookings: "Darbo rezervacija", attendance: "Darbo laiko įrašas",
  ratings: "Įvertinimas",
};
const cities = ["Vilnius","Kaunas","Klaipėda","Šiauliai","Panevėžys","Alytus","Utena","Marijampolė","Jonava","Telšiai"];
const jobs = ["Mūro darbai","Vidaus apdaila","Stogo remontas","Elektros instaliacija","Dažymas","Betonavimas","Santechnika","Plytelių klojimas","Fasado šiltinimas","Grindų įrengimas"];
const jobStatuses = ["open","invited","confirmed","in_progress","completed","cancelled","open","confirmed","open","completed"];
const adStatuses = ["active","active","pending_payment","active","expired","active","active","active","active","active"];
const candidateStatuses = ["sent","viewed","interview","sent","rejected","interview","viewed","sent","interview","sent"];
function initialState(): State {
  const value = {} as State;
  for (const type of TYPES) {
    value[type] = Array.from({ length: 10 }, (_, index): DemoItem => {
      const n = index + 1;
      const id = type + "-" + String(n).padStart(2,"0");
      const title = type === "jobs" || type === "ads"
        ? "TESTAS " + String(n).padStart(2,"0") + " – " + jobs[index]
        : titleByType[type] + " " + String(n).padStart(2,"0");
      const status = type === "jobs" ? jobStatuses[index]
        : type === "ads" ? adStatuses[index]
        : type === "candidates" ? candidateStatuses[index]
        : type === "invitations" ? (index < 4 ? "pending" : index < 7 ? "accepted" : "declined")
        : type === "interviews" ? (index % 3 === 0 ? "confirmed" : "pending")
        : type === "notifications" ? "unread"
        : type === "favorites" ? "saved"
        : type === "payments" ? (index % 2 === 0 ? "paid_demo" : "unpaid_demo")
        : type === "bookings" ? (index < 6 ? "confirmed" : "pending")
        : type === "attendance" ? (index < 5 ? "present" : "missing")
        : type === "ratings" ? "published_demo" : "test";
      return {
        id, number: n, title, status, city: cities[index],
        note: "TIK TESTAVIMUI · netikras įrašas, nesiunčiami pranešimai ir nevykdomi mokėjimai.",
        daysLeft: type === "ads" ? 30 - index : undefined,
        amount: type === "payments" ? 9.99 : type === "jobs" ? 90 + index * 10 : undefined,
        targetId: type === "candidates" || type === "favorites" || type === "interviews"
          ? "ads-" + String(n).padStart(2,"0")
          : type === "invitations" || type === "bookings" || type === "attendance"
          ? "jobs-" + String(n).padStart(2,"0") : undefined,
      };
    });
  }
  return value;
}

function sanitizeAction(body: Record<string, unknown>, state: State): State | null {
  const collection = body.collection;
  const id = body.id;
  const action = body.action;
  if (typeof collection !== "string" || !TYPES.some((type) => type === collection) ||
    typeof id !== "string" || typeof action !== "string") return null;
  const type = collection as Collection;
  const items = state[type];
  const row = items.find((item) => item.id === id);
  if (!row) return null;

  if (action === "extend" && type === "ads") {
    row.daysLeft = Math.min(365, (row.daysLeft || 0) + 30);
    row.status = "active";
  } else if (action === "edit" && (type === "jobs" || type === "ads")) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (title.length < 3 || title.length > 100) return null;
    row.title = "TESTAS – " + title.replace(/^TESTAS\s*[–-]\s*/i,"");
  } else if (action === "delete" && (type === "ads" || type === "jobs")) {
    row.status = "removed";
  } else if (action === "read" && type === "notifications") {
    row.status = "read";
  } else if (action === "toggle" && type === "favorites") {
    row.status = row.status === "saved" ? "removed" : "saved";
  } else if (action === "invite" && (type === "candidates" || type === "workers")) {
    row.status = "interview";
  } else if (action === "apply" && type === "ads") {
    row.status = "applied_demo";
  } else if (action === "confirm" && ["invitations","interviews","bookings","attendance","ratings","payments"].includes(type)) {
    row.status = type === "payments" ? "paid_demo" : "confirmed";
  } else if (action === "reject" && ["candidates","invitations","bookings"].includes(type)) {
    row.status = "rejected";
  } else if (action === "message" && type === "messages") {
    const note = typeof body.note === "string" ? body.note.trim() : "";
    if (!note || note.length > 240) return null;
    row.note = "TESTINĖ ŽINUTĖ: " + note;
    row.status = "answered_demo";
  } else {
    return null;
  }
  return state;
}
function cors(req: Request): Record<string,string> {
  const origin = req.headers.get("origin") || "";
  return ORIGINS.has(origin) ? {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "authorization,apikey,content-type,x-client-info",
    "vary": "origin",
  } : {};
}
const reply = (req: Request, payload: unknown, code = 200) => new Response(
  JSON.stringify(payload), {
    status: code,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control":"no-store", ...cors(req) },
  }
);

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null,{status:204, headers:cors(req)});
  if (req.method !== "POST") return reply(req,{error:"Method not allowed"},405);
  if (req.headers.get("origin") && !ORIGINS.has(req.headers.get("origin") || "")) {
    return reply(req,{error:"Origin blocked"},403);
  }
  const auth = req.headers.get("authorization") || "";
  const token = auth.match(/^Bearer\s+(\S+)$/i)?.[1] || "";
  if (!token || token.startsWith("sb_")) return reply(req,{error:"Sign in required"},401);
  const url = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const serverKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !anonKey || !serverKey) return reply(req,{error:"QA preview unavailable"},503);

  // Validate the signed-in person server-side. Client email / user metadata are never trusted.
  const authClient = createClient(url,anonKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:userData,error:userError} = await authClient.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user) return reply(req,{error:"Sign in required"},401);
  if (!await approvedVerifiedEmail(String(user.email || "")) || !user.email_confirmed_at) {
    return reply(req,{error:"No access to test mode"},403);
  }
  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 1000) return reply(req,{error:"Request too large"},413);
    body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw Error("bad");
  } catch {
    return reply(req,{error:"Invalid request"},400);
  }
  if (body.op === "check") return reply(req,{ok:true,authorized:true});
  if (!["read","act","reset"].includes(String(body.op))) return reply(req,{error:"Invalid action"},400);

  const db = createClient(url,serverKey,{auth:{persistSession:false,autoRefreshToken:false}});
  for (let attempt=0;attempt<4;attempt++) {
    let {data:row,error:loadError} = await db.from("qa_preview_state")
      .select("payload,revision").eq("id","shared").maybeSingle();
    if (loadError) return reply(req,{error:"Preview data temporarily unavailable"},503);
    if (!row) {
      const createResult = await db.from("qa_preview_state").upsert(
        {id:"shared",payload:initialState(),revision:1},
        {onConflict:"id",ignoreDuplicates:true}
      );
      if (createResult.error) return reply(req,{error:"Preview initialization failed"},503);
      const second = await db.from("qa_preview_state").select("payload,revision").eq("id","shared").maybeSingle();
      if (second.error || !second.data) return reply(req,{error:"Preview initialization pending"},503);
      row = second.data;
    }
    if (body.op === "read") return reply(req,{ok:true,state:row.payload,revision:row.revision});
    const next = body.op === "reset"
      ? initialState()
      : sanitizeAction(body,structuredClone(row.payload) as State);
    if (!next) return reply(req,{error:"Unsupported test action"},400);
    const updated = await db.from("qa_preview_state")
      .update({payload:next,revision:Number(row.revision)+1,updated_at:new Date().toISOString()})
      .eq("id","shared").eq("revision",row.revision)
      .select("revision").maybeSingle();
    if (updated.error) return reply(req,{error:"Test action could not be saved"},503);
    if (updated.data) return reply(req,{ok:true,state:next,revision:updated.data.revision});
  }
  return reply(req,{error:"Another tester updated this data, retry"},409);
});
