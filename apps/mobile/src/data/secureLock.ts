import { NoopSecureLock, type SecureLock } from "@ryuunest/core";

/** F16 (RF-7) — en web no hay bloqueo del dispositivo (SPEC §5.3): nunca disponible. */
export function createAppSecureLock(): SecureLock {
  return new NoopSecureLock();
}
