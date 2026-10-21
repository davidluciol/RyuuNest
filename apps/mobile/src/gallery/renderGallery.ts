import { FIXTURE_SERIES } from "@ryuunest/test-site";
import { dragonNightColors, radii, spacing, typography } from "@ryuunest/ui-tokens";

import { t } from "../i18n";
import { COMPONENT_STATES, galleryEntries } from "./registry";

/**
 * F05 — harness de la galería para pruebas sin Metro: serializa la estructura
 * de `GalleryScreen` a texto plano (secciones, títulos, valores). Así la
 * estructura queda fijada por tests sin levantar la app; la comprobación
 * visual real la hace Playwright contra la galería servida (F28).
 *
 * F10: las claves del registro se resuelven con `t()`, igual que la pantalla.
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

/** Claves del registro resueltas a texto, con su separador. */
function translatedKeys(keys: readonly string[], indent = "  "): string {
  return keys.map((key) => `${indent}${t(key)}`).join("\n");
}

const blocks: Record<string, () => string> = {
  colores: colorsBlock,
  tipografia: typographyBlock,
  espaciado: spacingBlock,
  radios: radiiBlock,
  layout: () =>
    translatedKeys(galleryEntries.find((entry) => entry.id === "layout")?.items ?? []),
  iconos: () =>
    translatedKeys(galleryEntries.find((entry) => entry.id === "iconos")?.items ?? []),
  portadas: coversBlock,
  componentes: () => {
    const entry = galleryEntries.find((item) => item.id === "componentes");
    const names = entry?.items ?? [];
    return `${t("gallery.states", { list: COMPONENT_STATES.join(" · ") })}\n${translatedKeys(names)}`;
  },
};

/** La galería entera serializada a texto, sección a sección. */
export function renderGalleryScreen(): string {
  return galleryEntries
    .map((entry) => `${t(entry.title)}\n${blocks[entry.id]?.() ?? ""}`)
    .join("\n\n");
}

/** Alias para depuración. */
export function galleryScreenSource(): string {
  return renderGalleryScreen();
}
