import * as LocalAuthentication from "expo-local-authentication";
import type { SecureLock } from "@ryuunest/core";

import { createDeviceSecureLock } from "./deviceSecureLock";

/** F16 (RF-7) — en el dispositivo, el bloqueo real (PIN, patrón o biometría). */
export function createAppSecureLock(): SecureLock {
  return createDeviceSecureLock(LocalAuthentication);
}
