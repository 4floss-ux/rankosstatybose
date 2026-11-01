import { useEffect, useRef, useState } from "react";
import "../p24.css";
import { LANDING_HTML } from "./landingHtml.js";
import { clearStatybos24DeferredInstallPrompt, statybos24DeferredInstallPrompt } from "../../lib/config.js";
import { Svg } from "../Shell.jsx";

// Naujas pradinis puslapis – prototipo HTML 1:1 (statinis turinys), mygtukai prijungti prie tikrų veiksmų.
export function PublicLandingP24({ onLogin, onEmployerSignup, onWorkerSignup }) {
  const rootRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toTop, setToTop] = useState(false);
  const [appModal, setAppModal] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    // Atsiradimo animacijos ([data-rv]) ir antraštės žodžiai kaip prototipe
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const items = root.querySelectorAll("[data-rv]");
    let observer = null;
    if (reduce || !("IntersectionObserver" in window)) items.forEach((el) => el.classList.add("in"));
    else {
      observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("in"); observer.unobserve(entry.target); }
      }), { rootMargin: "0px 0px -8% 0px" });
      items.forEach((el) => observer.observe(el));
    }
    const onScroll = () => {
      const left = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
      setToTop(window.scrollY > 600 && left < 1100);
      const button = root.querySelector(".lp-totop");
      const foot = root.querySelector(".foot");
      if (!button || !foot) return;
      const base = window.innerWidth < 900 ? 84 : 24;
      const over = window.innerHeight - foot.getBoundingClientRect().top;
      const copy = foot.querySelector(".lp-ft-bot > span") || foot;
      const rect = copy.getBoundingClientRect();
      button.style.bottom = `${Math.max(base, window.innerWidth < 900 ? window.innerHeight - (rect.top + rect.height / 2) - 22 : over + 16)}px`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); observer?.disconnect(); };
  }, []);

  const openVideo = (fullscreen) => {
    const video = rootRef.current?.querySelector("#lp-video");
    const box = video?.closest(".lp-vbox");
    if (!video || !box) return;
    box.classList.add("on");
    video.controls = true;
    video.play().catch(() => {});
    if (!fullscreen) return;
    if (box.requestFullscreen && document.fullscreenEnabled) box.requestFullscreen().catch(() => {});
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
  };

  const onClick = (event) => {
    const link = event.target.closest("[data-scroll]");
    if (link) {
      event.preventDefault();
      setMenuOpen(false);
      document.getElementById(link.dataset.scroll)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const el = event.target.closest("[data-act]");
    if (!el) return;
    const act = el.dataset.act;
    const v = el.dataset.v;
    if (["auth", "lpMenu", "lpTop", "lpPlay", "lpFs", "lpFsX", "lpApp"].includes(act)) event.preventDefault();
    if (act === "auth") {
      setMenuOpen(false);
      if (v === "login") onLogin();
      else if (v === "signup-emp") onEmployerSignup();
      else onWorkerSignup();
    } else if (act === "lpMenu") setMenuOpen((value) => !value);
    else if (act === "lpTop") { setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else if (act === "lpPlay") openVideo(false);
    else if (act === "lpFs") openVideo(true);
    else if (act === "lpFsX") { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); }
    else if (act === "lpApp") {
      if (statybos24DeferredInstallPrompt) {
        const prompt = statybos24DeferredInstallPrompt;
        clearStatybos24DeferredInstallPrompt();
        prompt.prompt?.();
      } else setAppModal(true);
    }
  };

  return (
    <div className={`p24 lp-js${menuOpen ? " lpm" : ""}${toTop ? " lp-up" : ""}`} ref={rootRef} onClick={onClick}>
      <div dangerouslySetInnerHTML={{ __html: LANDING_HTML }} style={{ display: "contents" }} />
      {appModal && (
        <div className="modal-bg" onClick={(event) => { if (event.target === event.currentTarget) setAppModal(false); }}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="m-title">
            <header>
              <div><span className="eyebrow">Programėlė</span><h2 id="m-title">Kaip įdiegti statybos24?</h2><p className="muted" style={{ margin: "6px 0 0" }}>Užtrunka kelias sekundes. Programėlė atsiras jūsų telefono pradžios ekrane.</p></div>
              <button type="button" className="x" aria-label="Uždaryti" onClick={() => setAppModal(false)}><Svg name="x" size={18} width={2.2} /></button>
            </header>
            <div className="lp-inst">
              <div><b>iPhone</b><ol><li><span>1</span><p>Atidarykite statybos24.lt naršyklėje Safari.</p></li><li><span>2</span><p>Apačioje spauskite „Bendrinti“ – kvadratą su rodykle.</p></li><li><span>3</span><p>Pasirinkite „Į pradžios ekraną“ ir spauskite „Pridėti“.</p></li></ol></div>
              <div><b>Android</b><ol><li><span>1</span><p>Atidarykite statybos24.lt naršyklėje Chrome.</p></li><li><span>2</span><p>Spauskite „Įdiegti programą“ arba meniu ⋮.</p></li><li><span>3</span><p>Patvirtinkite – spauskite „Įdiegti“.</p></li></ol></div>
            </div>
            <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn primary" type="button" onClick={() => setAppModal(false)}>Supratau</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
