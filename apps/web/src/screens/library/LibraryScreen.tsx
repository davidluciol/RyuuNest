import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { t } from "@ryuunest/i18n";
import type { MediaKind } from "@ryuunest/core";
import { kindLabel } from "@ryuunest/mobile-src/components/kindLabel";

import Chip from "../../components/Chip";
import CoverCard from "../../components/CoverCard";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import TextField from "../../components/TextField";
import { seriesPath } from "../../routes";
import { useServices } from "../../services/ServicesContext";
import "./library.css";
import { loadLibraryWeb, type LibraryWebData } from "./libraryData";

/**
 * F25 — Biblioteca web: cuadrícula de favoritos reales (sql.js + IndexedDB)
 * con búsqueda, filtros por tipo/«leyendo» y NSFW oculto por defecto (RF-35).
 * Tocar una portada abre la ficha. Estados: carga, vacío, error, datos.
 */
export default function LibraryScreen() {
  const services = useServices();
  const navigate = useNavigate();
  const [view, setView] = useState<
    { status: "loading" } | { status: "error" } | { status: "ready"; data: LibraryWebData }
  >({ status: "loading" });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setView({ status: "loading" });
    loadLibraryWeb(services.driver)
      .then((data) => {
        if (!cancelled) setView({ status: "ready", data });
      })
      .catch(() => {
        if (!cancelled) setView({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [services, nonce]);

  const retry = () => {
    setView({ status: "loading" });
    setNonce((v) => v + 1);
  };

  return (
    <div className="screen library-screen" data-testid="screen-library">
      <header className="screen-header">
        <h1 className="t-headline-md">{t("nav.library")}</h1>
      </header>
      {view.status === "loading" && <LoadingState label={t("state.loading.title")} testID="library-loading" />}
      {view.status === "error" && (
        <ErrorState
          title={t("state.error.library.title")}
          message={t("state.error.library.message")}
          actionLabel={t("actions.retry")}
          onAction={retry}
          testID="library-error"
        />
      )}
      {view.status === "ready" && (
        <LibraryReady
          data={view.data}
          onOpenSeries={(moduleId, seriesId) => navigate(seriesPath(moduleId, seriesId))}
          onExplore={() => navigate("/sources")}
        />
      )}
    </div>
  );
}

function LibraryReady({
  data,
  onOpenSeries,
  onExplore,
}: {
  data: LibraryWebData;
  onOpenSeries: (moduleId: string, seriesId: string) => void;
  onExplore: () => void;
}) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<MediaKind | "all">("all");
  const [reading, setReading] = useState<"all" | "reading">("all");

  const kinds = useMemo(
    () => Array.from(new Set(data.entries.map((e) => e.kind).filter((k): k is MediaKind => k !== null))),
    [data.entries],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.entries.filter((entry) => {
      if (entry.nsfw) return false; // RF-35: NSFW oculto por defecto
      if (kind !== "all" && entry.kind !== kind) return false;
      if (reading === "reading" && entry.progress === null) return false;
      if (q !== "" && !entry.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data.entries, query, kind, reading]);

  if (data.entries.length === 0) {
    return (
      <EmptyState
        title={t("state.empty.library.title")}
        message={t("state.empty.library.message")}
        actionLabel={t("actions.addRepository")}
        onAction={onExplore}
        testID="library-empty"
      />
    );
  }

  return (
    <div className="library-content">
      <div className="library-toolbar">
        <TextField label={t("series.search")} value={query} onChange={setQuery} testID="library-search" />
        <div className="library-chips">
          <Chip label={t("sources.chip.all", { count: data.entries.length })} active={kind === "all" && reading === "all"} onClick={() => { setKind("all"); setReading("all"); }} testID="library-chip-all" />
          <Chip label={t("home.section.continue")} active={reading === "reading"} onClick={() => setReading(reading === "reading" ? "all" : "reading")} testID="library-chip-reading" />
          {kinds.map((k) => (
            <Chip key={k} label={kindLabel(k)} active={kind === k} onClick={() => setKind(kind === k ? "all" : k)} testID={`library-chip-${k}`} />
          ))}
        </div>
      </div>
      {visible.length === 0 ? (
        <p className="t-body-md library-empty-results">{t("sources.filtered.title")}</p>
      ) : (
        <ul className="library-grid" data-testid="library-grid">
          {visible.map((entry) => (
            <li key={`${entry.moduleId}:${entry.seriesId}`}>
              <CoverCard
                entry={entry}
                onClick={() => onOpenSeries(entry.moduleId, entry.seriesId)}
                testID={`library-card-${entry.seriesId}`}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
