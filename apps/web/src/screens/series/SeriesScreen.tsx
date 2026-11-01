import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { t } from "@ryuunest/i18n";
import type { Chapter } from "@ryuunest/core";

import Button from "../../components/Button";
import Chip from "../../components/Chip";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import TextField from "../../components/TextField";
import { Heart, HeartOff } from "../../icons";
import { readerPath } from "../../routes";
import { useServices } from "../../services/ServicesContext";
import "./series.css";
import { chapterStateOf, loadSeries, setPreferredRelease, toggleFavorite, type WebSeriesData } from "./seriesData";

/**
 * F25 — ficha de serie web (`/series/:moduleId/:seriesId`): datos reales del
 * módulo (worker) + progreso/leídos/favorito persistidos en la base web.
 * Abrir un capítulo navega al lector. Estados: carga, error con volver, datos.
 */
export default function SeriesScreen() {
  const { moduleId = "", seriesId = "" } = useParams();
  const services = useServices();
  const navigate = useNavigate();
  const [view, setView] = useState<
    { status: "loading" } | { status: "error" } | { status: "ready"; data: WebSeriesData }
  >({ status: "loading" });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setView({ status: "loading" });
    loadSeries(services, moduleId, seriesId)
      .then((data) => {
        if (!cancelled) setView({ status: "ready", data });
      })
      .catch(() => {
        if (!cancelled) setView({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [services, moduleId, seriesId, nonce]);

  const retry = () => {
    setView({ status: "loading" });
    setNonce((value) => value + 1);
  };

  return (
    <div className="screen series-screen" data-testid="screen-series">
      {view.status === "loading" && <LoadingState label={t("state.loading.title")} testID="series-loading" />}
      {view.status === "error" && (
        <ErrorState
          title={t("state.error.module.title")}
          message={t("state.error.module.message")}
          actionLabel={t("actions.back")}
          onAction={() => navigate(-1)}
          testID="series-error"
        />
      )}
      {view.status === "ready" && (
        <SeriesReady
          data={view.data}
          onOpenChapter={(chapterId, releaseId) => navigate(readerPath(moduleId, seriesId, chapterId, releaseId))}
          onToggleFavorite={async () => {
            await toggleFavorite(services, moduleId, seriesId);
            retry();
          }}
          onSelectRelease={async (releaseId) => {
            await setPreferredRelease(services, moduleId, seriesId, releaseId);
            retry();
          }}
        />
      )}
    </div>
  );
}

function SeriesReady({
  data,
  onOpenChapter,
  onToggleFavorite,
  onSelectRelease,
}: {
  data: WebSeriesData;
  onOpenChapter: (chapterId: string, releaseId: string | undefined) => void;
  onToggleFavorite: () => void;
  onSelectRelease: (releaseId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [ascending, setAscending] = useState(true);
  const details = data.details;
  // Las ediciones (releases) cuelgan de cada capítulo; el selector usa las del primero.
  const releases = useMemo(() => details.chapters[0]?.releases ?? [], [details]);
  const preferred = releases.find((release) => release.id === data.preferredReleaseId) ?? releases[0];

  const chapters = useMemo(() => {
    const list = [...(details.chapters ?? [])];
    const filtered = query.trim() === "" ? list : list.filter((c) => `${c.title} ${c.number}`.toLowerCase().includes(query.trim().toLowerCase()));
    return ascending ? filtered : filtered.reverse();
  }, [details.chapters, query, ascending]);

  return (
    <div className="series-content">
      <header className="series-header">
        {details.cover !== undefined && (
          <img className="series-cover" src={details.cover.url} alt="" />
        )}
        <div className="series-header-main">
          <h1 className="t-headline-md">{details.title}</h1>
          <p className="t-body-sm series-meta">
            {data.moduleName} · {t(`series.status.${details.status}`)}
          </p>
          {details.genres.length > 0 && <p className="t-body-sm series-meta">{details.genres.join(" · ")}</p>}
          <Button
            variant="secondary"
            label={t(data.favorite ? "series.favorited" : "series.favorite")}
            icon={data.favorite ? <Heart size={16} aria-hidden /> : <HeartOff size={16} aria-hidden />}
            onClick={onToggleFavorite}
            testID="series-favorite"
          />
        </div>
      </header>

      {details.description !== undefined && details.description !== "" && (
        <p className="t-body-md series-description">{details.description}</p>
      )}

      {releases.length > 1 && (
        <div className="series-releases">
          {releases.map((release) => (
            <Chip
              key={release.id}
              label={release.group ?? release.id}
              active={preferred?.id === release.id}
              onClick={() => onSelectRelease(release.id)}
              testID={`series-release-${release.id}`}
            />
          ))}
        </div>
      )}

      <section className="series-chapters">
        <div className="series-chapters-toolbar">
          <h2 className="t-title-lg">{t("series.chapters")}</h2>
          <TextField label={t("series.search")} value={query} onChange={setQuery} testID="series-search" />
          <Button
            variant="secondary"
            label={t("series.sort")}
            onClick={() => setAscending((value) => !value)}
            testID="series-sort"
          />
        </div>
        <ul className="series-chapter-list">
          {chapters.map((chapter: Chapter) => {
            const state = chapterStateOf(chapter.id, data);
            return (
              <li key={chapter.id}>
                <button
                  type="button"
                  className="series-chapter-row"
                  onClick={() => onOpenChapter(chapter.id, preferred?.id)}
                  data-testid={`series-chapter-${chapter.id}`}
                >
                  <span className="t-body-md">{t("series.chapter", { number: chapter.number ?? 0 })}</span>
                  <span className={`t-label-sm series-state series-state-${state}`}>
                    {t(`series.state.${state === "in-progress" ? "inProgress" : state}`)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
