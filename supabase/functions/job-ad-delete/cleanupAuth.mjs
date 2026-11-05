// Never transmit the cleanup secret: only a timestamp-bound HMAC goes through pg_net.
// This action can process only already-authorised deletion jobs in the private DB.
// A captured request can be replayed briefly, but cannot be used to delete an arbitrary advert.
const PAYLOAD_PREFIX="statybos24:job-ad-cleanup:v1:";
export async function verifyCleanupAuth(headers,secret,now=Date.now(),subtle=globalThis.crypto?.subtle){
 if(typeof secret!=="string"||secret.length<32||!subtle)return false;
 const timestamp=headers.get("x-s24-cleanup-ts")||"";
 const signature=headers.get("x-s24-cleanup-signature")||"";
 if(!/^\d{10}$/.test(timestamp)||!/^[a-f\d]{64}$/i.test(signature))return false;
 const time=Number(timestamp)*1000;
 if(!Number.isSafeInteger(time)||Math.abs(now-time)>120000)return false;
 const bytes=new Uint8Array(32);
 for(let i=0;i<32;i++)bytes[i]=Number.parseInt(signature.slice(i*2,i*2+2),16);
 const key=await subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["verify"]);
 return subtle.verify("HMAC",key,bytes,new TextEncoder().encode(PAYLOAD_PREFIX+timestamp));
}
