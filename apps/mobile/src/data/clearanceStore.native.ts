import * as SecureStore from "expo-secure-store";
import type { ClearanceStore } from "@ryuunest/core";

import { createSecureClearanceStore } from "./secureClearanceStore";

/** F100 — en el dispositivo, la verificación vive en el almacén seguro (Keystore). */
export function createAppClearanceStore(): ClearanceStore | undefined {
  return createSecureClearanceStore(SecureStore);
}
