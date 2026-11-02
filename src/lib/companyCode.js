// Tik formato / kontrolinio skaitmens patikra, ne įmonės egzistavimo registre įrodymas.
export function companyCodeError(value) {
  const code = typeof value === "string" ? value.trim() : "";
  if (!/^(?:[1-9][0-9]{6}|[1-9][0-9]{8})$/.test(code)) {
    return "Įveskite 9 skaitmenų juridinio asmens kodą arba 7 skaitmenų istorinį kodą.";
  }
  // Istoriniams 7 skaitmenų kodams šiuolaikinis kontrolinis skaitmuo netaikomas.
  // Jų egzistavimą ir atitiktį įmonei administratorius tikrina registre.
  if (code.length === 7) return "";
  const digits = [...code].map(Number);
  let checksum = digits.slice(0, 8).reduce((sum, digit, i) => sum + digit * (i + 1), 0) % 11;
  if (checksum === 10) {
    checksum = digits.slice(0, 8).reduce((sum, digit, i) => sum + digit * ((i + 2) % 9 + 1), 0) % 11;
    if (checksum === 10) checksum = 0;
  }
  return checksum === digits[8] ? "" : "Neteisingas įmonės kodo kontrolinis skaitmuo.";
}


// Administratoriaus redaktorius neturi sugadinti senų įrašų:
// nepakitusio istorinio kodo neblokuojame, tačiau naują ar pakeistą tikriname.
export function companyCodeEditError(value, originalValue) {
  const next = typeof value === "string" ? value.trim() : "";
  const original = typeof originalValue === "string" ? originalValue.trim() : "";
  if (next === original) return "";
  if (!next) {
    return original
      ? "Juridinio asmens kodo pašalinti negalima. Jei tai privatus darbdavys, pirmiausia patikrinkite jo tipą."
      : "";
  }
  return companyCodeError(next);
}
