import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/config.js";
import { SilentLoader } from "./brand.jsx";
import { normalizeCityKey } from "../lib/jobs.js";

export const LITHUANIAN_CITY_NAMES = [
  "Akmenė",
  "Alytus",
  "Anykščiai",
  "Ariogala",
  "Avižieniai",
  "Baltoji Vokė",
  "Birštonas",
  "Biržai",
  "Bukiškis",
  "Daugai",
  "Didžioji Riešė",
  "Druskininkai",
  "Dūkštas",
  "Dusetos",
  "Eišiškės",
  "Elektrėnai",
  "Ežerėlis",
  "Gargždai",
  "Garliava",
  "Gelgaudiškis",
  "Grigiškės",
  "Ignalina",
  "Jieznas",
  "Jonava",
  "Joniškėlis",
  "Joniškis",
  "Juodšiliai",
  "Jurbarkas",
  "Kaišiadorys",
  "Kalvarija",
  "Kaunas",
  "Kavarskas",
  "Kazlų Rūda",
  "Kėdainiai",
  "Kelmė",
  "Klaipėda",
  "Kretinga",
  "Kudirkos Naumiestis",
  "Kupiškis",
  "Kuršėnai",
  "Kybartai",
  "Lazdijai",
  "Lentvaris",
  "Linkuva",
  "Maišiagala",
  "Marijampolė",
  "Mažeikiai",
  "Medininkai",
  "Molėtai",
  "Naujoji Akmenė",
  "Nemenčinė",
  "Neringa",
  "Obeliai",
  "Pabradė",
  "Pagėgiai",
  "Pagiriai",
  "Pakruojis",
  "Palanga",
  "Pandėlys",
  "Panemunė",
  "Panevėžys",
  "Pasvalys",
  "Plungė",
  "Priekulė",
  "Prienai",
  "Radviliškis",
  "Ramygala",
  "Raseiniai",
  "Riešė",
  "Rietavas",
  "Rokiškis",
  "Rudamina",
  "Rūdiškės",
  "Šakiai",
  "Salantai",
  "Šalčininkai",
  "Seda",
  "Šeduva",
  "Šiauliai",
  "Šilalė",
  "Šilutė",
  "Simnas",
  "Širvintos",
  "Skaidiškės",
  "Skaudvilė",
  "Skuodas",
  "Smalininkai",
  "Subačius",
  "Sudervė",
  "Švenčionėliai",
  "Švenčionys",
  "Tauragė",
  "Telšiai",
  "Trakai",
  "Troškūnai",
  "Tytuvėnai",
  "Ukmergė",
  "Utena",
  "Užventis",
  "Vabalninkas",
  "Valčiūnai",
  "Varėna",
  "Varniai",
  "Veisiejai",
  "Venta",
  "Viekšniai",
  "Vievis",
  "Vilkaviškis",
  "Vilkija",
  "Vilnius",
  "Virbalis",
  "Visaginas",
  "Žagarė",
  "Zarasai",
  "Žiežmariai",
  "Zujūnai",
];

export const STATIC_CITY_OPTIONS = LITHUANIAN_CITY_NAMES.map((name) => ({
  city_key: normalizeCityKey(name),
  name,
}));

export let cityLocationsCache = STATIC_CITY_OPTIONS;
export let cityLocationsPromise = null;

export async function loadCityLocations() {
  if (!supabase) return STATIC_CITY_OPTIONS;

  if (!cityLocationsPromise) {
    cityLocationsPromise = supabase
      .from("city_locations")
      .select("city_key, name, latitude, longitude")
      .order("name")
      .then(({ data, error }) => {
        if (error || !data?.length) {
          return STATIC_CITY_OPTIONS;
        }

        const merged = new Map(
          STATIC_CITY_OPTIONS.map((city) => [city.city_key, city])
        );

        for (const city of data) {
          merged.set(city.city_key, city);
        }

        cityLocationsCache = [...merged.values()].sort((a, b) =>
          a.name.localeCompare(b.name, "lt")
        );

        return cityLocationsCache;
      })
      .catch(() => STATIC_CITY_OPTIONS)
      .finally(() => {
        cityLocationsPromise = null;
      });
  }

  return cityLocationsPromise;
}

export async function canonicalCityName(value) {
  const key = normalizeCityKey(value);
  if (!key) return null;

  const staticMatch = STATIC_CITY_OPTIONS.find(
    (city) =>
      city.city_key === key ||
      normalizeCityKey(city.name) === key
  );

  if (staticMatch) return staticMatch.name;

  const cities = await loadCityLocations();
  const match = cities.find(
    (city) =>
      city.city_key === key ||
      normalizeCityKey(city.name) === key
  );

  return match?.name || null;
}

export function CityAutocomplete({
  value,
  onChange,
  className = "",
  style,
  disabled = false,
  placeholder = "Pradėkite rašyti miestą",
}) {
  const [cities, setCities] = useState(cityLocationsCache);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadCityLocations().then((rows) => {
      if (!cancelled && rows?.length) {
        setCities(rows);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const query = normalizeCityKey(value);

  const exactMatch = cities.some(
    (city) =>
      city.city_key === query ||
      normalizeCityKey(city.name) === query
  );

  const suggestions = cities
    .filter((city) => {
      if (!query) return true;
      const cityKey = normalizeCityKey(city.name);
      return cityKey.includes(query);
    })
    .sort((a, b) => {
      if (!query) return a.name.localeCompare(b.name, "lt");

      const aKey = normalizeCityKey(a.name);
      const bKey = normalizeCityKey(b.name);
      const aStarts = aKey.startsWith(query) ? 0 : 1;
      const bStarts = bKey.startsWith(query) ? 0 : 1;

      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.name.localeCompare(b.name, "lt");
    })
    .slice(0, 12);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        zIndex: open ? 8000 : "auto",
      }}
    >
      <input
        className={className}
        style={style}
        value={value}
        disabled={disabled}
        autoComplete="off"
        placeholder={placeholder}
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        onMouseDown={() => {
          if (!disabled) setOpen(true);
        }}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
          }

          if (e.key === "Enter" && suggestions.length === 1) {
            e.preventDefault();
            onChange(suggestions[0].name);
            setOpen(false);
          }
        }}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 180);
        }}
      />

      {open && !disabled && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            zIndex: 8001,
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            maxHeight: 270,
            overflowY: "auto",
            background: "#fff",
            border: "1px solid #dfe7ed",
            borderRadius: 12,
            boxShadow: "0 14px 35px rgba(16,36,56,.14)",
            padding: 5,
          }}
        >
          {suggestions.length ? (
            suggestions.map((city) => (
              <button
                key={city.city_key}
                type="button"
                role="option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(city.name);
                  setOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  border: 0,
                  background:
                    normalizeCityKey(value) === city.city_key
                      ? "#fff1e5"
                      : "#fff",
                  color: "#102438",
                  textAlign: "left",
                  borderRadius: 8,
                  padding: "10px 11px",
                  font: "inherit",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {city.name}
              </button>
            ))
          ) : (
            <div
              style={{
                padding: "10px 11px",
                color: "#6c7a88",
                fontSize: 13,
              }}
            >
              Tokio miesto sąraše nėra.
            </div>
          )}
        </div>
      )}

      {!!value && !exactMatch && (
        <div
          style={{
            marginTop: 5,
            color: "#b85f0e",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          Pasirinkite miestą iš pasiūlymų sąrašo.
        </div>
      )}
    </div>
  );
}


export function AddressAutocomplete({
  value,
  city,
  onChange,
  onSelect,
  selectedAddress = null,
  inputRef = null,
  className = "ed-input",
  disabled = false,
  placeholder = "Pradėkite rašyti gatvę ir namo numerį",
  invalid = false,
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searchError, setSearchError] = useState("");
  const requestRef = useRef(0);
  const cleanValue = String(value || "").trim();
  const cleanCity = String(city || "").trim();

  useEffect(() => {
    if (disabled || cleanValue.length < 3 || !cleanCity) {
      setSuggestions([]);
      setLoading(false);
      setSearchError("");
      return;
    }

    if (selectedAddress?.label === cleanValue) {
      setSuggestions([]);
      setLoading(false);
      setSearchError("");
      return;
    }

    const requestId = ++requestRef.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setSearchError("");

      try {
        const { data, error } = await supabase.functions.invoke("geocode-address", {
          body: { mode: "suggest", query: cleanValue, city: cleanCity },
        });

        if (requestId !== requestRef.current) return;
        if (error) throw error;

        const rows = Array.isArray(data?.suggestions) ? data.suggestions : [];
        setSuggestions(
          rows.filter((row) =>
            row &&
            String(row.label || "").trim() &&
            Number.isFinite(Number(row.latitude)) &&
            Number.isFinite(Number(row.longitude))
          )
        );
      } catch (error) {
        if (requestId !== requestRef.current) return;
        console.error("Address suggestions failed", error);
        setSuggestions([]);
        setSearchError("Adreso paieška šiuo metu nepasiekiama.");
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    }, 320);

    return () => window.clearTimeout(timer);
  }, [cleanValue, cleanCity, disabled, selectedAddress?.label]);

  return (
    <div style={{ position: "relative", width: "100%", zIndex: open ? 8100 : "auto" }}>
      <input
        ref={inputRef}
        className={className}
        value={value}
        disabled={disabled}
        autoComplete="off"
        required
        aria-invalid={invalid}
        placeholder={placeholder}
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 180);
        }}
        style={invalid ? { borderColor: "#d94a3a", boxShadow: "0 0 0 2px rgba(217,74,58,.10)" } : undefined}
      />

      {open && !disabled && cleanValue.length >= 3 && selectedAddress?.label !== cleanValue && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            zIndex: 8101,
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            maxHeight: 280,
            overflowY: "auto",
            background: "#fff",
            border: "1px solid #dfe7ed",
            borderRadius: 12,
            boxShadow: "0 14px 35px rgba(16,36,56,.16)",
            padding: 5,
          }}
        >
          {loading ? (
            <SilentLoader size={16} minHeight={38} />
          ) : suggestions.length ? (
            suggestions.map((row) => (
              <button
                key={`${row.label}-${row.latitude}-${row.longitude}`}
                type="button"
                role="option"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect({
                    label: String(row.label || "").trim(),
                    latitude: Number(row.latitude),
                    longitude: Number(row.longitude),
                  });
                  setOpen(false);
                  setSuggestions([]);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  border: 0,
                  background: "#fff",
                  color: "#102438",
                  textAlign: "left",
                  borderRadius: 8,
                  padding: "10px 11px",
                  font: "inherit",
                  fontWeight: 650,
                  cursor: "pointer",
                }}
              >
                {row.label}
              </button>
            ))
          ) : (
            <div style={{ padding: "10px 11px", color: searchError ? "#b4472a" : "#6c7a88", fontSize: 13 }}>
              {searchError || "Adreso nerasta. Patikrinkite gatvę ir namo numerį."}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
