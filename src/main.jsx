import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const workers = [
  { initials:"TK", name:"Tomas K.", status:"Laisvas rytoj", city:"Vilnius", skills:["Betonavimo pagalba","Medžiagų nešiojimas","Tvarkymas"], attendance:97, transport:true },
  { initials:"MP", name:"Mantas P.", status:"Laisvas rytoj", city:"Vilnius", skills:["Medžiagų nešiojimas","Tvarkymas"], attendance:100, transport:true },
  { initials:"DS", name:"Darius S.", status:"Laisvas šiandien", city:"Vilnius", skills:["Betonavimo pagalba","Krovos darbai"], attendance:94, transport:false },
  { initials:"RK", name:"Rytis K.", status:"Laisvas rytoj", city:"Vilnius", skills:["Tvarkymas","Statybvietės pagalba"], attendance:92, transport:true },
];

function Icon({children}) {
  return <span className="icon">{children}</span>;
}

function Header(){
  return <header className="header">
    <div className="container nav">
      <a className="brand" href="#">
        <span className="logo-mark">⌂</span>
        <span>rankos<span>statybose</span>.lt</span>
      </a>
      <nav className="navlinks">
        <a href="#kaip">Kaip tai veikia</a>
        <a href="#darbdaviams">Darbdaviams</a>
        <a href="#darbuotojams">Darbuotojams</a>
        <a href="#kainodara">Kainodara</a>
      </nav>
      <div className="nav-actions">
        <button className="btn ghost">Prisijungti</button>
        <button className="btn primary">Pateikti užklausą</button>
      </div>
    </div>
  </header>
}

function SearchBox(){
  return <div className="searchbox">
    <div className="field">
      <label>Miestas</label>
      <div className="control">⌖ Vilnius <span>⌄</span></div>
    </div>
    <div className="field">
      <label>Data</label>
      <div className="control">▣ Rytoj <span>⌄</span></div>
    </div>
    <div className="field">
      <label>Kiek žmonių reikia?</label>
      <div className="control">◉ 3 <span>⌄</span></div>
    </div>
    <div className="field">
      <label>Darbo tipas</label>
      <div className="control">⚒ Betonavimo pagalba <span>⌄</span></div>
    </div>
    <div className="field">
      <label>Pradžios laikas</label>
      <div className="control">◷ 08:00 <span>⌄</span></div>
    </div>
    <button className="btn primary search-cta">Rasti darbuotojus →</button>
    <div className="availability"><span></span> Vilniuje rytoj laisvi <b>18 darbuotojų</b></div>
  </div>
}

function WorkersPanel(){
  return <div className="product-window">
    <div className="product-top">
      <div className="mini-brand"><span className="logo-mark small">⌂</span> rankosstatybose.lt</div>
      <div className="mini-actions"><span>⌕</span><span>◉</span></div>
    </div>
    <div className="app-shell">
      <aside className="sidebar">
        <div className="active">⌕ Darbuotojų paieška</div>
        <div>▤ Mano užklausos</div>
        <div>▦ Darbo skydelis</div>
        <div>◉ Pranešimai <b>3</b></div>
        <div>▣ Mokėjimai</div>
        <div>⚙ Nustatymai</div>
      </aside>
      <main className="app-main">
        <div className="app-title-row">
          <div><h3>Galimi darbuotojai</h3><p>Rasta 18 darbuotojų</p></div>
          <button className="btn compact">Filtrai</button>
        </div>
        <div className="worker-list">
          {workers.map(w => <div className="worker-row" key={w.name}>
            <div className="avatar">{w.initials}</div>
            <div className="worker-main">
              <div className="worker-name">{w.name} <span className="status">{w.status}</span></div>
              <div className="muted">{w.city}</div>
              <div className="tags">{w.skills.slice(0,2).map(s => <span key={s}>{s}</span>)}</div>
            </div>
            <div className="metric"><strong>{w.attendance}%</strong><span>atvykimas</span></div>
            <div className={"transport " + (w.transport ? "yes" : "no")}>{w.transport ? "Turi transportą" : "Neturi"}</div>
            <button className="btn primary tiny">Kviesti</button>
          </div>)}
        </div>
      </main>
    </div>
  </div>
}

function App(){
  return <>
    <Header />
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow">STATYBŲ PAGALBINIAI, KAI JŲ REIKIA</div>
            <h1>Reikia papildomų<br/>rankų objekte?</h1>
            <p className="lead">Raskite statybų pagalbinius pagal vietą, datą ir prieinamumą. Jokio CV siuntimo, jokio chaoso — tik realiai laisvi darbuotojai.</p>
            <SearchBox />
          </div>
          <WorkersPanel />
        </div>
      </section>

      <section className="feature-strip">
        <div className="container features">
          <div><Icon>▣</Icon><h3>Darbuotojai žymi savo užimtumą</h3><p>Matote tik tuos, kurie realiai laisvi norimą dieną.</p></div>
          <div><Icon>▥</Icon><h3>Matote atvykimo istoriją</h3><p>Rinkitės patikimus darbuotojus pagal realius duomenis.</p></div>
          <div><Icon>◉</Icon><h3>Kviečiate tik laisvus darbuotojus</h3><p>Nėra nereikalingo susirašinėjimo ir laukimo.</p></div>
          <div><Icon>ϟ</Icon><h3>Greitas pakaitinio suradimas</h3><p>Jei žmogus neatvyksta, pakaitalą randate greičiau.</p></div>
        </div>
      </section>

      <section id="kaip" className="section">
        <div className="container">
          <div className="section-head"><div><div className="eyebrow">PAPRASTAS PROCESAS</div><h2>Kaip tai veikia?</h2></div></div>
          <div className="steps">
            <article><span>1</span><h3>Pateikiate poreikį</h3><p>Nurodote miestą, datą, darbo tipą ir kiek žmonių reikia.</p></article>
            <article><span>2</span><h3>Gaunate tinkamus darbuotojus</h3><p>Sistema parodo tik tuos, kurie tuo metu laisvi ir atitinka poreikį.</p></article>
            <article><span>3</span><h3>Patvirtinate ir pradedate darbus</h3><p>Pakviečiate, gaunate patvirtinimą ir viską valdote vienoje vietoje.</p></article>
          </div>
        </div>
      </section>

      <section id="darbdaviams" className="section dashboard-section">
        <div className="container dash-grid">
          <div>
            <div className="eyebrow">DARBDAVIAMS</div>
            <h2>Darbdavio darbo skydelis</h2>
            <p className="lead small-lead">Užklausos, darbuotojai ir atvykimo statistika vienoje vietoje. Be papildomo administravimo.</p>
            <button className="btn primary">Pateikti užklausą →</button>
          </div>
          <div className="dashboard-card">
            <div className="kpis">
              <div><span>Aktyvūs šiandien</span><strong>12</strong></div>
              <div><span>Atviri poreikiai</span><strong>3</strong></div>
              <div><span>Vid. atvykimas</span><strong>96%</strong></div>
            </div>
            <div className="bookings">
              <h3>Artimiausi užsakymai</h3>
              <div className="booking"><b>Rytoj</b><span>Vilnius · Betonavimo pagalba</span><em>3 žmonės</em><i>Patvirtinta</i></div>
              <div className="booking"><b>09-29</b><span>Kaunas · Medžiagų nešiojimas</span><em>2 žmonės</em><i className="pending">Laukiama</i></div>
              <div className="booking"><b>10-01</b><span>Vilnius · Tvarkymas</span><em>4 žmonės</em><i>Patvirtinta</i></div>
            </div>
          </div>
        </div>
      </section>

      <section id="kainodara" className="section pricing-section">
        <div className="container">
          <div className="section-head"><div><div className="eyebrow">KAINODARA</div><h2>Paprasti planai darbdaviams</h2></div></div>
          <div className="pricing">
            <article><h3>Starteris</h3><div className="price">49 €<span>/mėn.</span></div><p>Smulkiems projektams ir pavieniams poreikiams.</p><ul><li>Iki 5 užklausų / mėn.</li><li>Darbuotojų paieška</li><li>El. pašto pagalba</li></ul><button className="btn ghost full">Rinktis planą</button></article>
            <article className="featured"><div className="popular">POPULIARIAUSIAS</div><h3>Profesionalus</h3><div className="price">99 €<span>/mėn.</span></div><p>Įmonėms, kurios darbuotojų ieško reguliariai.</p><ul><li>Iki 20 užklausų / mėn.</li><li>Išplėstiniai filtrai</li><li>Atvykimo istorija</li></ul><button className="btn primary full">Rinktis planą</button></article>
            <article><h3>Verslui</h3><div className="price">199 €<span>/mėn.</span></div><p>Didelėms įmonėms ir keliems objektams.</p><ul><li>Neribotos užklausos</li><li>Keli įmonės vartotojai</li><li>Išplėstinės ataskaitos</li></ul><button className="btn ghost full">Susisiekti</button></article>
          </div>
        </div>
      </section>
    </main>
    <footer>
      <div className="container footer"><div className="brand inverse"><span className="logo-mark">⌂</span><span>rankos<span>statybose</span>.lt</span></div><span>Statybų darbuotojai, kai jų reikia.</span><span>© 2026 rankosstatybose.lt</span></div>
    </footer>
  </>
}

createRoot(document.getElementById("root")).render(<App />);
