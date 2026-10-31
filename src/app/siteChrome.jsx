import { useEffect, useState } from "react";
import { supabase } from "../lib/config.js";
import { applyBrandFavicon } from "../ui/brand.jsx";

export function SiteAnalyticsTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const hostname = String(window.location.hostname || "").toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".local")
    ) {
      return undefined;
    }

    let cancelled = false;

    async function sendVisit() {
      try {
        const observerKey = "s24_analytics_observer_v1";
        const visitorKey = "s24_visitor_id_v1";

        if (window.localStorage.getItem(observerKey) === "1") {
          return;
        }

        const sessionResult = await supabase.auth.getSession();
        if (cancelled) return;

        const sessionUser = sessionResult.data?.session?.user || null;
        const signedInAdministrator = sessionUser
          ? (await supabase.rpc("is_admin")).data === true
          : false;
        if (signedInAdministrator || sessionUser?.app_metadata?.analytics_excluded === true) {
          window.localStorage.setItem(observerKey, "1");
          return;
        }

        let visitorId = window.localStorage.getItem(visitorKey);
        if (!visitorId) {
          visitorId =
            typeof crypto?.randomUUID === "function"
              ? crypto.randomUUID()
              : `s24-${Date.now()}-${Math.random()
                  .toString(36)
                  .slice(2)}-${Math.random().toString(36).slice(2)}`;
          window.localStorage.setItem(visitorKey, visitorId);
        }

        await fetch("/api/analytics/visit", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            visitorId,
            userId: sessionUser?.id || null,
          }),
          keepalive: true,
          credentials: "same-origin",
        });
      } catch {
        // Lankomumo skaitiklis niekada neturi trukdyti naudotis svetaine.
      }
    }

    sendVisit();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

export function MobilePopupBackGuard() {
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return undefined;
    }

    if (!window.matchMedia("(max-width: 760px)").matches) {
      return undefined;
    }

    const popupSelector = [
      '[role="dialog"][aria-modal="true"]',
      '.account-delete-overlay',
      '.admin-chat-overlay',
      '.admin-modal-overlay',
      '.admin-setup-overlay',
      '.admin-team-chat-overlay',
      '.ctc-overlay',
      '.ed-attendance-overlay',
      '.ed-plan-overlay',
      '.ed-rating-overlay',
      '.ed-saved-overlay',
      '.ed-team-overlay',
      '.ed-urgent-overlay',
      '.lt-chat-overlay',
      '.lt-employment-overlay',
      '.lt-end-notice-overlay',
      '.reliability-modal-overlay',
      '.rs-modal-overlay',
      '.wd-job-info-overlay',
    ].join(",");

    const guardKey = "__statybos24MobileBackGuard";
    let passingThrough = false;
    let destroyed = false;

    const isVisible = (element) => {
      if (!(element instanceof HTMLElement)) return false;

      const style = window.getComputedStyle(element);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        Number(style.opacity || 1) === 0
      ) {
        return false;
      }

      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };

    const popupRoots = () => {
      const visible = Array.from(
        document.querySelectorAll(popupSelector)
      ).filter(isVisible);

      return visible.filter(
        (element) =>
          !visible.some(
            (candidate) =>
              candidate !== element &&
              candidate.contains(element) &&
              isVisible(candidate)
          )
      );
    };

    const topPopup = () => {
      const roots = popupRoots();
      if (!roots.length) return null;

      return roots
        .map((element, index) => ({
          element,
          index,
          z: Number.parseInt(window.getComputedStyle(element).zIndex, 10) || 0,
        }))
        .sort((a, b) => (a.z === b.z ? a.index - b.index : a.z - b.z))
        .at(-1)?.element || null;
    };

    const closeTopPopup = () => {
      const popup = topPopup();
      if (!popup) return false;

      const closeSelectors = [
        'button[aria-label*="Uždaryti"]',
        'button[title*="Uždaryti"]',
        '.rs-close',
        '.reliability-modal-close',
        '.account-delete-close',
        '.admin-setup-close',
        '.ctc-close',
        '.ed-attendance-close',
        '.ed-rating-close',
        '.lt-chat-close',
        '.wd-job-info-close',
        '.wd-profile-editor-close',
      ];

      const closeButton = popup.querySelector(closeSelectors.join(","));

      if (
        closeButton instanceof HTMLButtonElement &&
        !closeButton.disabled
      ) {
        closeButton.click();
        return true;
      }

      const textCloseButton = Array.from(
        popup.querySelectorAll("button")
      ).find((button) => {
        if (!(button instanceof HTMLButtonElement) || button.disabled) {
          return false;
        }

        const label = String(button.textContent || "").trim();
        return (
          label === "Uždaryti" ||
          label === "Atšaukti" ||
          label === "Grįžti"
        );
      });

      if (textCloseButton instanceof HTMLButtonElement) {
        textCloseButton.click();
        return true;
      }

      // Most remaining overlays already support closing by tapping the
      // dimmed background. Dispatch directly on the overlay so React receives
      // target === currentTarget.
      if (String(popup.className || "").includes("overlay")) {
        popup.dispatchEvent(
          new PointerEvent("pointerdown", {
            bubbles: true,
            cancelable: true,
            pointerType: "touch",
          })
        );
        popup.dispatchEvent(
          new MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            view: window,
          })
        );
        popup.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window,
          })
        );
      }

      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          code: "Escape",
          bubbles: true,
          cancelable: true,
        })
      );

      return true;
    };

    const armGuard = () => {
      if (destroyed) return;

      if (window.history.state?.[guardKey]) {
        return;
      }

      window.history.pushState(
        {
          ...(window.history.state || {}),
          [guardKey]: true,
        },
        "",
        window.location.href
      );
    };

    // Keep one duplicate entry above the real page for the whole mobile
    // session. This makes Android/iOS Back deterministic even if a popup was
    // opened without causing a DOM mutation that an observer could notice.
    armGuard();

    const onPopState = () => {
      if (destroyed) return;

      if (passingThrough) {
        passingThrough = false;
        return;
      }

      const popup = topPopup();
      if (!popup && window.history.state?.employerCalendarTransition) return;

      if (popup) {
        closeTopPopup();

        // Back just consumed our guard entry. Add it again so another Back
        // closes another popup (if stacked) instead of leaving the site.
        window.setTimeout(() => {
          if (!destroyed) armGuard();
        }, 0);
        return;
      }

      // No popup is open: transparently consume the guard and continue to the
      // user's real previous page, so normal Back behaviour stays unchanged.
      passingThrough = true;
      window.setTimeout(() => {
        if (!destroyed) window.history.back();
      }, 0);
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      destroyed = true;
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  return null;
}


export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setVisible(window.scrollY > 420);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateVisibility);
    };
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Grįžti į puslapio viršų"
      title="Į viršų"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      style={{
        position: "fixed",
        right: 18,
        bottom: 18,
        zIndex: 850,
        width: 42,
        height: 42,
        padding: 0,
        border: "1px solid #d7e0e7",
        borderRadius: "50%",
        background: "rgba(255,255,255,.94)",
        color: "#526374",
        boxShadow: "0 6px 20px rgba(34,38,49,.12)",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "block",
          width: 10,
          height: 10,
          borderLeft: "2px solid currentColor",
          borderTop: "2px solid currentColor",
          transform: "rotate(45deg) translate(2px, 2px)",
        }}
      />
    </button>
  );
}

export function FatalAppError() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#f4f7f9",
        color: "#222631",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <section
        style={{
          width: "min(100%, 520px)",
          padding: 28,
          borderRadius: 18,
          background: "#fff",
          border: "1px solid #e4ebf0",
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: "0 0 10px", fontSize: 24 }}>Nepavyko parodyti puslapio</h1>
        <p style={{ margin: "0 0 20px", color: "#607080", lineHeight: 1.55 }}>
          Techninė klaida užregistruota. Perkraukite puslapį ir bandykite dar kartą.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            minHeight: 44,
            padding: "10px 18px",
            border: 0,
            borderRadius: 10,
            background: "#f0b429",
            color: "#222631",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Perkrauti puslapį
        </button>
      </section>
    </main>
  );
}

applyBrandFavicon();
