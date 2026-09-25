import {
  ArrowRight, BarChart3, Bell, BriefcaseBusiness, CalendarDays, Car, Check,
  ChevronDown, Clock3, HardHat, LayoutDashboard, MapPin, Menu, MessageSquare,
  Search, Settings, ShieldCheck, Sparkles, Star, Users, WalletCards, Wrench
} from 'lucide-react'

const workers = [
  { initials:'TK', name:'Tomas K.', status:'Laisvas rytoj', city:'Vilnius', skills:['Betonavimo pagalba','Medžiagų nešiojimas','Tvarkymas'], attendance:'97%', transport:true },
  { initials:'MP', name:'Mantas P.', status:'Laisvas rytoj', city:'Vilnius', skills:['Medžiagų nešiojimas','Tvarkymas'], attendance:'100%', transport:true },
  { initials:'DS', name:'Darius S.', status:'Laisvas šiandien', city:'Vilnius', skills:['Betonavimo pagalba','Krovos darbai'], attendance:'94%', transport:false },
  { initials:'RK', name:'Rytis K.', status:'Laisvas rytoj', city:'Vilnius', skills:['Tvarkymas','Statybvietės pagalba'], attendance:'92%', transport:true },
  { initials:'AP', name:'Andrius P.', status:'Laisvas rytoj', city:'Vilnius', skills:['Medžiagų nešiojimas','Tvarkymas'], attendance:'98%', transport:true },
]

function Logo() {
  return (
    <div className="brand">
      <div className="brandMark"><HardHat size={20}/></div>
      <div className="brandText"><strong>rankos</strong><span>statybose</span><b>.lt</b></div>
    </div>
  )
}

function SelectBox({label, icon:Icon, value}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="inputLike"><Icon size={17}/><b>{value}</b><ChevronDown size={16}/></div>
    </label>
  )
}

function MiniLogo(){
  return (
    <div className="miniLogo"><HardHat size={17}/><b>rankosstatybose.lt</b></div>
  )
}

function WorkerTable(){
  return (
    <div className="productShell">
      <aside className="productSide">
        <MiniLogo/>
        <nav>
          <a className="active"><Search size={16}/>Darbuotojų paieška</a>
          <a><BriefcaseBusiness size={16}/>Mano užklausos</a>
          <a><LayoutDashboard size={16}/>Darbo skydelis</a>
          <a><MessageSquare size={16}/>Pranešimai <em>3</em></a>
          <a><WalletCards size={16}/>Mokėjimai</a>
          <a><Settings size={16}/>Nustatymai</a>
        </nav>
      </aside>
      <div className="productMain">
        <div className="productTitle">
          <div><h3>Galimi darbuotojai</h3><p>Rasta 18 darbuotojų</p></div>
          <button className="ghost"><Bell size={16}/></button>
        </div>
        <div className="tinyFilters">
          <button><MapPin size={14}/>Vilnius<ChevronDown size={13}/></button>
          <button><CalendarDays size={14}/>Rytoj<ChevronDown size={13}/></button>
          <button><Wrench size={14}/>Visi darbai<ChevronDown size={13}/></button>
        </div>
        <div className="workerList">
          {workers.map((w) => (
            <div className="workerRow" key={w.name}>
              <div className="workerIdentity"><div className="avatar">{w.initials}</div><div><b>{w.name}</b><span>{w.city}</span></div></div>
              <div><span className="status">{w.status}</span></div>
              <div className="skillWrap">{w.skills.slice(0,2).map(x=><span className="tag" key={x}>{x}</span>)}</div>
              <div className="metric"><BarChart3 size={15}/><b>{w.attendance}</b><small> atvykimas</small></div>
              <div className={w.transport ? "transport yes":"transport no"}><Car size={15}/>{w.transport?'Turi transportą':'Neturi'}</div>
              <button className="smallCta">Kviesti</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function App(){
  return (
    <>
      <header className="siteHeader">
        <div className="container headerInner">
          <Logo/>
          <nav className="mainNav">
            <a href="#kaip">Kaip tai veikia</a>
            <a href="#darbdaviams">Darbdaviams</a>
            <a href="#darbuotojams">Darbuotojams</a>
            <a href="#kainodara">Kainodara</a>
          </nav>
          <div className="headerActions">
            <button className="secondaryBtn">Prisijungti</button>
            <button className="primaryBtn">Pateikti užklausą <ArrowRight size={17}/></button>
          </div>
          <button className="menuBtn"><Menu/></button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container heroGrid">
            <div className="heroCopy">
              <div className="eyebrow">STATYBŲ PAGALBINIAI, KAI JŲ REIKIA</div>
              <h1>Reikia papildomų<br/>rankų objekte?</h1>
              <p className="lead">Raskite statybų pagalbinius pagal vietą, datą ir prieinamumą. Jokio CV siuntimo, jokio chaoso — tik realiai laisvi darbuotojai.</p>

              <div className="searchCard">
                <div className="searchGrid">
                  <SelectBox label="Miestas" icon={MapPin} value="Vilnius"/>
                  <SelectBox label="Data" icon={CalendarDays} value="Rytoj"/>
                  <SelectBox label="Kiek žmonių reikia?" icon={Users} value="3"/>
                  <SelectBox label="Darbo tipas" icon={Wrench} value="Betonavimo pagalba"/>
                  <SelectBox label="Pradžios laikas" icon={Clock3} value="08:00"/>
                  <button className="searchBtn">Rasti darbuotojus <ArrowRight size={18}/></button>
                </div>
                <div className="availabilityLine"><span></span>Vilniuje rytoj laisvi <b>18 darbuotojų</b></div>
              </div>
            </div>
            <WorkerTable/>
          </div>
        </section>

        <section className="valueStrip">
          <div className="container valueGrid">
            <div className="valueItem"><div className="iconBox"><CalendarDays/></div><div><b>Darbuotojai žymi savo užimtumą</b><p>Matote tik tuos, kurie realiai laisvi norimą dieną.</p></div></div>
            <div className="valueItem"><div className="iconBox"><BarChart3/></div><div><b>Matote atvykimo istoriją</b><p>Rinkitės pagal realius patikimumo duomenis.</p></div></div>
            <div className="valueItem"><div className="iconBox"><Users/></div><div><b>Kviečiate tik laisvus darbuotojus</b><p>Mažiau skambučių, laukimo ir bereikalingo susirašinėjimo.</p></div></div>
            <div className="valueItem"><div className="iconBox"><Sparkles/></div><div><b>Greitas pakaitinio darbuotojo suradimas</b><p>Jei žmogus neatvyksta, ieškote pakaitalo iš karto.</p></div></div>
          </div>
        </section>

        <section className="section" id="kaip">
          <div className="container">
            <div className="sectionHead"><div><span className="sectionKicker">KAIP TAI VEIKIA</span><h2>Trys žingsniai iki komandos</h2></div><a href="#">Sužinoti daugiau <ArrowRight size={16}/></a></div>
            <div className="stepsGrid">
              <div className="step"><span>01</span><div className="stepIcon"><BriefcaseBusiness/></div><h3>Pateikiate poreikį</h3><p>Nurodote miestą, datą, darbo tipą ir reikalingą žmonių skaičių.</p></div>
              <div className="step"><span>02</span><div className="stepIcon"><Search/></div><h3>Gaunate tinkamus darbuotojus</h3><p>Sistema parodo tik laisvus ir jūsų kriterijus atitinkančius žmones.</p></div>
              <div className="step"><span>03</span><div className="stepIcon"><Check/></div><h3>Patvirtinate ir pradedate</h3><p>Išsirenkate darbuotojus, išsiunčiate kvietimus ir gaunate patvirtinimus.</p></div>
            </div>
          </div>
        </section>

        <section className="dashboardSection" id="darbdaviams">
          <div className="container dashboardGrid">
            <div className="dashCopy">
              <span className="sectionKicker">DARBDAVIAMS</span>
              <h2>Visas darbuotojų poreikis viename darbo skydelyje</h2>
              <p>Matykite užsakymus, laisvus žmones, patvirtinimus ir atvykimo statistiką vienoje vietoje.</p>
              <button className="primaryBtn">Pateikti užklausą <ArrowRight size={17}/></button>
            </div>
            <div className="dashMock">
              <div className="dashTop">
                <div><small>Aktyvūs darbuotojai šiandien</small><strong>12</strong></div>
                <div><small>Atviri poreikiai</small><strong>3</strong></div>
                <div><small>Vid. atvykimas</small><strong>96%</strong></div>
                <div className="urgent"><small>Skubus poreikis</small><b>Reikia 2 žmonių rytoj</b><span>Vilnius · nuo 08:00</span></div>
              </div>
              <div className="orders">
                <div className="ordersHead"><h3>Artimiausi užsakymai</h3><button>Visi užsakymai</button></div>
                <div className="orderRow head"><span>Data</span><span>Objektas</span><span>Žmonės</span><span>Darbo tipas</span><span>Būsena</span></div>
                <div className="orderRow"><span>09-28</span><span>Vilnius, Naujamiestis</span><span>3</span><span>Betonavimo pagalba</span><span className="ok">Patvirtinta</span></div>
                <div className="orderRow"><span>09-29</span><span>Vilnius, Žirmūnai</span><span>2</span><span>Medžiagų nešiojimas</span><span className="wait">Laukia</span></div>
                <div className="orderRow"><span>10-01</span><span>Vilnius, Pilaitė</span><span>4</span><span>Tvarkymas</span><span className="ok">Patvirtinta</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section workersSection" id="darbuotojams">
          <div className="container splitPanel">
            <div>
              <span className="sectionKicker">DARBUOTOJAMS</span>
              <h2>Registracija paprasta. Darbus renkiesi pats.</h2>
              <p>Pažymėk, kada gali dirbti, kokius darbus moki ir kokiu atstumu gali nuvykti. Registracija darbuotojams – nemokama.</p>
            </div>
            <div className="workerBenefits">
              <div><Check/>Pasirenki, kada esi laisvas</div>
              <div><Check/>Matai aiškią darbo vietą ir laiką</div>
              <div><Check/>Gali priimti arba atmesti pasiūlymą</div>
              <div><Check/>Patikimumas auga su kiekvienu sėkmingu darbu</div>
            </div>
          </div>
        </section>

        <section className="section pricing" id="kainodara">
          <div className="container">
            <div className="sectionHead"><div><span className="sectionKicker">KAINODARA</span><h2>Aiškūs planai darbdaviams</h2><p>Darbuotojams platforma lieka nemokama.</p></div></div>
            <div className="pricingGrid">
              <div className="priceCard"><span>STARTERIS</span><h3>49 €<small>/mėn.</small></h3><p>Pavieniams ir mažesniems projektams.</p><ul><li><Check/>Iki 5 užklausų per mėnesį</li><li><Check/>Darbuotojų paieška</li><li><Check/>Pagrindinė statistika</li></ul><button className="secondaryBtn full">Rinktis planą</button></div>
              <div className="priceCard featured"><div className="popular">POPULIARIAUSIAS</div><span>PROFESIONALUS</span><h3>99 €<small>/mėn.</small></h3><p>Įmonėms, kurioms žmonių reikia nuolat.</p><ul><li><Check/>Iki 20 užklausų per mėnesį</li><li><Check/>Išplėstiniai filtrai</li><li><Check/>Prioritetinis palaikymas</li></ul><button className="primaryBtn full">Rinktis planą</button></div>
              <div className="priceCard"><span>VERSLUI</span><h3>199 €<small>/mėn.</small></h3><p>Didesnėms komandoms ir keliems objektams.</p><ul><li><Check/>Neribotos užklausos</li><li><Check/>Keli įmonės vartotojai</li><li><Check/>Ataskaitos ir statistika</li></ul><button className="secondaryBtn full">Susisiekti</button></div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="container footerGrid">
          <div><Logo/><p>Statybų pagalbiniai tada, kai jų reikia.</p></div>
          <div><b>Platforma</b><a>Kaip tai veikia</a><a>Darbdaviams</a><a>Darbuotojams</a></div>
          <div><b>Informacija</b><a>Kainodara</a><a>DUK</a><a>Kontaktai</a></div>
          <div><b>Teisinė informacija</b><a>Privatumo politika</a><a>Naudojimo sąlygos</a></div>
        </div>
        <div className="container footerBottom">© 2026 rankosstatybose.lt</div>
      </footer>
    </>
  )
}

export default App
