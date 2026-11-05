import { loadGameResult, saveGame } from "./save";
import { toSave, useGame } from "./store";

const AUTOSAVE_MS = 400;

/** Loads the save into the store, then autosaves (debounced) on every change. Returns a disposer. */
export function initPersistence(): () => void {
  const loaded = loadGameResult();
  if (loaded.kind === "ok") useGame.getState().loadSave(loaded.data);
  if (loaded.kind === "corrupt") {
    useGame
      .getState()
      .setRecoveryNote(
        `Your save could not be read, so you are starting fresh. The old data was kept under "${loaded.backupKey}" in this browser's storage.`,
      );
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const flush = (): void => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    saveGame(toSave(useGame.getState()));
  };
  // Only persist when game data changes, not on UI-only store updates.
  let last = toSave(useGame.getState());
  const unsubscribe = useGame.subscribe((state) => {
    const snap = toSave(state);
    if (JSON.stringify(snap) === JSON.stringify(last)) return;
    last = snap;
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(flush, AUTOSAVE_MS);
  });
  window.addEventListener("pagehide", flush);
  return () => {
    unsubscribe();
    window.removeEventListener("pagehide", flush);
    if (timer !== undefined) flush();
  };
}
