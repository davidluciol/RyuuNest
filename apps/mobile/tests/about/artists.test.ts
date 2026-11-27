import { describe, expect, it } from "vitest";

import { ARTISTS, safeLinks, type Artist } from "../../src/about/artists";
import { SOCIAL_NETWORKS, type SocialNetwork } from "../../src/about/socialIcons";
import { t } from "../../src/i18n";

/**
 * Acerca de — datos de los artistas y de sus redes. Los enlaces son la frontera
 * de confianza: solo se abren URLs `https:` (un dato mal escrito no lanza otro
 * esquema). Cada red tiene nombre en el catálogo; las que traen logo de Tabler
 * (MIT) tienen trazos, el resto cae al icono genérico de Lucide.
 */

const sample: Artist = {
  id: "ejemplo",
  name: "Ejemplo",
  bioKey: "about.artists.sample.bio",
  links: [
    { network: "instagram", url: "https://instagram.com/ejemplo" },
    { network: "web", url: "http://ejemplo.org" },
    { network: "telegram", url: "javascript:alert(1)" },
    { network: "x", url: "no es una url" },
    { network: "kofi", url: "https://ko-fi.com/ejemplo" },
  ],
};

describe("safeLinks", () => {
  it("deja solo los enlaces https", () => {
    expect(safeLinks(sample).map((link) => link.network)).toEqual(["instagram", "kofi"]);
  });

  it("sin enlaces devuelve una lista vacía", () => {
    expect(safeLinks({ ...sample, links: [] })).toEqual([]);
  });
});

describe("SOCIAL_NETWORKS", () => {
  const networks = Object.keys(SOCIAL_NETWORKS) as SocialNetwork[];

  it("cada red tiene su nombre en el catálogo", () => {
    for (const network of networks) {
      const key = SOCIAL_NETWORKS[network].labelKey;
      expect(t(key), `${network} sin nombre`).not.toBe(key);
    }
  });

  it("las redes con logo tienen trazos no vacíos; ko-fi, pixiv, artstation y web usan el genérico", () => {
    for (const network of networks) {
      const paths = SOCIAL_NETWORKS[network].paths;
      if (paths !== undefined) expect(paths.every((d) => d.trim().length > 0)).toBe(true);
    }
    for (const network of ["kofi", "pixiv", "artstation", "web"] as const) {
      expect(SOCIAL_NETWORKS[network].paths).toBeUndefined();
    }
    expect(SOCIAL_NETWORKS.instagram.paths?.length).toBeGreaterThan(0);
  });

  it("la etiqueta accesible nombra la red y al artista", () => {
    const label = t("about.social.openA11y", { network: t("about.social.instagram"), name: "Ejemplo" });
    expect(label).toContain("Instagram");
    expect(label).toContain("Ejemplo");
  });
});

describe("ARTISTS", () => {
  it("ids únicos y texto de agradecimiento en el catálogo", () => {
    expect(new Set(ARTISTS.map((artist) => artist.id)).size).toBe(ARTISTS.length);
    for (const artist of ARTISTS) expect(t(artist.bioKey)).not.toBe(artist.bioKey);
  });
});
