export const HIRE_MESSAGE_LIMIT = 4000;

export function hireCompanyInitials(value) {
  return String(value || "Įmonė").replace(/^\[TEST ONLY\]\s*/i, "")
    .replace(/^(UAB|MB|IĮ|AB)\s+/i, "").replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim().split(/\s+/).filter(Boolean).slice(0, 2).map(word => [...word][0]).join("").toLocaleUpperCase("lt-LT") || "Į";
}

export function hireUnreadCount(messages, ownKind, readIds) {
  const other = ownKind === "admin" ? "employer" : "admin";
  return messages.filter(message => message.sender_kind === other && !readIds.has(message.id)).length;
}

// Only message IDs are remembered locally; no message text or session credentials.
export function loadHireReadIds(scope, storage) {
  try {
    if (!scope) return new Set();
    const ids = JSON.parse((storage || globalThis.localStorage)?.getItem(`s24-hire-read:v1:${scope}`) || "[]");
    return new Set(Array.isArray(ids) ? ids.filter(id => typeof id === "string").slice(-200) : []);
  } catch { return new Set(); }
}

export function saveHireReadIds(scope, ids, storage) {
  try {
    if (!scope) return;
    const target = storage || globalThis.localStorage;
    const key = `s24-hire-read:v1:${scope}`;
    const value = JSON.stringify([...ids].slice(-200));
    if (target?.getItem(key) !== value) target?.setItem(key, value);
  } catch { /* Reading messages must work even when browser storage is blocked. */ }
}

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
