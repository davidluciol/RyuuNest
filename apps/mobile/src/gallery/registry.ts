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
 * Regla 3 de `AGENTS.md`): qué secciones hay y qué muestra cada una. Los
 * componentes reutilizables se registran aquí a medida que existan (F06+);
 * de momento la galería expone los tokens aplicados y los datos de ejemplo
 * únicos (D1–D5, vía `@ryuunest/test-site`).
 */

/** Tipos de sección de la galería. */
export type GalleryKind = "tokens" | "componentes";

/** Estados que la Regla 3 exige mostrar de cada componente. */
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
  /** Título visible de la sección. */
  readonly title: string;
  readonly kind: GalleryKind;
  /** Nombres de los elementos que muestra la sección. */
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
    title: "Colores",
    kind: "tokens",
    items: colorNames,
  },
  {
    id: "tipografia",
    title: "Tipografía",
    kind: "tokens",
    items: typeNames,
  },
  {
    id: "espaciado",
    title: "Espaciado",
    kind: "tokens",
    items: spacingNames,
  },
  {
    id: "radios",
    title: "Radios",
    kind: "tokens",
    items: radiiNames,
  },
  {
    id: "layout",
    title: "Layout por ancho",
    kind: "tokens",
    items: ["móvil < 600", "tablet 600–1024", "escritorio > 1024"],
  },
  {
    id: "iconos",
    title: "Iconos",
    kind: "tokens",
    items: ["Lucide vía src/icons.ts"],
  },
  {
    id: "portadas",
    title: "Portadas de ejemplo",
    kind: "tokens",
    items: FIXTURE_SERIES.map((series) => series.id),
  },
  {
    id: "componentes",
    title: "Componentes",
    kind: "componentes",
    items: ["botón", "campo de texto", "casilla y radio", "chip de filtro", "insignia"],
    states: COMPONENT_STATES,
  },
]);
