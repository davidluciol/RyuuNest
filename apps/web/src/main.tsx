import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import "virtual:ryuunest-tokens.css";
import "./app.css";
import App from "./App";

const container = document.getElementById("root");
if (container === null) {
  throw new Error("Falta el contenedor #root en index.html");
}

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
