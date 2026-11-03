import { Suspense } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import "../styles.css";
import "../p24/p24.css";
import { AppBootLoader } from "../ui/AppBootLoader.jsx";
import { FatalAppError } from "../app/siteChrome.jsx";
import { lazyPage } from "../lib/lazyPage.js";

// Atskiras įėjimas: pagrindinės svetainės App ir dashboard čia neimportuojami.
const HirePage = lazyPage(() => import("./HirePage.jsx"), "HirePage");
const HireLogin = lazyPage(() => import("./hirePortalShared.jsx"), "HireEmployerLoginPage");
const HirePortal = lazyPage(() => import("./HireEmployerPortalPage.jsx"), "HireEmployerPortalPage");
const path = window.location.pathname.replace(/\/+$/, "") || "/";
async function mountHire() {
  if (document.fonts?.load) {
    await Promise.race([
      Promise.allSettled([document.fonts.load('400 16px Inter'), document.fonts.load('700 16px Inter'), document.fonts.load('900 24px Manrope'), document.fonts.load('700 24px Manrope')]),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
  }
  createRoot(document.getElementById("root")).render(
  <Sentry.ErrorBoundary fallback={<FatalAppError />}>
    <Suspense fallback={<AppBootLoader />}>
      {path === "/login" ? <HireLogin /> : path === "/portal" ? <HirePortal /> : path === "/" ? <HirePage /> : <p>Page not found.</p>}
    </Suspense>
  </Sentry.ErrorBoundary>
);

}
void mountHire();
