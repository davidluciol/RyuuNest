import type { LogEntry, LogLevel } from "@ryuunest/core";

import { t } from "../../../i18n";

/**
 * F30 — presentación pura del registro de diagnóstico. Sin React ni tokens:
 * devuelve textos (ya traducidos) y tonos semánticos; la pantalla los pinta.
 */

export type EventTone = "error" | "warning" | "neutral";

export interface EventLevel {
  label: string;
  tone: EventTone;
}

/** Nivel del evento: texto + tono (el color nunca es la única señal). */
export function eventLevel(level: LogLevel): EventLevel {
  switch (level) {
    case "error":
      return { label: t("diagnostics.level.error"), tone: "error" };
    case "warn":
      return { label: t("diagnostics.level.warn"), tone: "warning" };
    case "info":
      return { label: t("diagnostics.level.info"), tone: "neutral" };
  }
}

const DAY_MS = 86_400_000;

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function clock(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** «Hoy · 14:32», «Ayer · 21:05» o «Hace N días · 09:48» (días de calendario). */
export function eventWhen(at: number, now: number): string {
  const time = clock(at);
  const days = Math.round((startOfDay(now) - startOfDay(at)) / DAY_MS);
  if (days <= 0) return t("diagnostics.when.today", { time });
  if (days === 1) return t("diagnostics.when.yesterday", { time });
  return t("diagnostics.when.daysAgo", { days, time });
}

export interface DetailLine {
  label: string;
  value: string;
}

/** Líneas del detalle desplegable: el contexto saneado y la versión/plataforma. */
export function eventDetailLines(entry: LogEntry): DetailLine[] {
  const lines: DetailLine[] = Object.entries(entry.context ?? {}).map(([label, value]) => ({
    label,
    value: typeof value === "string" ? value : JSON.stringify(value),
  }));
  lines.push({
    label: t("diagnostics.detail.version"),
    value: `${entry.appVersion} · ${entry.platform}`,
  });
  return lines;
}

/** Texto de la confirmación de borrado, con singular y plural. */
export function confirmClearMessage(count: number): string {
  return count === 1
    ? t("diagnostics.confirm.messageOne")
    : t("diagnostics.confirm.messageMany", { count });
}
