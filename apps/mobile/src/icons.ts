/**
 * Punto de entrada único de iconos (F03, P2-3): **Lucide** en móvil y TV.
 *
 * Reglas que aplica (SPEC §11.11, `DESIGN_RULES.md` V4):
 * - un único conjunto SVG: nada de importar `lucide-react-native` a mano desde
 *   una pantalla, ni emojis ni glifos de texto como iconos;
 * - cero CDN: el paquete vive en `node_modules`, empaquetado en la app (RNF-5).
 *
 * Las pantallas y componentes (F05+) importan los iconos desde `./icons`.
 * El reexport con nombre tipado mantiene la superficie pequeña y auditable.
 */
export type { LucideIcon, LucideProps } from "lucide-react-native";

// Reexport total: Lucide publica componentes por icono (ChevronRight, Plus…).
export * from "lucide-react-native";
