import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "virtual:ryuunest-tokens.css";
import "@ryuunest/web/app.css";

import { createChromeDomainsApi } from "./chromeDomainsApi";
import OptionsApp from "./OptionsApp";

const container = document.getElementById("root");
if (container === null) {
  throw new Error("Falta el contenedor #root en options.html");
}

createRoot(container).render(
  <StrictMode>
    <OptionsApp api={createChromeDomainsApi()} />
  </StrictMode>,
);
