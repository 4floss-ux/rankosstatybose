import { BrandLogo, SilentLoader } from "../ui/brand.jsx";
import { companyTeamRoleLabel } from "../employer/plans.js";

export function TeamInvitePage({
  invite,
  loading,
  error,
  user,
  accepting,
  onLogin,
  onSignup,
  onAccept,
  onCancel,
}) {
  const valid = Boolean(invite?.valid);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f8fa",
        display: "grid",
        placeItems: "center",
        padding: 20,
        color: "#102438",
      }}
    >
      <div
        style={{
          width: "min(640px,100%)",
          background: "#fff",
          border: "1px solid #e4ebf0",
          borderRadius: 20,
          boxShadow: "0 24px 70px rgba(16,36,56,.10)",
          padding: 28,
        }}
      >
        <BrandLogo href="/" className="brand" height={46} style={{ marginBottom: 26 }} />

        <div className="eyebrow">ĮMONĖS KOMANDOS KVIETIMAS</div>

        {loading ? (
          <SilentLoader size={22} minHeight={72} />
        ) : error || !invite ? (
          <>
            <h1 style={{ margin: "6px 0 10px", fontSize: 30 }}>
              Kvietimo atidaryti nepavyko
            </h1>
            <p style={{ color: "#6c7a88", lineHeight: 1.6 }}>
              {error || "Kvietimo nuoroda nerasta."}
            </p>
            <button className="btn ghost" type="button" onClick={onCancel}>
              Grįžti į pradžią
            </button>
          </>
        ) : !valid ? (
          <>
            <h1 style={{ margin: "6px 0 10px", fontSize: 30 }}>
              Kvietimas nebegalioja
            </h1>
            <p style={{ color: "#6c7a88", lineHeight: 1.6 }}>
              Paprašykite įmonės savininko atsiųsti naują komandos kvietimą.
            </p>
            <button className="btn ghost" type="button" onClick={onCancel}>
              Grįžti į pradžią
            </button>
          </>
        ) : (
          <>
            <h1 style={{ margin: "6px 0 10px", fontSize: 30 }}>
              {invite.company_name} kviečia prisijungti
            </h1>

            <p style={{ color: "#6c7a88", lineHeight: 1.6 }}>
              Jums paruošta atskira darbdavio paskyra. Prisijungę dirbsite kaip{" "}
              <b style={{ color: "#102438" }}>
                {invite.invited_name} · {invite.company_name}
              </b>
              .
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                margin: "20px 0",
              }}
            >
              <div
                style={{
                  background: "#f6f8fa",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <span
                  style={{ display: "block", color: "#7a8996", fontSize: 11 }}
                >
                  EL. PAŠTAS
                </span>
                <b style={{ display: "block", marginTop: 5 }}>
                  {invite.email}
                </b>
              </div>

              <div
                style={{
                  background: "#f6f8fa",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <span
                  style={{ display: "block", color: "#7a8996", fontSize: 11 }}
                >
                  ROLĖ
                </span>
                <b style={{ display: "block", marginTop: 5 }}>
                  {companyTeamRoleLabel(invite.member_role)}
                </b>
              </div>
            </div>

            {!user ? (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn primary" type="button" onClick={onSignup}>
                  Sukurti paskyrą
                </button>
                <button className="btn ghost" type="button" onClick={onLogin}>
                  Jau turiu paskyrą
                </button>
              </div>
            ) : (
              <>
                {String(user.email || "").toLowerCase() !==
                  String(invite.email || "").toLowerCase() && (
                  <div
                    style={{
                      background: "#fff0ec",
                      color: "#9f4529",
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 14,
                      lineHeight: 1.5,
                    }}
                  >
                    Šis kvietimas skirtas <b>{invite.email}</b>, o dabar
                    prisijungta kaip <b>{user.email}</b>.
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    className="btn primary"
                    type="button"
                    disabled={
                      accepting ||
                      String(user.email || "").toLowerCase() !==
                        String(invite.email || "").toLowerCase()
                    }
                    onClick={onAccept}
                  >
                    {accepting ? "Jungiama..." : "Prisijungti prie komandos"}
                  </button>
                  <button className="btn ghost" type="button" onClick={onCancel}>
                    Atšaukti
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
