/**
 * Re-export del paquete compartido `@ryuunest/i18n` (P-112): el catálogo
 * (`es.json`) y el cargador viven ahí para que `apps/mobile` y `apps/web`
 * usen las mismas claves. Ningún import de la app cambia.
 */
export * from "@ryuunest/i18n";
