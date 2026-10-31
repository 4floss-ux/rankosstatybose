import { addPlatformDays, localDateISO } from "../lib/jobs.js";

export const EMPLOYER_ANNUAL_DISCOUNT = 0.2;
export const EMPLOYER_TRIAL_DAYS = 30;
export const BUSINESS_PRESENTATION_TOKEN = "imones-30d-business-7f4c29a1";

export function businessPresentationUrl() {
  const url = new URL("/", window.location.origin);
  url.searchParams.set("pristatymas", BUSINESS_PRESENTATION_TOKEN);
  return url.href;
}

export function employerPlanAnnualPrice(plan) {
  return Math.round(Number(plan?.price || 0) * 12 * (1 - EMPLOYER_ANNUAL_DISCOUNT) * 100) / 100;
}

export function employerPlanAnnualSavings(plan) {
  return Math.round(Number(plan?.price || 0) * 12 * EMPLOYER_ANNUAL_DISCOUNT * 100) / 100;
}

export function employerPlanAnnualMonthlyEquivalent(plan) {
  return Math.round(Number(plan?.price || 0) * (1 - EMPLOYER_ANNUAL_DISCOUNT) * 100) / 100;
}

export function formatPlanPrice(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const EMPLOYER_PLANS = [
  {
    key: "basic",
    name: "Basic",
    price: 0,
    description:
      "Nemokamas planas darbdaviui, kuris nori pradėti darbuotojų paiešką.",
    features: [
      "Iki 5 darbo pasiūlymų per mėnesį",
      "Darbuotojų paieška ir kvietimai",
      "1 paskyros naudotojas",
    ],
  },
  {
    key: "business",
    name: "Business",
    price: 29,
    description:
      "Darbdaviui, kuris darbuotojų ieško reguliariai ir nori daugiau atrankos bei valdymo galimybių.",
    features: [
      "Viskas, kas yra Basic plane",
      "Iki 25 darbo pasiūlymų per mėnesį",
      "Darbuotojų patikimumas ir įvertinimai",
      "„Darbuotojai favoritai“ – išsaugoti gerai pasirodžiusius darbuotojus",
      "Privatūs ir bendri darbo pokalbiai",
      "Išplėstinė darbdavio statistika",
      "1 paskyros naudotojas",
    ],
  },
  {
    key: "business_pro",
    name: "Business Pro",
    price: 59,
    description:
      "Darbdaviui ar komandai, kuriai reikia neribotų darbų, atsakomybių paskirstymo ir pilno valdymo vienoje sistemoje.",
    features: [
      "Viskas, kas yra Business plane",
      "Neribotas darbo pasiūlymų skaičius",
      "Iki 5 paskyros komandos narių",
      "Savininko, vadovo ir vadybininko rolės",
      "„Mano darbai“ ir „Visi darbdavio darbai“",
      "Atsakingo žmogaus priskyrimas ir darbų perskirstymas",
      "Atskira vadybininko darbų statistika",
      "„Skubiai!“ – tiesioginiai šiuo metu laisvų darbuotojų kontaktai",
      "Vidinis komandos pokalbis platformoje",
    ],
  },
];

export function employerPlanName(key) {
  return (
    EMPLOYER_PLANS.find((item) => item.key === key)?.name || "Basic"
  );
}

export function employerSubscriptionStatusLabel(status) {
  if (status === "trialing") return "Bandomasis laikotarpis";
  if (status === "past_due") return "Laukiama apmokėjimo";
  if (status === "cancelled") return "Nutraukta";
  return "Aktyvus";
}

export function isComplimentaryBusinessTrial(planSummary, billingStatus) {
  return (
    planSummary?.plan_key === "business" &&
    planSummary?.subscription_status === "trialing" &&
    !billingStatus?.has_stripe_subscription
  );
}

export async function edgeFunctionErrorMessage(error, fallback) {
  try {
    const response = error?.context;
    if (response && typeof response.json === "function") {
      const payload = await response.json();
      if (payload?.error) return payload.error;
      if (payload?.message) return payload.message;
    }
  } catch {
    // Jei atsako nepavyksta perskaityti, naudojame standartinį tekstą.
  }

  const raw = String(error?.message || "").trim();
  if (
    raw &&
    !raw.toLowerCase().includes("edge function returned a non-2xx status code")
  ) {
    return raw;
  }

  return fallback;
}

export function companyTeamRoleLabel(role) {
  if (role === "admin") return "Administratorius";
  if (role === "owner") return "Savininkas";
  if (role === "manager") return "Vadovas";
  return "Vadybininkas";
}

export function companyTeamInviteLink(token) {
  if (!token) return "";
  return `${window.location.origin}${window.location.pathname}?team_invite=${encodeURIComponent(
    token
  )}`;
}


export function employerTomorrowISO() {
  return addPlatformDays(localDateISO(new Date()), 1);
}

export function workerRecentActivityLabel(value) {
  if (!value) return "";

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";

  const hours = Math.max(0, (Date.now() - timestamp) / (60 * 60 * 1000));

  if (hours < 24) return "Aktyvus šiandien";
  if (hours < 48) return "Aktyvus vakar";
  return "Aktyvus per 3 d.";
}

export function shortWorkerName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Darbuotojas";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1][0]}.`;
}

export function reliabilityScoreColor(value) {
  const score = Math.max(0, Math.min(100, Number(value ?? 0)));
  const hue = 140 * Math.pow(score / 100, 1.8);
  return `hsl(${hue} 72% 34%)`;
}

export function formatReliabilityScore(value) {
  const score = Math.max(0, Math.min(100, Number(value ?? 0)));
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

export function formatReliabilityPenaltyDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("lt-LT");
}

export function formatReliabilityChange(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return "—";
  const normalized = Number.isInteger(number) ? String(number) : number.toFixed(1).replace(".", ",");
  return number > 0 ? `+${normalized}` : normalized;
}

export function workerReliabilityPenaltyMeta(penalty) {
  if (penalty?.penalty_type === "no_show") {
    return { change: -7, label: "Neatvykimas į patvirtintą darbą" };
  }
  if (penalty?.penalty_type === "unexcused_early_leave") {
    return { change: -3, label: "Nepagrįstas ankstyvas išėjimas iš darbo" };
  }
  return { change: 0, label: penalty?.reason || "Patikimumo pažeidimas" };
}

export function employerReliabilityPenaltyMeta(penalty) {
  const change = Number(penalty?.reliability_change || 0);
  if (penalty?.penalty_type === "job_cancelled") {
    return { change, label: "Atšauktas darbuotojo jau patvirtintas darbas" };
  }
  if (penalty?.penalty_type === "false_attendance_claim") {
    return { change, label: "Nepagrįstas neigiamas darbo dienos pažymėjimas" };
  }
  return { change, label: penalty?.reason || "Patikimumo pažeidimas" };
}
