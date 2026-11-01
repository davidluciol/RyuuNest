import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { t } from "@ryuunest/i18n";
import { kindLabel } from "@ryuunest/mobile-src/components/kindLabel";
import {
  createInstalledDiscoverSource,
} from "@ryuunest/mobile-src/screens/discover/discoverData";
import type {
  DiscoverEntry,
  DiscoverReady,
} from "@ryuunest/mobile-src/screens/discover/discoverFixtures";
import { useDiscoverData } from "@ryuunest/mobile-src/screens/discover/useDiscoverData";

import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import TextField from "../../components/TextField";
import { createWebScriptLoader } from "../../data/webScriptLoader";
import { seriesPath } from "../../routes";
import { useServices } from "../../services/ServicesContext";
import "./discover.css";

/**
 * F25 — pantalla Descubrir web: lista los módulos **instalados** (incluidos
 * los `script`, que montan en el Web Worker) y muestra latest/popular/filtro
 * del módulo elegido. La máquina de estados es la de móvil (`useDiscoverData`
 * inyectando fuente y reporter, P-115). Tocar una serie navega a su ficha.
 */
export default function DiscoverScreen() {
  const services = useServices();
  const source = useMemo(() => {
    const loader = createWebScriptLoader();
    return createInstalledDiscoverSource({
      driver: services.driver,
      http: services.http,
      loader,
    });
  }, [services]);
  const { view, selectModule, search, nextPage, prevPage, retry } = useDiscoverData({
    source,
    reporter: services.reporter,
  });
  const navigate = useNavigate();

  return (
    <div className="screen discover-screen" data-testid="screen-discover">
      <header className="screen-header">
        <h1 className="t-headline-md">{t("nav.discover")}</h1>
      </header>

      {view.status === "loading" && <LoadingState label={t("state.loading.title")} testID="discover-loading" />}

      {view.status === "error" && (
        <ErrorState
          title={t("state.error.module.title")}
          message={t("state.error.module.message")}
          actionLabel={t("actions.retry")}
          onAction={retry}
          testID="discover-error"
        />
      )}

      {view.status === "empty" && (
        <EmptyState
          title={t("state.empty.discover.title")}
          message={t("state.empty.discover.message")}
          actionLabel={t("actions.addRepository")}
          onAction={() => navigate("/sources")}
          testID="discover-empty"
        />
      )}

      {view.status === "ready" && (
        <DiscoverReady
          view={view.ready}
          onSelectModule={selectModule}
          onSearch={search}
          onNextPage={nextPage}
          onPrevPage={prevPage}
          onOpenSeries={(moduleId, seriesId) => navigate(seriesPath(moduleId, seriesId))}
        />
      )}
    </div>
  );
}

function DiscoverReady({
  view,
  onSelectModule,
  onSearch,
  onNextPage,
  onPrevPage,
  onOpenSeries,
}: {
  view: DiscoverReady;
  onSelectModule: (id: string) => void;
  onSearch: (query: string) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onOpenSeries: (moduleId: string, seriesId: string) => void;
}) {
  const [query, setQuery] = useState("");
  return (
    <div className="discover-content">
      <div className="discover-toolbar">
        {view.modules.length > 0 && (
          <div className="discover-modules" role="tablist" aria-label={t("discover.sheet.title")}>
            {view.modules.map((module) => (
              <Chip
                key={module.id}
                label={module.name}
                active={module.id === view.selectedModuleId}
                onClick={() => onSelectModule(module.id)}
                testID={`discover-module-${module.id}`}
              />
            ))}
          </div>
        )}
        <form
          className="discover-search"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch(query);
          }}
        >
          <TextField
            label={t("discover.search.placeholder")}
            value={query}
            onChange={setQuery}
            placeholder={t("discover.search.placeholder")}
            testID="discover-search"
          />
          <Button label={t("discover.search.placeholder")} testID="discover-search-submit" type="submit" />
        </form>
      </div>

      {view.latest.length > 0 && (
        <section className="discover-section">
          <h2 className="t-title-lg">{t("discover.section.latest")}</h2>
          <EntryGrid entries={view.latest} selectedModuleId={view.selectedModuleId} onOpenSeries={onOpenSeries} />
        </section>
      )}
      {view.popular.length > 0 && (
        <section className="discover-section">
          <h2 className="t-title-lg">{t("discover.section.popular")}</h2>
          <EntryGrid entries={view.popular} selectedModuleId={view.selectedModuleId} onOpenSeries={onOpenSeries} />
        </section>
      )}
      <section className="discover-section">
        <h2 className="t-title-lg">{t("discover.section.catalog")}</h2>
        {view.catalog.entries.length === 0 ? (
          <p className="t-body-md discover-empty-results">
            {view.query === "" ? "" : t("state.empty.search.message", { query: view.query })}
          </p>
        ) : (
          <EntryGrid entries={view.catalog.entries} selectedModuleId={view.selectedModuleId} onOpenSeries={onOpenSeries} />
        )}
        <div className="discover-pager">
          <Button
            variant="secondary"
            label={t("discover.page.previous")}
            onClick={onPrevPage}
            disabled={view.catalog.page <= 1}
            testID="discover-prev"
          />
          <span className="t-body-sm discover-page-label">{t("discover.page.label", { page: view.catalog.page })}</span>
          <Button
            variant="secondary"
            label={t("discover.page.next")}
            onClick={onNextPage}
            disabled={!view.catalog.hasNext}
            testID="discover-next"
          />
        </div>
      </section>
    </div>
  );
}

function EntryGrid({
  entries,
  selectedModuleId,
  onOpenSeries,
}: {
  entries: readonly DiscoverEntry[];
  selectedModuleId: string;
  onOpenSeries: (moduleId: string, seriesId: string) => void;
}) {
  return (
    <ul className="discover-grid">
      {entries.map((entry) => (
        <li key={entry.seriesId}>
          <button
            type="button"
            className="discover-card"
            onClick={() => onOpenSeries(entry.moduleId ?? selectedModuleId, entry.seriesId)}
            data-testid={`discover-entry-${entry.seriesId}`}
          >
            <span className="t-body-md discover-card-title">{entry.title}</span>
            <span className="discover-card-meta">
              {entry.kind !== null && <Badge label={kindLabel(entry.kind)} />}
              {entry.nsfw && <Badge label={t("sources.badge.nsfw")} tone="warning" />}
            </span>
            {entry.hint !== null && <span className="t-body-sm discover-card-hint">{entry.hint}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}
