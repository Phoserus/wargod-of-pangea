import { useSyncExternalStore } from "react";

export const SCREENS = [
  "menu",
  "play",
  "combat",
  "crafting",
  "economy",
  "quests",
  "pvp",
  "settings",
  "debug",
] as const;
export type Screen = (typeof SCREENS)[number];

export function parseHash(hash: string): Screen {
  const id = hash.replace(/^#\/?/, "");
  return (SCREENS as readonly string[]).includes(id) ? (id as Screen) : "menu";
}

function subscribe(cb: () => void): () => void {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}

export function navigate(screen: Screen): void {
  window.location.hash = `/${screen}`;
}

/** Current screen from the URL hash, so reload and the back button keep your place. */
export function useRoute(): Screen {
  return parseHash(useSyncExternalStore(subscribe, () => window.location.hash));
}
