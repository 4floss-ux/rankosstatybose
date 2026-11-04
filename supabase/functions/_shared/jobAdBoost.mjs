export const BOOST_AMOUNT = 499;
export const BOOST_CURRENCY = 'eur';
export const BOOST_DAYS = 7;
export function validBoostSession(session, order, environment) {
  return !!order && session?.mode === 'payment' && session.payment_status === 'paid'
    && session.livemode === (environment === 'live') && order.environment === environment
    && session.id === order.session_id && session.amount_total === BOOST_AMOUNT
    && order.amount_cents === BOOST_AMOUNT && session.currency === BOOST_CURRENCY
    && session.metadata?.kind === 'job_ad_boost' && session.metadata?.boost_order_id === order.id
    && session.metadata?.ad_id === order.ad_id && session.metadata?.company_id === order.company_id
    && session.client_reference_id === order.company_id;
}
export async function fulfilBoost({ admin, stripe, sessionId, environment, source = 'confirm', expectedAdId }) {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId || '')) throw new Error('Invalid checkout session');
  const session = await stripe(`checkout/sessions/${encodeURIComponent(sessionId)}`);
  if (expectedAdId && session.metadata?.ad_id !== expectedAdId) throw new Error('Payment belongs to a different advert');
  const id = session.metadata?.boost_order_id;
  if (!/^[0-9a-f-]{36}$/i.test(id || '')) throw new Error('Not a boost payment');
  const { data: order, error } = await admin.rpc('job_ad_boost_order', { p_order_id: id });
  if (!error && order && !order.session_id && validBoostSession(session, { ...order, session_id: session.id }, environment)) {
    const registration = await admin.rpc('job_ad_boost_register_session', { p_order_id: id, p_session_id: session.id });
    if (registration.error) throw new Error('Session registration failed');
    order.session_id = session.id;
  }
  if (error || !validBoostSession(session, order, environment)) throw new Error('Unverified boost payment');
  const result = await admin.rpc('job_ad_boost_activate_paid', { p_order_id: id, p_session_id: session.id,
    p_amount_cents: session.amount_total, p_currency: session.currency, p_environment: environment, p_source: source });
  if (result.error) throw new Error('Boost payment activation failed');
  return result.data;
}
export async function verifyStripeSignature(raw, header, secret, nowSeconds = Date.now() / 1000) {
  if (!secret || !header) return false;
  const parts = header.split(',').map(p => p.split('='));
  const t = parts.find(p => p[0] === 't')?.[1];
  if (!/^\d+$/.test(t || '') || Math.abs(nowSeconds - Number(t)) > 300) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${raw}`)));
  const expected = [...bytes].map(x => x.toString(16).padStart(2,'0')).join('');
  return parts.filter(p => p[0] === 'v1').some(([, value]) => {
    if (value?.length !== expected.length) return false;
    let different = 0; for(let i=0;i<expected.length;i++) different |= expected.charCodeAt(i) ^ value.charCodeAt(i);
    return different === 0;
  });
}
