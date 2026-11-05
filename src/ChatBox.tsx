import React, { useState } from "react";

export function ChatBox(): React.JSX.Element {
  const [msgs, setMsgs] = useState<string[]>(["Welcome to The Wargod of Pangea."]);
  const [input, setInput] = useState("");
  const send = (): void => {
    if (!input.trim()) return;
    setMsgs((m) => [...m, input]);
    setInput("");
  };
  return (
    <div aria-label="Chat" style={{ border: "1px solid #555", padding: 8, marginTop: 8 }}>
      <div style={{ height: 120, overflow: "auto" }}>
        {msgs.map((m, i) => (
          <p key={i}>{m}</p>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") send();
        }}
      />
      <button onClick={send}>Send</button>
    </div>
  );
}
