/**
 * Puerto `SecureLock` (SPEC §5.3): autenticación del dispositivo.
 *
 * Es **opcional**: en web no existe, y en un dispositivo sin bloqueo configurado
 * no está disponible (RF-7). Quien lo use debe comprobar `isAvailable()` antes de
 * pedir `authenticate()`.
 */
export interface SecureLock {
  /** ¿Hay bloqueo disponible en este dispositivo? */
  isAvailable(): Promise<boolean>;
  /** Pide al usuario autenticarse. Devuelve si lo consiguió. */
  authenticate(reason: string): Promise<boolean>;
}
