import { ext } from "../browser";
import { APP_ORIGINS } from "../config";
import { startBridge, type BridgeWindow } from "./bridge";

/** F26 — content script: solo conecta la ventana de la app con el fondo (ver `bridge.ts`). */
startBridge({
  window: window as unknown as BridgeWindow,
  runtime: { sendMessage: (message) => ext.runtime.sendMessage(message) },
  appOrigins: APP_ORIGINS,
});
