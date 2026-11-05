import React, { useState } from "react";
import { exportSave, importSave } from "./core/save";
import { toSave, useGame } from "./core/store";

export function SaveTools(): React.JSX.Element {
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  return (
    <section aria-label="Save data">
      <h2>Save data</h2>
      <button onClick={() => setText(exportSave(toSave(useGame.getState())))}>Export</button>
      <textarea
        aria-label="Save string"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
      />
      <button
        onClick={() => {
          const r = importSave(text);
          if (r.ok) {
            useGame.getState().loadSave(r.data);
            setMessage("Save imported.");
          } else setMessage(`Import failed: ${r.error}`);
        }}
      >
        Import
      </button>
      <button
        onClick={() => {
          if (window.confirm("Erase all progress? This cannot be undone.")) {
            useGame.getState().resetGame();
            setMessage("Progress erased.");
          }
        }}
      >
        Reset progress
      </button>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
