import { t } from "@ryuunest/i18n";
import { useState, useSyncExternalStore } from "react";

import Banner from "../components/Banner";
import { useServices } from "../services/ServicesContext";
import { extensionNotice } from "./extensionNoticeModel";

/**
 * F27 — avisa de lo accionable sobre la extensión de navegador (SPEC §10): que
 * falta (recargar tras instalarla) o que hay dominios por autorizar (abrir la
 * extensión, donde se concede el permiso). Se puede cerrar; un dominio nuevo
 * vuelve a avisar. Lógica en `extensionNotice` (pura, con pruebas).
 */
export default function ExtensionNotice() {
  const { extension } = useServices();
  const status = useSyncExternalStore(extension.status.subscribe, extension.status.get);
  const [dismissed, setDismissed] = useState<string | null>(null);

  const notice = extensionNotice(status);
  if (notice === null || notice.dismissKey === dismissed) return null;

  const onAction =
    notice.kind === "missing"
      ? () => window.location.reload()
      : () => {
          // Sin respuesta de la extensión, el estado pasa a «missing» y el aviso cambia solo.
          extension.openOptions(notice.domain).catch(() => {});
        };

  return (
    <Banner
      message={t(notice.messageKey, notice.kind === "domains" ? notice.params : undefined)}
      actionLabel={t(notice.actionKey)}
      onAction={onAction}
      onClose={() => setDismissed(notice.dismissKey)}
      testID="extension-notice"
    />
  );
}
