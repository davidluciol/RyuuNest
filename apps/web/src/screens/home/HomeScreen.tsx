import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { t } from "@ryuunest/i18n";

import CoverCard from "../../components/CoverCard";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import { readerPath, seriesPath } from "../../routes";
import { useServices } from "../../services/ServicesContext";
import "../library/library.css";
import "./home.css";
import { loadHomeWeb, type HomeWebData } from "../library/libraryData";

/**
 * F25 — Inicio web: «Continuar la Aventura» (series con progreso, reanuda en el
 * capítulo y página guardados), «Lecturas Recientes» y carpetas, todo sobre la
 * base real. Sin datos de ejemplo: vacío real si no hay favoritos.
 */
export default function HomeScreen() {
  const services = useServices();
  const navigate = useNavigate();
  const [view, setView] = useState<
    { status: "loading" } | { status: "error" } | { status: "ready"; data: HomeWebData }
  >({ status: "loading" });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setView({ status: "loading" });
    loadHomeWeb(services.driver)
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

  return (
    <div className="screen home-screen" data-testid="screen-home">
      <header className="screen-header">
        <h1 className="t-headline-md">{t("nav.home")}</h1>
      </header>
      {view.status === "loading" && <LoadingState label={t("state.loading.title")} testID="home-loading" />}
      {view.status === "error" && (
        <ErrorState
          title={t("state.error.library.title")}
          message={t("state.error.library.message")}
          actionLabel={t("actions.retry")}
          onAction={() => setNonce((v) => v + 1)}
          testID="home-error"
        />
      )}
      {view.status === "ready" &&
        (view.data.isEmpty ? (
          <EmptyState
            title={t("state.empty.home.title")}
            message={t("state.empty.home.message")}
            actionLabel={t("actions.addRepository")}
            onAction={() => navigate("/sources")}
            testID="home-empty"
          />
        ) : (
          <div className="home-content">
            {view.data.continueReading.length > 0 && (
              <section className="home-section">
                <h2 className="t-title-lg">{t("home.section.continue")}</h2>
                <ul className="home-row" data-testid="home-continue">
                  {view.data.continueReading.map((entry) => (
                    <li key={`${entry.moduleId}:${entry.seriesId}`}>
                      <CoverCard
                        entry={entry}
                        onClick={() =>
                          entry.progress !== null &&
                          navigate(
                            readerPath(entry.moduleId, entry.seriesId, entry.progress.chapterId),
                          )
                        }
                        testID={`home-continue-${entry.seriesId}`}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {view.data.recent.length > 0 && (
              <section className="home-section">
                <h2 className="t-title-lg">{t("home.section.recent")}</h2>
                <ul className="home-row" data-testid="home-recent">
                  {view.data.recent.map((entry) => (
                    <li key={`${entry.moduleId}:${entry.seriesId}`}>
                      <CoverCard
                        entry={entry}
                        onClick={() => navigate(seriesPath(entry.moduleId, entry.seriesId))}
                        testID={`home-recent-${entry.seriesId}`}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        ))}
    </div>
  );
}
