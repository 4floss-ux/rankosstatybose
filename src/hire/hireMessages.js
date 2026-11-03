export const HIRE_MESSAGE_LIMIT = 4000;

export function hireMessageCall({ requestId, sessionToken }, body, clientId) {
  const admin = Boolean(requestId);
  if (admin === Boolean(sessionToken)) throw new Error("Invalid message context");
  const args = admin ? { p_request_id: requestId } : { p_session_token: sessionToken };
  const prefix = admin ? "admin" : "employer";
  if (body === undefined) return { name: `hire_${prefix}_messages`, args };
  const text = String(body).trim();
  if (!text || [...text].length > HIRE_MESSAGE_LIMIT || !clientId) throw new Error("Invalid message");
  return { name: `hire_${prefix}_send_message`, args: { ...args, p_body: text, p_client_id: clientId } };
}
