/**
 * Vitest no empaqueta assets como Metro: los binarios (`require` de fuentes,
 * imágenes) se reemplazan por un id numérico, lo que `require` devuelve en
 * Metro. Los alias de `vitest.config.ts` apuntan aquí cada `.ttf`.
 */
export default 0;
