import { t } from "@ryuunest/i18n";
import { useCallback, useEffect, useState } from "react";

import {
  authorizeHosts,
  loadDomains,
  revokeHost,
  type DomainsApi,
  type DomainsState,
} from "./domainsModel";

export type DomainsView =
  { status: "loading" } | { status: "error" } | { status: "ready"; data: DomainsState };

/** Estado de la página de opciones sobre una `DomainsApi` (la lógica está en `domainsModel`). */
export function useDomains(api: DomainsApi) {
  const [view, setView] = useState<DomainsView>({ status: "loading" });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setView({ status: "ready", data: await loadDomains(api) });
    } catch {
      setView({ status: "error" });
    }
  }, [api]);

  useEffect(() => {
    void reload();
    // Al volver a esta pestaña pueden haber llegado dominios nuevos.
    const onFocus = () => void reload();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [reload]);

  /** Se llama directamente desde el clic: `authorizeHosts` pide el permiso en el mismo turno. */
  const authorize = (hosts: readonly string[]) => {
    setBusy(true);
    authorizeHosts(api, hosts)
      .then((granted) => {
        if (!granted) setNotice(t("extension.options.denied"));
      })
      .catch(() => setNotice(t("extension.options.denied")))
      .then(reload)
      .finally(() => setBusy(false));
  };

  const revoke = (host: string) => {
    setBusy(true);
    revokeHost(api, host)
      .then((removed) => {
        if (!removed) setNotice(t("extension.options.revokeFailed"));
      })
      .catch(() => setNotice(t("extension.options.revokeFailed")))
      .then(reload)
      .finally(() => setBusy(false));
  };

  // Estable: `Toast` reinicia su cuenta atrás de 4 s si cambia la identidad de `onClose`.
  const dismissNotice = useCallback(() => setNotice(null), []);

  return { view, busy, notice, authorize, revoke, reload, dismissNotice };
}
