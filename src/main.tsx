import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import { initPersistence } from "./core/persistence";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("root element missing");
initPersistence();
createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
