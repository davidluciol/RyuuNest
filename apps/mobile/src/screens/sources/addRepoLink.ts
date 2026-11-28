/**
 * G5 — enlace `ryuunest://add-repo?url=…` (SPEC §7.2). La URL solo rellena la hoja
 * «Añadir repositorio»; la valida `validateRepoUrl` cuando el usuario confirma.
 */

/** Parámetro con el que la ruta del enlace pasa la URL a Portales. */
export const ADD_REPO_PARAM = "addRepo";

/** Tope de longitud: una URL más larga no es un repositorio razonable. */
const MAX_LINK_URL_LENGTH = 2048;

/** URL del parámetro del enlace (Expo Router puede dar una lista), o `null` si no sirve. */
export function addRepoLinkUrl(value: unknown): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return null;
  const url = raw.trim();
  return url === "" || url.length > MAX_LINK_URL_LENGTH ? null : url;
}
