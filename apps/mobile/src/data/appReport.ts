import { Linking, Platform } from "react-native";
import { ModuleRegistry, SqliteStorage, formatLogEntries } from "@ryuunest/core";

import { APP_VERSION } from "../about/appInfo";
import { createReportController } from "../report/reportController";
import { openAppDatabase } from "./appDatabase";
import { copyText } from "./clipboard";
import { resolveErrorLog } from "./errorLog";

/** Entradas del registro que se pueden adjuntar (las más recientes). */
const REPORT_LOG_ENTRIES = 20;

/**
 * F103 — el controlador de «Mandar reporte» de la app (P-198), con el registro
 * real (F31) y `Linking` para abrir GitHub o la app de correo. Lo abre cualquier
 * aviso de error con `appReport.open(...)`; `ReportHost` pinta la hoja.
 */
export const appReport = createReportController({
  appVersion: APP_VERSION,
  platform: `${Platform.OS} ${String(Platform.Version)}`,
  now: () => new Date().toISOString(),
  async loadLog() {
    const log = await resolveErrorLog();
    if (log === null) return [];
    // El registro lista lo más nuevo primero; el reporte va de lo viejo a lo nuevo.
    const entries = (await log.list({ limit: REPORT_LOG_ENTRIES })).reverse();
    return formatLogEntries(entries, "text").split("\n").filter(Boolean);
  },
  openUrl: (url) => Linking.openURL(url).then(() => undefined),
  copyText,
  // La versión del módulo instalado, para los errores que no la conocen (lector, página).
  async moduleVersion(moduleId) {
    const driver = await openAppDatabase();
    if (driver === null) return undefined;
    return (await new ModuleRegistry({ storage: new SqliteStorage(driver) }).get(moduleId))
      ?.version;
  },
});
