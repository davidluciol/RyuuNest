/**
 * Declaraciones que tsc no emite y Metro sí resuelve: los assets importados desde
 * TypeScript (el equivalente a `expo-env.d.ts`, pero mínimo y a mano).
 */
declare module "*.png" {
  const source: number;
  export default source;
}
