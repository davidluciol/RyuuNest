/**
 * Puerto `Clock` (SPEC §5.3): tiempo inyectable.
 *
 * Lo usan el tiempo límite y la pausa mínima del host (T08) y las marcas
 * `updated_at` de la biblioteca.
 */
export interface Clock {
  /** Milisegundos desde la época (como `Date.now`). */
  now(): number;
}
