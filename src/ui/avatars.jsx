import { supabase } from "../lib/config.js";

export function workerAvatarUrl(path) {
  if (!path) return "";
  return (
    supabase.storage.from("worker-avatars").getPublicUrl(path).data
      ?.publicUrl || ""
  );
}

export function companyAvatarUrl(path) {
  if (!path) return "";
  return (
    supabase.storage.from("worker-avatars").getPublicUrl(path).data
      ?.publicUrl || ""
  );
}

export function workerInitials(name) {
  return String(name || "D")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function companyInitials(name) {
  return String(name || "Į")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function CompanyBadge({ name, avatarPath, size = 34, fontSize = 13 }) {
  const logoUrl = companyAvatarUrl(avatarPath);

  return (
    <span
      className="wd-company-badge"
      style={{ width: size, height: size, minWidth: size, fontSize }}
      aria-hidden="true"
    >
      {logoUrl ? (
        <img src={logoUrl} alt="" />
      ) : (
        <span>{companyInitials(name)}</span>
      )}
    </span>
  );
}
