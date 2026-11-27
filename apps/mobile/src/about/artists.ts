import type { SocialNetwork } from "./socialIcons";

/**
 * Acerca de — artistas que hacen el arte de RyuuNest (SPEC §12). La sección
 * «Artistas» muestra una tarjeta por entrada y se oculta si la lista está vacía.
 *
 * Alta de un artista (FA3): foto local en `assets/artists/<id>.webp`, importada
 * con `import` (nunca una URL remota, RNF-5), entrada aquí, texto en `es.json` (`about.artists.<id>.bio`) y
 * registro de la foto en `ASSETS.md`.
 */

export interface ArtistLink {
  readonly network: SocialNetwork;
  readonly url: string;
}

export interface Artist {
  readonly id: string;
  /** Nombre artístico: nombre propio, no pasa por el catálogo. */
  readonly name: string;
  /**
   * Foto empaquetada con `import foto from "…/assets/artists/<id>.webp"`: Metro
   * da un número y Vite una URL local. Sin ella se muestra el dragón marcador.
   */
  readonly image?: number | string;
  /** Clave del agradecimiento en el catálogo. */
  readonly bioKey: string;
  readonly links: readonly ArtistLink[];
}

export const ARTISTS: readonly Artist[] = [];

/** Solo enlaces `https:`: un dato mal escrito no abre otro esquema. */
export function safeLinks(artist: Artist): ArtistLink[] {
  return artist.links.filter((link) => {
    try {
      return new URL(link.url).protocol === "https:";
    } catch {
      return false;
    }
  });
}
