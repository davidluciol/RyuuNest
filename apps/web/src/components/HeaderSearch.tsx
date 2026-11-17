import { useState } from "react";
import { useNavigate } from "react-router";

import { t } from "@ryuunest/i18n";

import { Search, X } from "../icons";
import { discoverSearchPath } from "../routes";
import "./headerSearch.css";

/**
 * F60 — búsqueda global de la cabecera: la lupa abre un campo; al enviar, lleva a Aventuras
 * con la consulta ya lanzada. Cerrar o enviar vacío no navega.
 */
export default function HeaderSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const close = () => {
    setOpen(false);
    setDraft("");
  };

  if (!open) {
    return (
      <button
        type="button"
        className="header-search-button"
        aria-label={t("shell.search.open")}
        data-testid="header-search-open"
        onClick={() => setOpen(true)}
      >
        <Search size={20} aria-hidden />
      </button>
    );
  }

  return (
    <form
      className="header-search"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const path = discoverSearchPath(draft, Date.now());
        if (path !== null) navigate(path);
        close();
      }}
    >
      <input
        className="header-search-input t-body-md"
        type="text"
        autoFocus
        value={draft}
        placeholder={t("discover.search.placeholder")}
        aria-label={t("discover.search.placeholder")}
        data-testid="header-search-input"
        onChange={(event) => setDraft(event.target.value)}
      />
      <button
        type="button"
        className="header-search-button"
        aria-label={t("shell.search.close")}
        data-testid="header-search-close"
        onClick={close}
      >
        <X size={20} aria-hidden />
      </button>
    </form>
  );
}
