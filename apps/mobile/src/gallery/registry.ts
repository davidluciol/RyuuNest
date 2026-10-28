import { FIXTURE_SERIES } from "@ryuunest/test-site";
import {
  radii,
  spacing,
  typography,
  dragonNightColors,
  type ThemeColors,
} from "@ryuunest/ui-tokens";

/**
 * F05 — registro de la galería de componentes (pantalla solo de desarrollo,
 * Regla 3 de `AGENTS.md`): qué secciones hay y qué muestra cada una.
 *
 * F10: los títulos y los nombres de los elementos son **claves de traducción**
 * (RF-40); la galería los resuelve con `t()`. Los valores de API (los 6 estados
 * de la Regla 3, las variantes del botón, los destinos) **no son copy** y siguen
 * siendo identificadores.
 */

/** Tipos de sección de la galería. */
export type GalleryKind = "tokens" | "componentes";

/** Estados que la Regla 3 exige mostrar de cada componente (vocabulario de API). */
export const COMPONENT_STATES = [
  "normal",
  "presionado",
  "foco",
  "deshabilitado",
  "cargando",
  "error",
] as const;

/** Una entrada del registro: una sección de la galería. */
export interface GalleryEntry {
  /** Identificador estable, en minúsculas. */
  readonly id: string;
  /** Clave de traducción del título visible de la sección (F10). */
  readonly title: string;
  readonly kind: GalleryKind;
  /** Claves de traducción de los elementos que muestra la sección (F10). */
  readonly items: readonly string[];
  /** Estados listados (solo secciones de componentes). */
  readonly states?: readonly string[];
}

const colorNames = Object.keys(dragonNightColors) as (keyof ThemeColors)[];
const spacingNames = Object.keys(spacing);
const radiiNames = Object.keys(radii);
const typeNames = Object.keys(typography);

/** Las secciones de la galería, en el orden en que se muestran. */
export const galleryEntries: readonly GalleryEntry[] = Object.freeze([
  {
    id: "colores",
    title: "gallery.section.colors",
    kind: "tokens",
    items: colorNames,
  },
  {
    id: "tipografia",
    title: "gallery.section.typography",
    kind: "tokens",
    items: typeNames,
  },
  {
    id: "espaciado",
    title: "gallery.section.spacing",
    kind: "tokens",
    items: spacingNames,
  },
  {
    id: "radios",
    title: "gallery.section.radii",
    kind: "tokens",
    items: radiiNames,
  },
  {
    id: "layout",
    title: "gallery.section.layout",
    kind: "tokens",
    items: ["gallery.layout.mobile", "gallery.layout.tablet", "gallery.layout.desktop"],
  },
  {
    id: "iconos",
    title: "gallery.section.icons",
    kind: "tokens",
    items: ["gallery.section.iconsSource"],
  },
  {
    id: "portadas",
    title: "gallery.section.covers",
    kind: "tokens",
    items: FIXTURE_SERIES.map((series) => series.id),
  },
  {
    id: "componentes",
    title: "gallery.section.components",
    kind: "componentes",
    items: [
      "gallery.component.button",
      "gallery.component.textField",
      "gallery.component.checkbox",
      "gallery.component.chip",
      "gallery.component.badge",
      "gallery.component.coverCard",
      "gallery.component.chapterRow",
      "gallery.component.header",
      "gallery.component.bottomNav",
      "gallery.component.settingsRow",
      "gallery.component.switch",
      "gallery.component.sheet",
      "gallery.component.emptyState",
      "gallery.component.errorState",
      "gallery.component.loadingState",
      "gallery.component.appShell",
      "gallery.component.destinationFrame",
      "gallery.component.sectionHeader",
      "gallery.component.continueCard",
      "gallery.component.recentCard",
      "gallery.component.folderCard",
      "gallery.component.homeScreen",
      "gallery.component.libraryCard",
      "gallery.component.libraryScreen",
      "gallery.component.modulePicker",
      "gallery.component.discoverScreen",
      "gallery.component.repoCard",
      "gallery.component.moduleRow",
      "gallery.component.holdToConfirm",
      "gallery.component.sheetModal",
      "gallery.component.sourcesScreen",
    ],
    states: COMPONENT_STATES,
  },
]);
