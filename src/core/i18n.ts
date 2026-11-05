import en from "../locales/en.json";

type Dict = Record<string, unknown>;

/** Looks up a dotted key in the locale file; falls back to the key so gaps are visible, not blank. */
export function t(key: string): string {
  let cur: unknown = en;
  for (const part of key.split(".")) {
    if (typeof cur !== "object" || cur === null) return key;
    cur = (cur as Dict)[part];
  }
  return typeof cur === "string" ? cur : key;
}

/** Themed skill name (e.g. "Skullcleaving"), falling back to the data's displayName. */
export function skillName(id: string, fallback: string): string {
  const v = (en.skills as Record<string, string>)[id];
  return v ?? fallback;
}
