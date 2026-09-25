import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'

const workers = [
  { initials:'TK', name:'Tomas K.', status:'Laisvas rytoj', city:'Vilnius', skills:['Betonavimo pagalba','Medžiagų nešiojimas'], attendance:'97%', transport:'Turi transportą' },
  { initials:'MP', name:'Mantas P.', status:'Laisvas rytoj', city:'Vilnius', skills:['Medžiagų nešiojimas','Tvarkymas'], attendance:'100%', transport:'Turi transportą' },
  { initials:'DS', name:'Darius S.', status:'Laisvas šiandien', city:'Vilnius', skills:['Betonavimo pagalba','Krovos darbai'], attendance:'94%', transport:'Neturi' },
  { initials:'RK', name:'Rytis K.', status:'Laisvas rytoj', city:'Vilnius', skills:['Tvarkymas','Statybvietės pagalba'], attendance:'92%', transport:'Turi transportą' },
]

const initialRegister = {
  role: 'worker',
  displayName: '',
  email: '',
  phone: '',
  city: 'Vilnius',
  password: '',
  companyName: '',
  companyCode: '',
}

function Logo(){
  return <a className="brand" href="#top" aria-label="rankosstatybose.lt">
    <span className="brand-mark">⌂</span>
    <span className="brand-word">rankos<span>statybose</span>.lt</span>
  </a>
}

function Header({session, profile, onOpenAuth, onSignOut}){
  return <header className="header" id="top">
    <div className="container nav">
      <Logo/>
      <nav className="nav-links">
        <a href="#kaip">Kaip tai veikia</a>
        <a href="#darbdaviams">Darbdaviams</a>
        <a href="#darbuotojams">Darbuotojams</a>
        <a href="#kainodara">Kainodara</a>
      </nav>
      <div className="nav-actions">
        {session ? <>
          <div className="account-pill"><span>{(profile?.display_name || session.user.email || 'V')[0].toUpperCase()}</span>{profile?.display_name || session.user.email}</div>
          <button className="btn secondary" onClick={onSignOut}>Atsijungti</button>
        </> : <>
          <button className="btn secondary" onClick={() => onOpenAuth('login')}>Prisijungti</button>
          <button className="btn primary" onClick={() => onOpenAuth('register','employer')}>Pateikti užklausą</button>
        </>}
      </div>
    </div>
  </header>
}

function SearchCard({onOpenAuth}){
  const fields = [
    ['Miestas','Vilnius'], ['Data','Rytoj'], ['Kiek žmonių reikia?','3'],
    ['Darbo tipas','Betonavimo pagalba'], ['Pradžios laikas','08:00']
  ]
  return <div className="search-card">
    {fields.map(([label,value]) => <label className="field" key={label}>
      <span>{label}</span><div className="field-control">{value}<b>⌄</b></div>
    </label>)}
    <button className="btn primary search-button" onClick={() => onOpenAuth('register','employer')}>Rasti darbuotojus →</button>
    <div className="availability"><i/>Vilniuje rytoj laisvi <strong>18 darbuotojų</strong></div>
  </div>
}

function ProductPreview(){
  return <div className="product-window">
    <div className="product-top"><span className="mini-logo">⌂ rankosstatybose.lt</span><span>⌕ ◉</span></div>
    <div className="product-body">
      <aside className="sidebar">
        <div className="active">⌕ Darbuotojų paieška</div><div>▤ Mano užklausos</div><div>▦ Darbo skydelis</div><div>◉ Pranešimai <b>3</b></div><div>▣ Mokėjimai</div><div>⚙ Nustatymai</div>
      </aside>
      <section className="worker-panel">
        <div className="panel-head"><div><h3>Galimi darbuotojai</h3><p>Rasta 18 darbuotojų</p></div><button>Filtrai</button></div>
        <div className="worker-list">
          {workers.map(w => <div className="worker-row" key={w.name}>
            <div className="avatar">{w.initials}</div>
            <div className="identity"><div><strong>{w.name}</strong><span className="status">{w.status}</span></div><small>{w.city}</small><div className="tags">{w.skills.map(s=><span key={s}>{s}</span>)}</div></div>
            <div className="metric"><b>{w.attendance}</b><small>atvykimas</small></div>
            <div className="transport">{w.transport}</div><button className="invite">Kviesti</button>
          </div>)}
        </div>
      </section>
    </div>
  </div>
}

function AuthModal({open, initialMode='login', initialRole='worker', onClose}){
  const [mode,setMode] = useState(initialMode)
  const [login,setLogin] = useState({email:'',password:''})
  const [form,setForm] = useState({...initialRegister, role:initialRole})
  const [busy,setBusy] = useState(false)
  const [message,setMessage] = useState('')
  const [error,setError] = useState('')

  useEffect(() => {
    if(open){
      setMode(initialMode)
      setForm({...initialRegister, role:initialRole})
      setMessage(''); setError('')
    }
  },[open,initialMode,initialRole])

  if(!open) return null

  const loginSubmit = async (e) => {
    e.preventDefault(); setBusy(true); setError(''); setMessage('')
    const {error} = await supabase.auth.signInWithPassword({email:login.email.trim(), password:login.password})
    setBusy(false)
    if(error){ setError('Nepavyko prisijungti. Patikrinkite el. paštą ir slaptažodį.'); return }
    onClose()
  }

  const registerSubmit = async (e) => {
    e.preventDefault(); setBusy(true); setError(''); setMessage('')
    if(form.password.length < 8){setBusy(false); setError('Slaptažodis turi būti bent 8 simbolių.'); return}
    if(form.role==='employer' && !form.companyName.trim()){setBusy(false); setError('Įveskite įmonės pavadinimą.'); return}

    const {data,error} = await supabase.auth.signUp({
      email:form.email.trim(),
      password:form.password,
      options:{
        emailRedirectTo: window.location.origin,
        data:{
          role:form.role,
          display_name:form.displayName.trim(),
          legal_name:form.displayName.trim(),
          phone:form.phone.trim(),
          city:form.city,
          company_name:form.role==='employer' ? form.companyName.trim() : '',
          company_code:form.role==='employer' ? form.companyCode.trim() : '',
        }
      }
    })
    setBusy(false)
    if(error){setError(error.message.includes('already') ? 'Toks el. paštas jau registruotas.' : `Registracija nepavyko: ${error.message}`); return}
    if(data.session){setMessage('Paskyra sukurta. Galite tęsti darbą platformoje.')} else {setMessage('Paskyra sukurta. Patikrinkite el. paštą ir patvirtinkite registraciją.')}
  }

  return <div className="modal-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget) onClose()}}>
    <div className="auth-modal" role="dialog" aria-modal="true">
      <button className="close-button" onClick={onClose}>×</button>
      <div className="auth-brand"><Logo/></div>
      <div className="auth-tabs"><button className={mode==='login'?'active':''} onClick={()=>{setMode('login');setError('');setMessage('')}}>Prisijungti</button><button className={mode==='register'?'active':''} onClick={()=>{setMode('register');setError('');setMessage('')}}>Registruotis</button></div>

      {mode==='login' ? <form className="auth-form" onSubmit={loginSubmit}>
        <div><h2>Sveiki sugrįžę</h2><p>Prisijunkite prie savo rankosstatybose.lt paskyros.</p></div>
        <label><span>El. paštas</span><input type="email" required value={login.email} onChange={e=>setLogin({...login,email:e.target.value})} placeholder="vardas@imone.lt"/></label>
        <label><span>Slaptažodis</span><input type="password" required value={login.password} onChange={e=>setLogin({...login,password:e.target.value})} placeholder="••••••••"/></label>
        {error && <div className="form-alert error">{error}</div>}
        <button className="btn primary full" disabled={busy}>{busy?'Jungiama...':'Prisijungti'}</button>
        <button type="button" className="text-button" onClick={()=>setMode('register')}>Dar neturite paskyros? Registruotis</button>
      </form> : <form className="auth-form" onSubmit={registerSubmit}>
        <div><h2>Sukurti paskyrą</h2><p>Pasirinkite, kaip naudosite platformą.</p></div>
        <div className="role-switch">
          <button type="button" className={form.role==='worker'?'active':''} onClick={()=>setForm({...form,role:'worker'})}><b>Ieškau darbo</b><span>Darbuotojams nemokama</span></button>
          <button type="button" className={form.role==='employer'?'active':''} onClick={()=>setForm({...form,role:'employer'})}><b>Ieškau darbuotojų</b><span>Įmonėms ir rangovams</span></button>
        </div>
        <div className="two-col">
          <label><span>Vardas ir pavardė</span><input required value={form.displayName} onChange={e=>setForm({...form,displayName:e.target.value})} placeholder="Tomas Kazlauskas"/></label>
          <label><span>Miestas</span><select value={form.city} onChange={e=>setForm({...form,city:e.target.value})}><option>Vilnius</option><option>Kaunas</option><option>Klaipėda</option><option>Šiauliai</option><option>Panevėžys</option><option>Kitas</option></select></label>
        </div>
        <div className="two-col">
          <label><span>El. paštas</span><input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="vardas@email.lt"/></label>
          <label><span>Telefonas</span><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+370 6..."/></label>
        </div>
        {form.role==='employer' && <div className="two-col employer-fields">
          <label><span>Įmonės pavadinimas</span><input required value={form.companyName} onChange={e=>setForm({...form,companyName:e.target.value})} placeholder="UAB Statra"/></label>
          <label><span>Įmonės kodas</span><input value={form.companyCode} onChange={e=>setForm({...form,companyCode:e.target.value})} placeholder="123456789"/></label>
        </div>}
        <label><span>Slaptažodis</span><input type="password" required minLength="8" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Bent 8 simboliai"/></label>
        {error && <div className="form-alert error">{error}</div>}{message && <div className="form-alert success">{message}</div>}
        <button className="btn primary full" disabled={busy}>{busy?'Kuriama...':'Sukurti paskyrą'}</button>
        <p className="legal-note">Registruodamiesi sutinkate su naudojimo sąlygomis ir privatumo politika.</p>
      </form>}
    </div>
  </div>
}

export default function App(){
  const [session,setSession] = useState(null)
  const [profile,setProfile] = useState(null)
  const [auth,setAuth] = useState({open:false,mode:'login',role:'worker'})

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setSession(data.session || null))
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,newSession)=>setSession(newSession))
    return ()=>subscription.unsubscribe()
  },[])

  useEffect(()=>{
    if(!session?.user?.id){setProfile(null);return}
    supabase.from('profiles').select('id, display_name, role, city').eq('id',session.user.id).single().then(({data})=>setProfile(data || null))
  },[session])

  const openAuth=(mode='login',role='worker')=>setAuth({open:true,mode,role})
  const signOut=async()=>{await supabase.auth.signOut(); setProfile(null)}

  return <>
    <Header session={session} profile={profile} onOpenAuth={openAuth} onSignOut={signOut}/>
    <main>
      <section className="hero">
        <div className="container hero-grid"><div><div className="eyebrow">STATYBŲ PAGALBINIAI, KAI JŲ REIKIA</div><h1>Reikia papildomų<br/>rankų objekte?</h1><p className="lead">Raskite statybų pagalbinius pagal vietą, datą ir prieinamumą. Jokio CV siuntimo, jokio chaoso — tik realiai laisvi darbuotojai.</p><SearchCard onOpenAuth={openAuth}/></div><ProductPreview/></div>
      </section>
      <section className="value-strip"><div className="container values"><article><span>▣</span><h3>Darbuotojai žymi savo užimtumą</h3><p>Matote tik tuos, kurie realiai laisvi norimą dieną.</p></article><article><span>▥</span><h3>Matote atvykimo istoriją</h3><p>Rinkitės patikimus darbuotojus pagal realius duomenis.</p></article><article><span>◉</span><h3>Kviečiate tik laisvus darbuotojus</h3><p>Mažiau bereikalingo susirašinėjimo ir laukimo.</p></article><article><span>ϟ</span><h3>Greitas pakaitinio suradimas</h3><p>Jei žmogus neatvyksta, pakaitalą randate greičiau.</p></article></div></section>
      <section className="section" id="kaip"><div className="container"><div className="eyebrow">PAPRASTAS PROCESAS</div><h2>Kaip tai veikia?</h2><div className="steps"><article><b>01</b><h3>Pateikiate poreikį</h3><p>Nurodote miestą, datą, darbo tipą ir kiek žmonių reikia.</p></article><article><b>02</b><h3>Gaunate tinkamus darbuotojus</h3><p>Sistema parodo tik tuo metu laisvus ir kriterijus atitinkančius žmones.</p></article><article><b>03</b><h3>Patvirtinate ir pradedate</h3><p>Pakviečiate darbuotojus ir gaunate aiškų patvirtinimą.</p></article></div></div></section>
      <section className="section dashboard-section" id="darbdaviams"><div className="container dashboard-grid"><div><div className="eyebrow">DARBDAVIAMS</div><h2>Darbdavio darbo skydelis</h2><p className="lead small">Užklausos, darbuotojai ir atvykimo statistika vienoje vietoje.</p><button className="btn primary" onClick={()=>openAuth('register','employer')}>Registruotis kaip darbdaviui →</button></div><div className="dashboard-card"><div className="kpis"><div><span>Aktyvūs šiandien</span><b>12</b></div><div><span>Atviri poreikiai</span><b>3</b></div><div><span>Vid. atvykimas</span><b>96%</b></div></div><div className="bookings"><h3>Artimiausi užsakymai</h3><div><b>Rytoj</b><span>Vilnius · Betonavimo pagalba</span><em>3 žmonės</em><i>Patvirtinta</i></div><div><b>09-29</b><span>Kaunas · Medžiagų nešiojimas</span><em>2 žmonės</em><i className="pending">Laukiama</i></div><div><b>10-01</b><span>Vilnius · Tvarkymas</span><em>4 žmonės</em><i>Patvirtinta</i></div></div></div></div></section>
      <section className="section" id="darbuotojams"><div className="container worker-callout"><div><div className="eyebrow">DARBUOTOJAMS</div><h2>Registracija paprasta. Darbus renkiesi pats.</h2><p>Pažymėk kada gali dirbti, kokius darbus moki ir kokiu atstumu gali nuvykti. Darbuotojams platforma nemokama.</p><button className="btn primary worker-cta" onClick={()=>openAuth('register','worker')}>Registruotis nemokamai →</button></div><div className="checklist"><div>✓ Pasirenki laisvas dienas</div><div>✓ Matai aiškią vietą ir laiką</div><div>✓ Priimi arba atmeti pasiūlymą</div><div>✓ Kuri savo patikimumo istoriją</div></div></div></section>
      <section className="section" id="kainodara"><div className="container"><div className="eyebrow">KAINODARA</div><h2>Aiškūs planai darbdaviams</h2><div className="pricing"><article><h3>Starteris</h3><strong>49 €<small>/mėn.</small></strong><p>Pavieniams poreikiams.</p><ul><li>Iki 5 užklausų</li><li>Darbuotojų paieška</li><li>Pagrindinė statistika</li></ul><button className="btn secondary full" onClick={()=>openAuth('register','employer')}>Rinktis planą</button></article><article className="featured"><span className="popular">POPULIARIAUSIAS</span><h3>Profesionalus</h3><strong>99 €<small>/mėn.</small></strong><p>Nuolatiniams poreikiams.</p><ul><li>Iki 20 užklausų</li><li>Išplėstiniai filtrai</li><li>Atvykimo istorija</li></ul><button className="btn primary full" onClick={()=>openAuth('register','employer')}>Rinktis planą</button></article><article><h3>Verslui</h3><strong>199 €<small>/mėn.</small></strong><p>Didesnėms komandoms.</p><ul><li>Neribotos užklausos</li><li>Keli įmonės vartotojai</li><li>Išplėstinės ataskaitos</li></ul><button className="btn secondary full" onClick={()=>openAuth('register','employer')}>Susisiekti</button></article></div></div></section>
    </main>
    <footer><div className="container footer"><Logo/><span>Statybų darbuotojai, kai jų reikia.</span><span>© 2026 rankosstatybose.lt</span></div></footer>
    <AuthModal open={auth.open} initialMode={auth.mode} initialRole={auth.role} onClose={()=>setAuth({...auth,open:false})}/>
  </>
}
