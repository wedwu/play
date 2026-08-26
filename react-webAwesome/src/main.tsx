import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@awesome.me/webawesome/dist/styles/webawesome.css";
// import "@awesome.me/webawesome/dist/styles/themes/awesome.css";
import "@awesome.me/webawesome/dist/styles/themes/shoelace.css";

import { setBasePath } from "@awesome.me/webawesome/dist/webawesome.js";

import App from "./App.tsx";
import "./index.css";

setBasePath("https://cdn.jsdelivr.net/npm/@awesome.me/webawesome@latest/dist");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
