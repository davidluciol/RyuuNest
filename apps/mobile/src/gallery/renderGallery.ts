import { FIXTURE_SERIES } from "@ryuunest/test-site";
import { dragonNightColors, radii, spacing, typography } from "@ryuunest/ui-tokens";

import { COMPONENT_STATES, galleryEntries } from "./registry";

/**
 * F05 — harness de la galería para pruebas sin Metro: serializa la estructura
 * de `GalleryScreen` a texto plano (secciones, títulos, valores). Así la
 * estructura queda fijada por tests sin levantar la app; la comprobación
 * visual real la hace Playwright contra la galería servida (F28).
 */

function colorsBlock(): string {
  return Object.entries(dragonNightColors)
    .map(([name, value]) => `  ${name}: ${value}`)
    .join("\n");
}

function typographyBlock(): string {
  return Object.entries(typography)
    .map(([name, style]) => `  ${name}: ${style.fontFamily} ${style.fontSize}/${style.lineHeight}`)
    .join("\n");
}

function spacingBlock(): string {
  return Object.entries(spacing)
    .map(([name, value]) => `  ${name}: ${value}`)
    .join("\n");
}

function radiiBlock(): string {
  return Object.entries(radii)
    .map(([name, value]) => `  ${name}: ${value}`)
    .join("\n");
}

function coversBlock(): string {
  return FIXTURE_SERIES.map((series) => `  ${series.id}: ${series.title}`).join("\n");
}

const blocks: Record<string, () => string> = {
  colores: colorsBlock,
  tipografia: typographyBlock,
  espaciado: spacingBlock,
  radios: radiiBlock,
  layout: () => "  móvil < 600 · tablet 600–1024 · escritorio > 1024",
  iconos: () => "  Lucide vía src/icons.ts",
  portadas: coversBlock,
  componentes: () =>
    `  Estados: ${COMPONENT_STATES.join(" · ")}\n  (sin componentes registrados todavía)`,
};

/** La galería entera serializada a texto, sección a sección. */
export function renderGalleryScreen(): string {
  return galleryEntries
    .map((entry) => `${entry.title}\n${blocks[entry.id]?.() ?? ""}`)
    .join("\n\n");
}

/** Alias para depuración. */
export function galleryScreenSource(): string {
  return renderGalleryScreen();
}
