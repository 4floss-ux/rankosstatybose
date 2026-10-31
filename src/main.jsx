import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import "./styles.css";
import { unifiedCloseStyles } from "./ui/common.jsx";
import { PlatformLegalDocumentPage } from "./legal/LegalDialogs.jsx";
import { HirePage } from "./hire/HirePage.jsx";
import { HireEmployerLoginPage } from "./hire/hirePortalShared.jsx";
import { HireEmployerPortalPage } from "./hire/HireEmployerPortalPage.jsx";
import { App } from "./App.jsx";
import { mobileModalSafetyStyles, mobileResponsiveFixStyles } from "./styles/mobileStyles.js";
import { BackToTopButton, FatalAppError, MobilePopupBackGuard, SiteAnalyticsTracker } from "./app/siteChrome.jsx";

const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
const isHireRoute = currentPath === "/hire";
const isHireLoginRoute = currentPath === "/hire/login";
const isHirePortalRoute = currentPath === "/hire/portal";

// Load the site's primary fonts before the initial React paint to avoid the
// fallback-font -> webfont size/weight jump on hard refresh. Uses fonts already
// declared by styles.css; does not fetch arbitrary third-party stylesheets.
async function mountSiteWhenFontsReady() {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;
  if (document.fonts?.load) {
    const loading = Promise.allSettled([
      document.fonts.load('400 16px Inter'),
      document.fonts.load('700 16px Inter'),
      document.fonts.load('900 24px Manrope'),
      document.fonts.load('700 24px Manrope'),
    ]);
    // Never keep the site unavailable if font downloads are blocked.
    await Promise.race([loading, new Promise((resolve) => setTimeout(resolve, 2500))]);
  }
  createRoot(rootElement).render(
  <Sentry.ErrorBoundary fallback={<FatalAppError />}>
    {isHireLoginRoute ? (
      <HireEmployerLoginPage />
    ) : isHirePortalRoute ? (
      <HireEmployerPortalPage />
    ) : isHireRoute ? (
      <HirePage />
    ) : currentPath === "/naudojimosi-salygos" ? (
      <PlatformLegalDocumentPage kind="terms" />
    ) : currentPath === "/privatumo-politika" ? (
      <PlatformLegalDocumentPage kind="privacy" />
    ) : currentPath === "/rekvizitai" ? (
      <PlatformLegalDocumentPage kind="business" />
    ) : (
      <>
        <style>{unifiedCloseStyles}</style>
        <style>{mobileResponsiveFixStyles}</style>
        <style>{mobileModalSafetyStyles}</style>
        <App />
        <SiteAnalyticsTracker />
        <MobilePopupBackGuard />
        <BackToTopButton />
      </>
    )}
  </Sentry.ErrorBoundary>
  );
}

void mountSiteWhenFontsReady();
