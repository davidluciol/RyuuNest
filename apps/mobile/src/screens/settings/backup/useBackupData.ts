import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { router } from "expo-router";

import { openAppDatabase } from "../../../data/appDatabase";
import { createBackupFiles } from "../../../data/backupFiles";
import { createFetchHttp } from "../../../data/fetchHttp";
import { createBackupService, type BackupService } from "./backupData";
import { createSampleBackupService } from "./sampleBackupService";
import { createBackupController, type BackupController } from "./backupController";
import {
  INITIAL_BACKUP_FLOW,
  backupFlowReducer,
  type BackupFlow,
} from "./backupFlow";

/**
 * F21 — estado del respaldo en Ajustes (RF-37/RF-38). En el dispositivo, el
 * núcleo real sobre SQLite con los archivos nativos (hoja del sistema y
 * selector); en web y la galería, el servicio de ejemplo sobre la descarga y
 * el `input type="file"` (P-79). La pantalla no pregunta la plataforma.
 *
 * `createBackupFiles` lo elige Metro por plataforma (`backupFiles.ts` en web,
 * `backupFiles.native.ts` en el dispositivo): aquí no se pregunta la plataforma
 * ni se importa la variante nativa a mano. Vitest resuelve la de web y no
 * parsea `expo-file-system`/`expo-sharing`.
 */

let resolvedBackupService: Promise<BackupService> | undefined;

function createAppBackupService(
  driver: Awaited<ReturnType<typeof openAppDatabase>> & object,
): BackupService {
  return createBackupService({
    driver,
    http: createFetchHttp(),
    clock: { now: () => Date.now() },
    files: createBackupFiles(),
  });
}

export function resolveBackupService(): Promise<BackupService> {
  resolvedBackupService ??= openAppDatabase().then((driver) => {
    if (driver === null) {
      // Web (galería, e2e, cliente futuro): servicio de ejemplo con la
      // descarga real; en Vitest no se llama (las pruebas montan el servicio
      // de ejemplo con el puerto inerte a mano).
      return createSampleBackupService(createBackupFiles());
    }
    return createAppBackupService(driver);
  });
  return resolvedBackupService;
}

export interface BackupState {
  flow: BackupFlow;
  /** `null` mientras carga el servicio. */
  controller: BackupController | null;
  /** Aviso transitorio (éxito o fallo fuera de una hoja). */
  notice: string | null;
}

export function useBackupData(): BackupState {
  const [service, setService] = useState<BackupService | null>(null);
  const [flow, dispatch] = useReducer(backupFlowReducer, INITIAL_BACKUP_FLOW);
  const [notice, setNotice] = useState<string | null>(null);
  const flowRef = useRef(flow);
  flowRef.current = flow;

  useEffect(() => {
    let cancelled = false;
    resolveBackupService().then((resolved) => {
      if (!cancelled) setService(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const controller = useMemo(() => {
    if (service === null) return null;
    return createBackupController({
      service,
      getFlow: () => flowRef.current,
      dispatch,
      notify: setNotice,
      goToSources: () => router.navigate("/sources"),
    });
  }, [service]);

  return { flow, controller, notice };
}
