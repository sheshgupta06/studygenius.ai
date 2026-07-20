import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/globals.css";

// Apply stored theme on initial load (before React renders)
const storedTheme = JSON.parse(localStorage.getItem("studygenius-theme") || '{"state":{"theme":"dark"}}');
const theme = storedTheme?.state?.theme || "dark";
document.documentElement.classList.add(theme);

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
