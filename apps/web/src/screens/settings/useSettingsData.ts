import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { ReaderMode } from "@ryuunest/core";

import { createBackupService, type BackupService } from "@ryuunest/mobile-src/screens/settings/backup/backupData";
import { createBackupController, type BackupController } from "@ryuunest/mobile-src/screens/settings/backup/backupController";
import {
  INITIAL_BACKUP_FLOW,
  backupFlowReducer,
  type BackupFlow,
} from "@ryuunest/mobile-src/screens/settings/backup/backupFlow";
import {
  createSettingsService,
  type SettingsData,
  type SettingsService,
} from "@ryuunest/mobile-src/screens/settings/settingsData";

import { createWebBackupFiles } from "../../data/webBackupFiles";
import { useServices } from "../../services/ServicesContext";

/**
 * F25 — estado de Ajustes web: servicio de ajustes y de respaldo sobre la base
 * real (sql.js + IndexedDB), con la máquina de hojas de respaldo de móvil
 * (reutilizada vía `@ryuunest/mobile-src`, P-115). La caché de imágenes en web
 * es la del navegador (`CacheStorage`).
 */
export interface SettingsState {
  view: { status: "loading" } | { status: "error" } | { status: "ready"; data: SettingsData };
  flow: BackupFlow;
  notice: string | null;
  controller: BackupController | null;
  /** Una operación en curso bloquea los controles. */
  busy: boolean;
  setProtection: (on: boolean) => void;
  setNsfw: (on: boolean) => void;
  setMode: (mode: ReaderMode) => void;
  clearCache: () => void;
  restoreOfficial: () => void;
  dismissNotice: () => void;
  retry: () => void;
  reload: () => Promise<void>;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function useSettingsData(goToSources: () => void): SettingsState {
  const services = useServices();
  const [service] = useState<SettingsService>(() =>
    createSettingsService({
      driver: services.driver,
      http: services.http,
      clock: services.clock,
      secureLock: services.secureLock,
      clearImageCache: async () => {
        for (const name of await caches.keys()) await caches.delete(name);
      },
    }),
  );
  const [backupService] = useState<BackupService>(() =>
    createBackupService({
      driver: services.driver,
      http: services.http,
      clock: services.clock,
      files: createWebBackupFiles(),
    }),
  );

  const [view, setView] = useState<SettingsState["view"]>({ status: "loading" });
  const [nonce, setNonce] = useState(0);
  const [flow, dispatch] = useReducer(backupFlowReducer, INITIAL_BACKUP_FLOW);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const flowRef = useRef(flow);
  flowRef.current = flow;

  const reload = useCallback(async () => {
    const data = await service.load();
    setView({ status: "ready", data });
  }, [service]);

  useEffect(() => {
    let cancelled = false;
    setView({ status: "loading" });
    service
      .load()
      .then((data) => {
        if (!cancelled) setView({ status: "ready", data });
      })
      .catch(() => {
        if (!cancelled) setView({ status: "error" });
      });
    const unsubscribe = service.subscribe(() => {
      void service.load().then((data) => setView({ status: "ready", data }));
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [service, nonce]);

  const run = useCallback(
    async (work: () => Promise<void>) => {
      setBusy(true);
      try {
        await work();
        await reload();
      } catch (error) {
        setNotice(messageOf(error));
      } finally {
        setBusy(false);
      }
    },
    [reload],
  );

  const controller = useMemo(
    () =>
      createBackupController({
        service: backupService,
        getFlow: () => flowRef.current,
        dispatch,
        notify: setNotice,
        goToSources,
        // Tras aplicar una importación, los ajustes pueden cambiar (p. ej. el
        // repo oficial sugerido): se relee la vista.
        onApplied: () => void reload(),
        reporter: services.reporter,
      }),
    [backupService, services.reporter, goToSources, reload],
  );

  const setProtection = useCallback((on: boolean) => void run(() => service.setInstallProtection(on)), [service, run]);
  const setNsfw = useCallback((on: boolean) => void run(() => service.setNsfwVisible(on)), [service, run]);
  const setMode = useCallback((mode: ReaderMode) => void run(() => service.setDefaultReaderMode(mode)), [service, run]);
  const clearCache = useCallback(() => void run(() => service.clearCache()), [service, run]);
  const restoreOfficial = useCallback(() => void run(() => service.restoreOfficialRepo()), [service, run]);
  const dismissNotice = useCallback(() => setNotice(null), []);
  const retry = useCallback(() => setNonce((v) => v + 1), []);

  return {
    view,
    flow,
    notice,
    controller,
    busy,
    setProtection,
    setNsfw,
    setMode,
    clearCache,
    restoreOfficial,
    dismissNotice,
    retry,
    reload,
  };
}
