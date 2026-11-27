import { useNavigate } from "react-router";

import { t } from "@ryuunest/i18n";
import { APP_LINKS, APP_VERSION, THIRD_PARTY_CREDITS } from "@ryuunest/mobile-src/about/appInfo";
import { ARTISTS, safeLinks, type Artist } from "@ryuunest/mobile-src/about/artists";
import { SOCIAL_NETWORKS } from "@ryuunest/mobile-src/about/socialIcons";
import { defaultTheme, markers } from "@ryuunest/ui-tokens";

import DragonMarker from "../../components/DragonMarker";
import SocialIcon from "../../components/SocialIcon";
import { ChevronLeft, ExternalLink } from "../../icons";
import "../diagnostics/diagnostics.css";
import "../settings/settings.css";
import "./about.css";

/**
 * Acerca de (AB3) — la misma pantalla que en móvil (`/about`, fuera del marco,
 * volver lleva a Ajustes), con los datos compartidos de `about/*`. Los enlaces
 * son `<a>` que abren otra pestaña; la página no pide nada a terceros (RNF-5).
 */

const ICON = 20;

function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <article className="about-artist" data-testid={`about-artist-${artist.id}`}>
      <div className="about-artist-photo">
        {typeof artist.image === "string" ? (
          <img src={artist.image} alt="" />
        ) : (
          <DragonMarker size={markers.md} color={defaultTheme.colors.textSecondary} />
        )}
      </div>
      <h3 className="t-title-lg">{artist.name}</h3>
      <p className="t-body-md settings-hint">{t(artist.bioKey)}</p>
      <div className="about-artist-links">
        {safeLinks(artist).map((link) => {
          const network = t(SOCIAL_NETWORKS[link.network].labelKey);
          return (
            <a
              key={link.url}
              className="about-artist-link t-label-lg"
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("about.social.openA11y", { network, name: artist.name })}
            >
              <SocialIcon network={link.network} size={ICON} />
              {network}
            </a>
          );
        })}
      </div>
    </article>
  );
}

export default function AboutScreen({ artists = ARTISTS }: { artists?: readonly Artist[] }) {
  const navigate = useNavigate();

  return (
    <div className="screen diag-screen" data-testid="screen-about">
      <header className="diag-header">
        <button
          type="button"
          className="diag-back"
          onClick={() => navigate("/settings")}
          aria-label={t("actions.back")}
          data-testid="about-back"
        >
          <ChevronLeft size={24} aria-hidden />
        </button>
        <h1 className="t-headline-sm">{t("about.title")}</h1>
      </header>

      <div className="about-content">
        <section className="about-app">
          <DragonMarker size={markers.md} color={defaultTheme.colors.accent} />
          <p className="t-title-lg settings-row-label" data-testid="about-version">
            {t("about.version", { version: APP_VERSION })}
          </p>
          <p className="t-body-md settings-hint">{t("about.license")}</p>
          <p className="t-body-md settings-hint">{t("about.privacy")}</p>
        </section>

        <section className="settings-card">
          {APP_LINKS.map((link) => (
            <a key={link.id} className="settings-nav-row" href={link.url} target="_blank" rel="noopener noreferrer">
              <span className="t-body-md settings-row-label">{t(link.labelKey)}</span>
              <ExternalLink size={ICON} aria-hidden />
            </a>
          ))}
        </section>

        {artists.length > 0 && (
          <section className="about-section" aria-label={t("about.artists.title")} data-testid="about-artists">
            <h2 className="t-title-lg settings-row-label">{t("about.artists.title")}</h2>
            <p className="t-body-md settings-hint">{t("about.artists.intro")}</p>
            {artists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </section>
        )}

        <section className="settings-card" aria-label={t("about.credits.title")}>
          <h2 className="t-title-lg">{t("about.credits.title")}</h2>
          {THIRD_PARTY_CREDITS.map((credit) => (
            <p key={credit.name} className="t-body-md settings-row-label">
              {t("about.credits.item", { ...credit })}
            </p>
          ))}
        </section>
      </div>
    </div>
  );
}
