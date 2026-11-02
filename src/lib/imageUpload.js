// Nuotraukų sumažinimas naršyklėje prieš įkeliant į saugyklą.
// PDF ir kiti ne paveikslėlių failai grąžinami nepakeisti. Nepavykus – grąžinamas originalas.

const IMAGE_TYPES = /^image\/(jpeg|png|webp)$/;
export const MB = 1024 * 1024;

export async function shrinkImage(file, { maxSide = 2000, quality = 0.82 } = {}) {
  if (!file || !IMAGE_TYPES.test(file.type) || typeof createImageBitmap !== "function" || typeof document === "undefined") return file;
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    // Mažos nuotraukos be reikalo neperkoduojamos.
    if (scale === 1 && file.size <= 400 * 1024) return file;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // PNG gali turėti permatomumą (logotipai) – jį išlaikome WEBP formatu, kitus verčiame JPEG.
    const outType = file.type === "image/jpeg" ? "image/jpeg" : "image/webp";
    if (outType === "image/jpeg") {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, outType, quality));
    // Senesnės naršyklės WEBP gali nepalaikyti – tada paliekame originalą.
    if (!blob || blob.type !== outType || blob.size >= file.size) return file;
    const base = String(file.name || "nuotrauka").replace(/\.[^.]+$/, "").slice(0, 100);
    return new File([blob], `${base}.${outType === "image/webp" ? "webp" : "jpg"}`, { type: outType, lastModified: Date.now() });
  } catch {
    return file;
  } finally {
    bitmap?.close?.();
  }
}

// Bendras patikrinimas: tipas pagal MIME ir plėtinį, dydis po sumažinimo.
export async function prepareUpload(file, { types, maxBytes, maxSide = 2000, tooBig, badType }) {
  if (!file) throw new Error("Pasirinkite failą.");
  const ext = String(file.name || "").split(".").pop().toLowerCase();
  const ok = types.some((t) => (t.startsWith(".") ? `.${ext}` === t : file.type === t));
  if (!ok) throw new Error(badType || "Netinkamas failo formatas.");
  const prepared = await shrinkImage(file, { maxSide });
  if (prepared.size > maxBytes) throw new Error(tooBig || `Failas per didelis – iki ${Math.round(maxBytes / MB)} MB.`);
  return prepared;
}

export function safeExt(file, fallback = "bin") {
  const fromType = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" }[file?.type];
  if (fromType) return fromType;
  const ext = String(file?.name || "").split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
  return ext || fallback;
}
