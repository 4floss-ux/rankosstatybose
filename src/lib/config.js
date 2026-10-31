import * as Sentry from "@sentry/react";
import { createClient } from "@supabase/supabase-js";
import { getPasswordRecoveryLocation } from "../auth/passwordRecovery.jsx";

export const SENTRY_DSN =
  "https://eb5281a0e8cff473a77d220ecacb2a9c@o4512187961376768.ingest.de.sentry.io/4512187977760848";

export function sanitizeSentryUrl(value) {
  if (!value) return value;
  try {
    const url = new URL(value, window.location.origin);
    return `${url.origin}${url.pathname}`;
  } catch {
    return undefined;
  }
}

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: import.meta.env.PROD,
  environment: import.meta.env.PROD ? "production" : "development",
  sendDefaultPii: false,
  attachStacktrace: true,
  maxBreadcrumbs: 30,
  beforeBreadcrumb(breadcrumb) {
    if (["console", "ui.click", "ui.input"].includes(breadcrumb?.category)) {
      return null;
    }

    if (breadcrumb?.data?.url) {
      breadcrumb.data.url = sanitizeSentryUrl(breadcrumb.data.url);
    }

    return breadcrumb;
  },
  beforeSend(event) {
    event.user = undefined;

    if (event.request) {
      event.request = {
        ...event.request,
        url: sanitizeSentryUrl(event.request.url),
        cookies: undefined,
        headers: undefined,
        data: undefined,
        query_string: undefined,
      };
    }

    return event;
  },
});

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
// Capture the recovery callback before Supabase removes auth tokens from the URL.
export const initialPasswordRecovery = getPasswordRecoveryLocation(window.location.href);
// The main site and /hire have independent browser authentication sessions.
// The /hire app uses its own memory-only Supabase Auth client for the private
// test sign-in and keeps the issued employer portal token separately.
// Do not load, persist, or broadcast main-site sessions when visiting /hire.
export const isHireProjectPath = /^\/hire(?:\/|$)/.test(window.location.pathname);
// PWA branding is registered only for the main statybos24.lt project, never /hire.
if (!isHireProjectPath && typeof document !== "undefined") {
  if (!document.querySelector('link[rel="manifest"]')) {
    const manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.href = "/statybos24.webmanifest?v=2";
    document.head.appendChild(manifest);
  }
  if (!document.querySelector('link[rel="apple-touch-icon"]')) {
    const touchIcon = document.createElement("link");
    touchIcon.rel = "apple-touch-icon";
    touchIcon.href = "/statybos24-touch-icon-v2.png";
    document.head.appendChild(touchIcon);
  }
}
// The install prompt is a short-lived browser event. Capture it before React mounts.
// This applies only to the main Statybos24.lt project, never /hire.
export let statybos24DeferredInstallPrompt = null;
export let statybos24PwaInstalledInSession = false;
export const statybos24InstallListeners = new Set(); export function clearStatybos24DeferredInstallPrompt() { statybos24DeferredInstallPrompt = null; }
export function statybos24IsStandalone() {
  if (typeof window === "undefined") return false;
  return statybos24PwaInstalledInSession ||
    window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    window.navigator?.standalone === true;
}
export function statybos24NotifyInstallListeners() {
  for (const callback of statybos24InstallListeners) callback();
}
if (!isHireProjectPath && typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    statybos24DeferredInstallPrompt = event;
    statybos24NotifyInstallListeners();
  });
  window.addEventListener("appinstalled", () => {
    statybos24PwaInstalledInSession = true;
    statybos24DeferredInstallPrompt = null;
    statybos24NotifyInstallListeners();
  });
  // Register the existing push service worker on initial visit too, not just
  // after users opt in to notifications. Registration does NOT ask for push permission.
  if (window.isSecureContext && "serviceWorker" in navigator) {
    const registerMainSiteWorker = () => {
      navigator.serviceWorker.register("/statybos24-push-sw.js", {
        scope: "/", updateViaCache: "none",
      }).catch(() => {});
    };
    if (document.readyState === "complete") registerMainSiteWorker();
    else window.addEventListener("load", registerMainSiteWorker, {once: true});
  }
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, isHireProjectPath ? {
      auth: {
        storageKey: "statybos24-hire-private-auth-v1",
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    } : undefined)
  : null;
export const TERMS_VERSION = "2026-10-05-v6";
export const JOB_SCOPE_ACK_VERSION = "2026-10-02-v1";
export const PRIVACY_VERSION = "2026-10-26-v7";
export const PRIVACY_CONTACT_EMAIL = "info@statybos24.lt";
export const PUBLIC_BUSINESS_NAME = "Statybos24";
export const PUBLIC_BUSINESS_ACTIVITY = "Individuali veikla pagal pažymą";
export const PUBLIC_BUSINESS_NUMBER = "1521110";
// Individualios veiklos vykdytojas ir duomenų valdytojas (sutampa su rekvizitais).
export const PUBLIC_CONTROLLER_FULL_NAME = "Alanas Staponas";

export function getVilniusTodayISO() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Vilnius",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function workerBirthDateError(value, required = false) {
  const date = String(value || "").trim();
  if (!date) return required ? "Nurodykite gimimo datą." : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return "Įveskite teisingą gimimo datą.";
  }
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    return "Įveskite teisingą gimimo datą.";
  }
  if (date < "1900-01-01" || date > getVilniusTodayISO()) {
    return "Gimimo data negali būti ateityje arba ankstesnė nei 1900 m.";
  }
  return "";
}
