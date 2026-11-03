export const HIRE_ORIGIN = "https://hire.statybos24.lt";

export function isHireHostname(hostname) {
  return String(hostname).toLowerCase() === "hire.statybos24.lt";
}

// Tik senų puslapių GET/HEAD adresai; paskyros sesija neperkeliama tarp domenų.
export function legacyHireRedirect(input, method = "GET") {
  if (!["GET", "HEAD"].includes(method)) return null;
  const url = new URL(input);
  if (!/^\/hire(?:\/|$)/.test(url.pathname)) return null;
  const path = url.pathname.slice(5) || "/";
  const target = new URL(HIRE_ORIGIN);
  target.pathname = path;
  target.search = url.search;
  target.hash = url.hash;
  return target.href;
}
