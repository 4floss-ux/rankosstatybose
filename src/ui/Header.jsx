import { BrandLogo } from "./brand.jsx";

export function Header({ onLogin, onEmployerSignup, user, onLogout }) {
  return (
    <header className="header">
      <div className="container nav">
        <BrandLogo className="brand" href="#" height={46} />

        <nav className="navlinks">
          <a href="#kaip">Kaip tai veikia</a>
          <a href="#darbdaviams">Darbdaviams</a>
          <a href="#darbuotojams">Darbuotojams</a>
          <a href="#kainodara">Kainodara</a>
        </nav>

        <div className="nav-actions">
          {user ? (
            <button className="btn ghost" onClick={onLogout}>
              Atsijungti
            </button>
          ) : (
            <button className="btn ghost" onClick={onLogin}>
              Prisijungti
            </button>
          )}

          <button className="btn primary" onClick={onEmployerSignup}>
            Pateikti užklausą
          </button>
        </div>
      </div>
    </header>
  );
}
