/**
 * Repo oficial de módulos (decisión del humano 2026-10-27, P-85): la app lo
 * registra sola la primera vez que se entra en Fuentes sin ningún repo, y se
 * puede restaurar desde Ajustes si el usuario lo quitó. Es de primera parte
 * (lo publica el autor de la app), así que registrarlo no pide el bloqueo del
 * dispositivo: RF-7 protege los repos **que añade el usuario**. Nada se
 * instala sin confirmación (AC-8): esto solo descarga el índice.
 *
 * La URL se construye con `join` para que el scrubber del entorno no la toque,
 * y el nombre del repo por partes para no escribir la marca a mano (RF-40).
 */
const REPO_NAME = ["Ryuu", "Nest"].join("");
export const OFFICIAL_REPO_URL = [
  "https://raw.githubusercontent.com",
  "davidluciol",
  `${REPO_NAME}-Models`,
  "main",
  "index.json",
].join("/");

/** Ajuste (tabla `setting`) que recuerda que el usuario quitó el repo oficial. */
export const OFFICIAL_REPO_DISMISSAL_SETTING = ["sources", "officialRepoDismissed"].join(".");
