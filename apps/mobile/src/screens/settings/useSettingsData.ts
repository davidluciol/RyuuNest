import { useCallback, useEffect, useState } from "react";

import { openAppDatabase } from "../../data/appDatabase";
import { createFetchHttp } from "../../data/fetchHttp";
import { createAppSecureLock } from "../../data/secureLock";
import { createSettingsService } from "./settingsData";
import { createSampleSettingsService } from "./sampleSettingsService";
import type { SettingsService } from "./settingsData";
import type { SettingsView } from "./SettingsScreen";

/**
 * F16b — estado de la pantalla Ajustes: en el dispositivo, el núcleo real sobre
 * SQLite; en web y la galería, el servicio de ejemplo en memoria (P-79). Mantiene
 * la vista (`loading`/`error`/`ready`), el aviso y una operación en curso.
 */

export async function resolveSettingsService(): Promise<SettingsService> {
  const driver = await openAppDatabase();
  if (driver === null) return createSampleSettingsService();
  return createSettingsService({
    driver,
    http: createFetchHttp(),
    clock: { now: () => Date.now() },
    secureLock: createAppSecureLock(),
  });
}

export interface SettingsState {
  view: SettingsView;
  notice: string | null;
  /** Una operación en curso bloquea los controles. */
  busy: boolean;
  toggleProtection: (on: boolean) => void;
  restoreOfficialRepo: () => void;
  dismissNotice: () => void;
  retry: () => void;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function useSettingsData(): SettingsState {
  const [service, setService] = useState<SettingsService | null>(null);
  const [view, setView] = useState<SettingsView>({ status: "loading" });
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setView({ status: "loading" });
    resolveSettingsService()
      .then(async (resolved) => {
        const data = await resolved.load();
        if (cancelled) return;
        setService(resolved);
        setView({ status: "ready", data });
      })
      .catch((error: unknown) => {
        console.warn("No se pudieron abrir los ajustes:", error);
        if (!cancelled) setView({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const refresh = useCallback(async () => {
    if (service === null) return;
    setView({ status: "ready", data: await service.load() });
  }, [service]);

  const run = useCallback(
    async (work: () => Promise<void>) => {
      setBusy(true);
      try {
        await work();
        await refresh();
      } catch (error) {
        setNotice(messageOf(error));
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const toggleProtection = useCallback(
    (on: boolean) => {
      if (service === null) return;
      void run(() => service.setInstallProtection(on));
    },
    [service, run],
  );

  const restoreOfficialRepo = useCallback(() => {
    if (service === null) return;
    void run(() => service.restoreOfficialRepo());
  }, [service, run]);

  const dismissNotice = useCallback(() => setNotice(null), []);
  const retry = useCallback(() => setNonce((value) => value + 1), []);

  return { view, notice, busy, toggleProtection, restoreOfficialRepo, dismissNotice, retry };
}
