/**
 * F103 — «Mandar reporte» (P-198). El usuario revisa el texto y lo envía a mano
 * por GitHub (atención prioritaria) o por correo, así que nada sale solo del
 * dispositivo (RNF-5). Aquí la parte pura: limpieza, huella para agrupar
 * duplicados y los enlaces de cada canal con su tope de largo.
 */
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";

import { MAX_MESSAGE_LENGTH, sanitizeText } from "./sanitize.js";

/** Tope del texto libre del usuario: el mismo que `sanitizeText` aplica a todo. */
export const REPORT_DETAILS_MAX = MAX_MESSAGE_LENGTH;
/** GitHub corta las URL de `issues/new` alrededor de 8 KB. */
export const GITHUB_URL_MAX = 8_000;
/** Algunas apps de correo no abren un `mailto:` mucho más largo. */
export const MAILTO_URL_MAX = 2_000;

export interface ErrorReportInput {
  /** `ModuleErrorCode` o código propio de la app. */
  code: string;
  message: string;
  stack?: string | undefined;
  moduleId?: string | undefined;
  moduleVersion?: string | undefined;
  appVersion: string;
  /** Plataforma y versión del SO, p. ej. «Android 14». */
  platform: string;
  /** Fecha ISO del error. */
  date: string;
  /** Texto libre del usuario (público). */
  details?: string | undefined;
  /** Últimas entradas del registro de diagnóstico, de la más vieja a la más nueva. */
  log?: readonly string[] | undefined;
}

export interface ErrorReport {
  fingerprint: string;
  title: string;
  /** Cuerpo completo, ya limpio. */
  body: string;
  /** Cuerpo sin el registro y el registro limpio, para recortar si no cabe. */
  head: string;
  log: readonly string[];
}

const URL_PATTERN = /https?:\/\/\S+/gi;
// shortcut: dominios sueltos solo con TLD frecuentes (evita tachar «module.js»); ampliar si se cuela otro
const DOMAIN_PATTERN =
  /\b(?:[a-z0-9-]+\.)+(?:com|net|org|io|in|la|to|me|co|cc|xyz|info|site|online|app|dev|fun|club|top|es|mx)\b/gi;
const PATH_PATTERN = /(?:\/[\w.-]+){2,}|\b[a-z]:\\\S*/gi;
const HASH_PATTERN = /\b[0-9a-f]{7,}\b/gi;

/** Limpieza para el texto que sale del dispositivo: `sanitizeText` + dominios. */
function clean(text: string): string {
  return sanitizeText(text).replace(DOMAIN_PATTERN, "[dominio]");
}

/**
 * Deja solo la «forma» del mensaje para que el mismo error dé la misma huella:
 * sin números, URLs, hashes, rutas ni lo que vaya entre comillas.
 */
export function normalizeForFingerprint(text: string): string {
  return text
    .toLowerCase()
    .replace(URL_PATTERN, " ")
    .replace(PATH_PATTERN, " ")
    .replace(/(["'`«“]).*?(["'`»”])/g, " ")
    .replace(HASH_PATTERN, " ")
    .replace(/\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function majorMinor(version: string | undefined): string {
  return version?.split(".").slice(0, 2).join(".") ?? "";
}

/** Los 3 primeros marcos de la pila (líneas «at …»), sin línea ni columna. */
function topFrames(stack: string | undefined): string[] {
  return (stack ?? "")
    .split("\n")
    .filter((line) => line.trim().startsWith("at "))
    .slice(0, 3)
    .map(normalizeForFingerprint);
}

/** `sha256(código | módulo | mayor.menor | mensaje | 3 marcos)`, 12 hex. */
export function reportFingerprint(input: ErrorReportInput): string {
  const key = [
    input.code,
    input.moduleId ?? "",
    majorMinor(input.moduleVersion),
    normalizeForFingerprint(input.message),
    ...topFrames(input.stack),
  ].join("|");
  return bytesToHex(sha256(utf8ToBytes(key))).slice(0, 12);
}

function composeBody(head: string, log: readonly string[]): string {
  return log.length === 0 ? head : `${head}\n\nRegistro (últimas entradas):\n${log.join("\n")}`;
}

export function buildErrorReport(input: ErrorReportInput): ErrorReport {
  const fingerprint = reportFingerprint(input);
  const module =
    input.moduleId === undefined
      ? undefined
      : `${input.moduleId} ${input.moduleVersion ?? ""}`.trim();
  const title =
    input.moduleId === undefined
      ? `[fp:${fingerprint}] ${input.code}`
      : `[fp:${fingerprint}] ${input.code} en ${input.moduleId} ${majorMinor(input.moduleVersion)}`.trim();
  const details = clean(input.details ?? "");
  const head = [
    `Huella: fp:${fingerprint}`,
    `Código: ${input.code}`,
    `Mensaje: ${clean(input.message)}`,
    ...(module === undefined ? [] : [`Módulo: ${module}`]),
    `App: ${input.appVersion}`,
    `Plataforma: ${input.platform}`,
    `Fecha: ${input.date}`,
    ...(details === "" ? [] : ["", `Detalles: ${details}`]),
  ].join("\n");
  const log = (input.log ?? []).map(clean);
  return { fingerprint, title, head, log, body: composeBody(head, log) };
}

/**
 * Arma la URL con el cuerpo más completo que quepa en `max`: primero quita
 * entradas viejas del registro y, si aún no cabe, recorta el final del cuerpo.
 */
function fitUrl(build: (body: string) => string, report: ErrorReport, max: number): string {
  for (let skip = 0; skip <= report.log.length; skip++) {
    const url = build(composeBody(report.head, report.log.slice(skip)));
    if (url.length <= max) return url;
  }
  let head = report.head;
  let url = build(head);
  while (url.length > max && head.length > 0) {
    head = head.slice(0, Math.floor(head.length * 0.9));
    url = build(head);
  }
  return url;
}

/** «Enviar por GitHub»: `issues/new` del repo con título y cuerpo (requiere cuenta). */
export function githubIssueUrl(repoUrl: string, report: ErrorReport): string {
  return fitUrl(
    (body) =>
      `${repoUrl}/issues/new?title=${encodeURIComponent(report.title)}&body=${encodeURIComponent(body)}`,
    report,
    GITHUB_URL_MAX,
  );
}

/** «Enviar por correo»: `mailto:` con asunto y cuerpo (espacios como `%20`). */
export function mailtoUrl(email: string, report: ErrorReport): string {
  return fitUrl(
    (body) =>
      `mailto:${email}?subject=${encodeURIComponent(report.title)}&body=${encodeURIComponent(body)}`,
    report,
    MAILTO_URL_MAX,
  );
}
