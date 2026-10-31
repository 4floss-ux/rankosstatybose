

export function SuspendedAccount({
  onLogout,
  suspendedUntil,
  reason,
  disabled = false,
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f8fa",
        display: "grid",
        placeItems: "center",
        padding: 20,
        color: "#222631",
      }}
    >
      <div
        style={{
          width: "min(620px,100%)",
          background: "#fff",
          border: "1px solid #e4ebf0",
          borderRadius: 18,
          padding: 26,
          boxShadow: "0 18px 55px rgba(34,38,49,.10)",
        }}
      >
        <div className="eyebrow">
          {disabled ? "PASKYRA IŠJUNGTA" : "PASKYRA SUSPENDUOTA"}
        </div>

        <h1
          style={{
            fontFamily: "Manrope,Inter,sans-serif",
            margin: "6px 0 10px",
            fontSize: 28,
          }}
        >
          {disabled
            ? "Šios paskyros naudojimas išjungtas"
            : "Šios paskyros naudojimas laikinai sustabdytas"}
        </h1>

        <p style={{ color: "#6c7a88", lineHeight: 1.6 }}>
          {disabled
            ? "Administratoriaus sprendimu ši paskyra šiuo metu negali naudotis platformos funkcijomis."
            : `Paskyra suspenduota iki ${
                suspendedUntil
                  ? new Date(suspendedUntil).toLocaleString("lt-LT", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "nurodyto termino"
              }.`}
        </p>

        {reason && (
          <div
            style={{
              marginTop: 14,
              padding: 13,
              borderRadius: 10,
              background: "#f1eef8",
              color: "#433960",
              lineHeight: 1.5,
            }}
          >
            <b>Priežastis:</b> {reason}
          </div>
        )}

        <div
          style={{
            marginTop: 20,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button className="btn ghost" onClick={onLogout}>
            Atsijungti
          </button>
        </div>
      </div>
    </div>
  );
}
