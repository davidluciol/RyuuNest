/**
 * Título buscable: minúsculas y sin acentos (SPEC §8.1), con los espacios comprimidos
 * para que «una   serie» y «Una Serie» coincidan.
 */
export function normalizeTitle(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/\p{Mn}+/gu, "")
    .toLowerCase()
    .replace(/\s+/gu, " ")
    .trim();
}
