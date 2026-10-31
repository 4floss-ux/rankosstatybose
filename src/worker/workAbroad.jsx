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
 useEffect(()=>{let cancelled=false;setBusy(true);setError("");setRows([]);supabase.rpc("admin_list_work_abroad_interested",{p_search:query,p_limit:50,p_offset:page*50}).then(result=>{if(cancelled)return;if(result.error)setError(result.error.message);else setRows(result.data||[]);}).catch(e=>{if(!cancelled)setError(e.message||"Nepavyko įkelti.");}).finally(()=>{if(!cancelled)setBusy(false);});return()=>{cancelled=true;};},[query,page,reload]);
 const total=Number(rows[0]?.total_count||0);
 return <section className="admin-section"><style>{`.abroad-admin-head{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}.abroad-admin-head h2{margin:0}.abroad-admin-search{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.abroad-admin-search input{padding:10px;border:1px solid #dfe7ed;border-radius:9px;font:inherit;font-size:13px;min-width:0;flex:1}.abroad-admin-list{display:grid;gap:9px}.abroad-admin-person{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:14px;border:1px solid #e4ebf0;border-radius:12px;background:#fff;font-size:13px}.abroad-admin-person small{display:block;color:#7a8996;font-size:11px;margin-top:5px}.abroad-admin-person a{color:#433960;overflow-wrap:anywhere}.abroad-admin-nav{display:flex;gap:10px;align-items:center;justify-content:flex-end;margin-top:14px}@media(max-width:620px){.abroad-admin-person{grid-template-columns:1fr;gap:9px}}`}</style><div className="abroad-admin-head"><h2>Domisi darbu užsienyje</h2><button type="button" className="btn ghost" onClick={()=>setReload(v=>v+1)} disabled={busy}>Atnaujinti</button></div><form className="abroad-admin-search" onSubmit={e=>{e.preventDefault();setPage(0);setQuery(search.trim());setReload(v=>v+1);}}><input aria-label="Ieškoti darbuotojų" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Vardas, miestas arba el. paštas"/><button type="submit" className="btn ghost">Ieškoti</button></form>{error && <p role="alert">{error}</p>}{busy ? <SilentLoader size={22} minHeight={80}/> : <><p style={{fontSize:12,color:"#607180"}}>Rasta: {total}</p><div className="abroad-admin-list">{rows.map(row=><article className="abroad-admin-person" key={row.user_id}><div><b>{row.display_name||"Darbuotojas"}</b><small>{row.city||"Miestas nenurodytas"}</small><small>Registracija: {new Date(row.registered_at).toLocaleDateString("lt-LT")}</small></div><div style={{justifySelf:"end"}}><button type="button" className="btn ghost" onClick={()=>onOpenProfile(row)}>Profilis</button></div></article>)}{!rows.length && <p>Darbuotojų pagal šiuos kriterijus nėra.</p>}</div></>}<div className="abroad-admin-nav"><button type="button" className="btn ghost" disabled={busy||page===0} onClick={()=>setPage(v=>v-1)}>← Ankstesni</button><span style={{fontSize:12}}>Puslapis {page+1}</span><button type="button" className="btn ghost" disabled={busy||(page+1)*50>=total} onClick={()=>setPage(v=>v+1)}>Kiti →</button></div></section>;
}
