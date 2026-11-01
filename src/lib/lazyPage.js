import { lazy } from "react";

// Didelės svetainės dalys (darbuotojo, darbdavio, admin, /hire) kraunamos tik prireikus.
// Po naujo diegimo seni failai išnyksta – tokiu atveju puslapis vieną kartą perkraunamas.
const RELOAD_KEY = "s24-chunk-reload";

export function lazyPage(loader, exportName) {
  return lazy(() =>
    loader()
      .then((module) => {
        try { window.sessionStorage.removeItem(RELOAD_KEY); } catch { /* nėra saugyklos */ }
        return { default: module[exportName] };
      })
      .catch((error) => {
        let alreadyTried = false;
        try {
          alreadyTried = window.sessionStorage.getItem(RELOAD_KEY) === "1";
          if (!alreadyTried) window.sessionStorage.setItem(RELOAD_KEY, "1");
        } catch { alreadyTried = true; }
        if (!alreadyTried) {
          window.location.reload();
          return new Promise(() => {});
        }
        throw error;
      })
  );
}
