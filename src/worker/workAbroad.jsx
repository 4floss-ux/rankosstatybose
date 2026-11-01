import { useEffect, useState } from "react";
import { supabase } from "../lib/config.js";
import { SilentLoader } from "../ui/brand.jsx";

export function WorkAbroadPreference({ user }) {
  const initialInterest = user?.user_metadata?.work_abroad_interested;
  const [choice, setChoice] = useState(initialInterest === true ? "yes" : initialInterest === false ? "no" : "");
  const [saved, setSaved] = useState(typeof initialInterest === "boolean");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // An already saved answer must not reappear when the profile is reopened.
  useEffect(() => {
    if (typeof user?.user_metadata?.work_abroad_interested === "boolean") {
      setSaved(true);
    }
  }, [user?.user_metadata?.work_abroad_interested]);

  if (saved) return null;

  async function savePreference() {
    if (!choice || busy) return;
    setBusy(true);
    setError("");
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          work_abroad_interested: choice === "yes",
          work_abroad_interest_updated_at: new Date().toISOString(),
        },
      });
      if (updateError) throw updateError;
      setSaved(true); // Hide the entire block after successful saving.
    } catch (err) {
      setError(err?.message || "Nepavyko išsaugoti pasirinkimo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ background: "#fff", border: "1px solid #dfe7ed", borderRadius: 14, padding: 18, marginBottom: 18 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#222631" }}>Darbas užsienyje</h3>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "stretch" }}>
        {[["yes", "Taip, domina"], ["no", "Ne, nedomina"]].map(([value, label]) => (
          <label key={value} style={{
            display: "inline-flex", alignItems: "center", gap: 9, cursor: busy ? "not-allowed" : "pointer",
            padding: "12px 14px", minHeight: 44, border: `1px solid ${choice === value ? "#7b6ba8" : "#dfe7ed"}`,
            borderRadius: 10, background: choice === value ? "#fff8f0" : "#fff", fontSize: 13,
          }}>
            <input type="radio" name="profile-work-abroad" value={value}
              checked={choice === value} disabled={busy}
              onChange={() => { setChoice(value); setError(""); }} />
            {label}
          </label>
        ))}
      </div>
      <div style={{ marginTop: 14 }}>
        <button type="button" className="btn" disabled={!choice || busy} onClick={savePreference}>
          {busy ? "Saugoma…" : "Išsaugoti pasirinkimą"}
        </button>
      </div>
      {error && <p role="alert" style={{ margin: "10px 0 0", fontSize: 12, color: "#b43e29" }}>{error}</p>}
    </section>
  );
}

export function AdminWorkAbroadInterests({onOpenProfile}) {
 const [rows,setRows]=useState([]),[search,setSearch]=useState(""),[query,setQuery]=useState(""),[page,setPage]=useState(0),[reload,setReload]=useState(0),[busy,setBusy]=useState(true),[error,setError]=useState("");
 useEffect(()=>{let cancelled=false;setBusy(true);setError("");setRows([]);supabase.rpc("admin_list_work_abroad_interested_v2",{p_search:query,p_limit:50,p_offset:page*50}).then(result=>{if(cancelled)return;if(result.error)setError(result.error.message);else setRows(result.data||[]);}).catch(e=>{if(!cancelled)setError(e.message||"Nepavyko įkelti.");}).finally(()=>{if(!cancelled)setBusy(false);});return()=>{cancelled=true;};},[query,page,reload]);
 const total=Number(rows[0]?.total_count||0);
 const ini=(n)=>String(n||"D").trim().split(/\s+/).map(x=>x[0]||"").join("").slice(0,2).toUpperCase();
 return <>
  <div className="head"><div><h1>Domisi darbu užsienyje</h1><p className="lead">{busy?"Įkeliama…":`${total} darbuotojai pažymėjo, kad domisi darbu užsienyje`}</p></div></div>
  <form className="abar2" onSubmit={e=>{e.preventDefault();setPage(0);setQuery(search.trim());setReload(v=>v+1);}}>
   <label className="field asrch"><span className="sr">Ieškoti</span><span className="asrch-in"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="search" aria-label="Ieškoti darbuotojų" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Vardas, miestas arba el. paštas"/></span></label>
  </form>
  {error && <p className="ferr" role="alert">{error}</p>}
  <section className="card"><div className="atbl aa">
   <div className="atr ath"><span>Darbuotojas</span><span>Šalys</span><span>Registracija</span><span></span><span></span></div>
   {busy ? <SilentLoader size={22} minHeight={80}/> : rows.length ? rows.map(row=><div className="atr" key={row.user_id}>
    <span className="acell-nm"><span className="av lt sm">{ini(row.display_name)}</span><span><b>{row.display_name||"Darbuotojas"}</b><small>{row.city||"Miestas nenurodytas"}</small></span></span>
    <span data-l="Šalys">{Array.isArray(row.countries)&&row.countries.length?row.countries.join(", "):"Nenurodė"}</span>
    <span data-l="Registracija">{row.registered_at?new Date(row.registered_at).toLocaleDateString("lt-LT"):"—"}</span>
    <span></span>
    <span className="aacts"><button type="button" className="btn sm" onClick={()=>onOpenProfile(row)}>Profilis</button></span>
   </div>) : <p className="small muted" style={{padding:"14px 4px",margin:0}}>Darbuotojų pagal šiuos kriterijus nėra.</p>}
  </div>
  {total>50 && <nav className="pager" aria-label="Puslapiai"><span className="pinfo">Puslapis {page+1}</span><div className="pbtns"><button type="button" className="pbtn" disabled={busy||page===0} onClick={()=>setPage(v=>v-1)} aria-label="Ankstesnis puslapis">‹</button><button type="button" className="pbtn" disabled={busy||(page+1)*50>=total} onClick={()=>setPage(v=>v+1)} aria-label="Kitas puslapis">›</button></div></nav>}
  </section>
 </>;
}

// Naujas dizainas: „Domina darbas užsienyje“ su nebūtinu šalių pasirinkimu (saugoma naudotojo metaduomenyse).
export const ABROAD_COUNTRIES = ["Vokietija", "Nyderlandai", "Norvegija", "Švedija", "Danija", "Suomija", "Belgija", "Austrija", "Šveicarija", "Kita"];
export function AbroadSetting({ user }) {
  const meta = user?.user_metadata || {};
  const [on, setOn] = useState(meta.work_abroad_interested === true);
  const [countries, setCountries] = useState(Array.isArray(meta.work_abroad_countries) ? meta.work_abroad_countries : []);
  const [state, setState] = useState("");
  async function save(nextOn, nextCountries) {
    setState("saving");
    const { error } = await supabase.auth.updateUser({ data: { work_abroad_interested: nextOn, work_abroad_countries: nextOn ? nextCountries : [], work_abroad_interest_updated_at: new Date().toISOString() } });
    setState(error ? "error" : "saved");
  }
  const toggle = (value) => { setOn(value); if (!value) setCountries([]); save(value, value ? countries : []); };
  const pick = (country) => {
    const next = countries.includes(country) ? countries.filter((item) => item !== country) : [...countries, country];
    setCountries(next);
    save(true, next);
  };
  return (
    <>
      <div className="setrow">
        <span className="setic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg></span>
        <div className="settx"><b>Domina darbas užsienyje</b><span>{state === "saving" ? "Saugoma…" : state === "error" ? "Nepavyko išsaugoti" : "Padeda administracijai pasiūlyti tinkamas galimybes"}</span></div>
        <div className="toggle2 sm" role="group" aria-label="Darbas užsienyje">
          <button type="button" aria-pressed={on} onClick={() => toggle(true)}>Taip</button>
          <button type="button" aria-pressed={!on} onClick={() => toggle(false)}>Ne</button>
        </div>
      </div>
      {on ? (
        <div className="abr-c">
          <span className="small muted">Kokios šalys domina? <em>(nebūtina)</em></span>
          <div className="chips">
            {ABROAD_COUNTRIES.map((country) => (
              <button key={country} type="button" className="chip" aria-pressed={countries.includes(country)} onClick={() => pick(country)}>{country}</button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
