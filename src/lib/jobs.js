import { supabase } from "./config.js";

export function platformWallTime(date, time = "00:00") {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date || ""));
  const t = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/.exec(String(time || ""));
  if (!d || !t || Number(t[1]) > 23 || Number(t[2]) > 59 || Number(t[3] || 0) > 59) return null;
  const value = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]), Number(t[3] || 0));
  const parsed = new Date(value);
  return parsed.toISOString().slice(0, 10) === date ? value : null;
}

export function platformDateTime(date, time = "00:00") {
  const wall = platformWallTime(date, time);
  if (wall === null) return null;
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Vilnius", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  const representedWall = (epoch) => {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(epoch)).map(({ type, value }) => [type, value]));
    return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
  };
  const offsets = [...new Set([-86400000, 0, 86400000].map((shift) => representedWall(wall + shift) - (wall + shift)))];
  const matching = offsets.map((offset) => wall - offset).filter((epoch) => representedWall(epoch) === wall);
  // PostgreSQL selects standard time for an ambiguous or skipped DST wall time.
  return new Date(matching.length ? Math.max(...matching) : wall - Math.min(...offsets));
}

export function addPlatformDays(iso, days) {
  const wall = platformWallTime(iso);
  return wall === null ? "" : new Date(wall + days * 86400000).toISOString().slice(0, 10);
}

export function jobStartMoment(job) {
  return platformDateTime(job?.work_date, job?.start_time || "00:00");
}

export function localDateISO(date) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Vilnius", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function currentVilniusTimeRounded5() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Vilnius",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date()).map(({ type, value }) => [type, value])
  );
  const hour = String(parts.hour || "00").padStart(2, "0");
  const minute = Math.floor(Number(parts.minute || 0) / 5) * 5;
  return `${hour}:${String(minute).padStart(2, "0")}`;
}

export function nextFourteenDays() {
  const today = localDateISO(new Date());
  return Array.from({ length: 14 }, (_, i) => {
    const iso = addPlatformDays(today, i);
    const date = platformDateTime(iso, "12:00");
    return {
      iso,
      weekday: new Intl.DateTimeFormat("lt-LT", { weekday: "short", timeZone: "Europe/Vilnius" }).format(date),
      label: new Intl.DateTimeFormat("lt-LT", { day: "2-digit", month: "2-digit", timeZone: "Europe/Vilnius" }).format(date),
    };
  });
}

export function formatNetPay(amount, unit) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return "Atlygis nenurodytas";
  const formatted = Number.isInteger(value)
    ? String(value)
    : value.toLocaleString("lt-LT", { maximumFractionDigits: 2 });
  return unit === "day"
    ? `${formatted} € į rankas / dieną`
    : `${formatted} € į rankas / val.`;
}

export function formatWorkedMinutes(minutes) {
  const total = Math.max(0, Number(minutes) || 0);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (!hours) return `${mins} min.`;
  if (!mins) return `${hours} val.`;
  return `${hours} val. ${mins} min.`;
}

export function formatJobTitle(value, fallback = "Darbas") {
  const text = String(value || fallback || "").trim();
  return text ? text.toLocaleUpperCase("lt-LT") : "";
}

export function jobEndMoment(job) {
  const start = jobStartMoment(job);
  if (!start) return null;
  if (!job.end_time) return new Date(start.getTime() + 12 * 60 * 60 * 1000);
  const date = String(job.end_time) <= String(job.start_time || "00:00")
    ? addPlatformDays(job.work_date, 1) : job.work_date;
  return platformDateTime(date, job.end_time);
}

export function jobHasEnded(job) {
  const end = jobEndMoment(job);
  return end ? new Date() >= end : false;
}

export function jobHasStarted(job) {
  const start = jobStartMoment(job);
  return start ? new Date() >= start : false;
}

export function jobCheckInWindowOpen(job) {
  if (!job?.start_time) return false;
  const start = jobStartMoment(job);
  const end = jobEndMoment(job);
  if (!start || !end) return false;
  const now = new Date();
  return now >= start && now <= end;
}

export function workerCheckInWindowOpen(job) {
  if (!job?.start_time) return false;
  const start = jobStartMoment(job);
  const end = jobEndMoment(job);
  if (!start || !end) return false;
  const now = new Date();
  return now >= start && now <= end;
}

export function attendanceOutcomeLabel(attendance) {
  const outcome = attendance?.final_outcome || attendance?.employer_outcome;
  if (outcome === "full_day") return "Išdirbo visą dieną";
  if (outcome === "left_early_agreed") return "Išėjo anksčiau – suderinta";
  if (outcome === "left_early_unexcused") return "Išėjo anksčiau be pateisinamos priežasties";
  if (outcome === "no_show") return "Neatvyko";
  return "Darbo diena neuždaryta";
}


export function timeRangesOverlap(a, b) {
  const interval = (job) => {
    if (!job?.work_date) return null;
    const start = platformWallTime(job.work_date, job.start_time || "00:00");
    let end = job.end_time ? platformWallTime(job.work_date, job.end_time) : start + 12 * 60 * 60 * 1000;
    if (start === null || end === null) return null;
    if (end <= start) end += 86400000;
    return { start, end };
  };
  const first = interval(a), second = interval(b);
  if (!first || !second) return false;
  const buffer = 60 * 60 * 1000;
  return first.start < second.end + buffer && first.end + buffer > second.start;
}

export function normalizeCityKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function distanceKmBetweenPoints(a, b) {
  if (!a || !b) return null;

  const lat1 = Number(a.latitude);
  const lon1 = Number(a.longitude);
  const lat2 = Number(b.latitude);
  const lon2 = Number(b.longitude);

  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;

  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export const SEARCH_LOCATION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function isSearchLocationFresh(updatedAt) {
  if (!updatedAt) return false;
  const updatedMs = new Date(updatedAt).getTime();
  return Number.isFinite(updatedMs) && Date.now() - updatedMs <= SEARCH_LOCATION_MAX_AGE_MS;
}

export function requestBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Ši naršyklė nepalaiko vietos nustatymo."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });
}

export function browserLocationErrorMessage(error) {
  if (error?.code === 1) {
    return "Vietos leidimas nesuteiktas. Naršyklėje leiskite vietos nustatymą ir bandykite dar kartą.";
  }
  if (error?.code === 2) {
    return "Nepavyko nustatyti jūsų buvimo vietos. Patikrinkite įrenginio vietos nustatymus ir bandykite dar kartą.";
  }
  if (error?.code === 3) {
    return "Vietos nustatymas užtruko per ilgai. Bandykite dar kartą.";
  }
  return error?.message || "Nepavyko nustatyti jūsų buvimo vietos.";
}

export async function geocodeJobAddress(address, city) {
  const cleanAddress = String(address || "").trim();
  const cleanCity = String(city || "").trim();

  if (!supabase || !cleanAddress || !cleanCity) {
    return { found: false, latitude: null, longitude: null };
  }

  const { data, error } = await supabase.functions.invoke("geocode-address", {
    body: { address: cleanAddress, city: cleanCity },
  });

  if (error) throw error;

  const latitude = Number(data?.latitude);
  const longitude = Number(data?.longitude);
  const validCoordinates =
    Boolean(data?.found) &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180;

  return {
    found: validCoordinates,
    latitude: validCoordinates ? latitude : null,
    longitude: validCoordinates ? longitude : null,
  };
}

export function workerDistanceLabel(worker) {
  if (worker?.distanceKm === null || worker?.distanceKm === undefined) return "";

  const distance = Number(worker.distanceKm);
  if (!Number.isFinite(distance)) return "";

  if (worker.distanceSource === "location") {
    return `~${distance} km nuo darbo`;
  }

  if (worker.distanceSource === "city") {
    return distance === 0 ? "Tas pats miestas" : `~${distance} km pagal miestą`;
  }

  return `~${distance} km nuo darbo`;
}

export function notificationPresentation(events = []) {
  const types = events.map((event) => event.event_type);

  if (types.includes("invitation_declined")) {
    return { tone: "red", label: "⚑ Darbuotojas atsisakė" };
  }
  if (types.includes("invitation_cancelled")) {
    return { tone: "red", label: "⚑ Darbdavys atšaukė" };
  }
  if (types.includes("job_updated")) {
    return { tone: "orange", label: "● Darbas atnaujintas" };
  }
  if (types.includes("invitation_accepted")) {
    return { tone: "green", label: "✓ Darbuotojas priėmė" };
  }
  if (types.includes("attendance_resolved_in_favor")) {
    return { tone: "green", label: "✓ Ginčas išspręstas jūsų naudai" };
  }
  if (types.includes("attendance_resolved_against")) {
    return { tone: "red", label: "Ginčas išspręstas ne jūsų naudai" };
  }
  if (types.includes("attendance_resolved")) {
    return { tone: "green", label: "✓ Ginčas išspręstas" };
  }
  if (types.includes("attendance_disputed")) {
    return { tone: "red", label: "⚑ Darbo dienos ginčas" };
  }
  if (types.includes("attendance_review_required")) {
    return { tone: "orange", label: "● Reikia patvirtinti darbo dieną" };
  }
  if (types.includes("attendance_action_required")) {
    return { tone: "orange", label: "● Reikia uždaryti darbo dieną" };
  }
  if (types.includes("worker_checked_in")) {
    return { tone: "green", label: "✓ Darbuotojas pažymėjo „Atvykau“" };
  }
  if (types.includes("employer_checked_in")) {
    return { tone: "green", label: "✓ Darbdavys patvirtino atvykimą" };
  }
  if (types.includes("attendance_finalized")) {
    return { tone: "green", label: "✓ Darbo diena uždaryta" };
  }
  if (types.includes("invitation_expired")) {
    return { tone: "muted", label: "Kvietimas nebegalioja" };
  }

  return { tone: "orange", label: "● Yra naujienų" };
}
