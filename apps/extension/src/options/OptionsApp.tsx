import { t } from "@ryuunest/i18n";
import Button from "@ryuunest/web/components/Button";
import ErrorState from "@ryuunest/web/components/ErrorState";
import LoadingState from "@ryuunest/web/components/LoadingState";
import Toast from "@ryuunest/web/components/Toast";

import DomainRow from "./DomainRow";
import type { DomainsApi } from "./domainsModel";
import "./options.css";
import { useDomains } from "./useDomains";

/**
 * F26 — página de opciones de la extensión (SPEC §10): donde el usuario
 * autoriza los dominios que la web pidió y quita permisos. Sin diseño en Stitch
 * (P-30): se compone con los componentes y tokens de la web. Un único botón
 * primario por pantalla (V3): «Autorizar todos» si hay varios pendientes, o el
 * «Autorizar» del único pendiente.
 */
export default function OptionsApp({ api }: { api: DomainsApi }) {
  const { view, busy, notice, authorize, revoke, reload, dismissNotice } = useDomains(api);

  return (
    <main className="options-page" data-testid="screen-options">
      <header className="options-header">
        <h1 className="t-headline-md">{t("extension.options.title")}</h1>
        <p className="t-body-md options-intro">{t("extension.options.intro")}</p>
      </header>

      {view.status === "loading" && (
        <LoadingState label={t("state.loading.title")} testID="options-loading" />
      )}
      {view.status === "error" && (
        <ErrorState
          title={t("extension.options.error.title")}
          message={t("extension.options.error.message")}
          actionLabel={t("actions.retry")}
          onAction={() => void reload()}
          testID="options-error"
        />
      )}

      {view.status === "ready" && (
        <>
          <section className="options-card" aria-labelledby="options-pending-title">
            <h2 id="options-pending-title" className="t-title-lg">
              {t("extension.options.pending.title")}
            </h2>
            <p className="t-body-sm options-hint">{t("extension.options.pending.hint")}</p>
            {view.data.pending.length === 0 ? (
              <p className="t-body-md options-empty" data-testid="options-pending-empty">
                {t("extension.options.pending.empty")}
              </p>
            ) : (
              <ul className="domain-list">
                {view.data.pending.map((host) => (
                  <DomainRow
                    key={host}
                    host={host}
                    kind="pending"
                    actionLabel={t("extension.options.authorize")}
                    actionVariant={view.data.pending.length === 1 ? "primary" : "secondary"}
                    onAction={() => authorize([host])}
                    disabled={busy}
                  />
                ))}
              </ul>
            )}
            {view.data.pending.length > 1 && (
              <Button
                variant="primary"
                label={t("extension.options.authorizeAll", { count: view.data.pending.length })}
                onClick={() => authorize(view.data.pending)}
                disabled={busy}
                testID="options-authorize-all"
              />
            )}
          </section>

          <section className="options-card" aria-labelledby="options-authorized-title">
            <h2 id="options-authorized-title" className="t-title-lg">
              {t("extension.options.authorized.title")}
            </h2>
            <p className="t-body-sm options-hint">{t("extension.options.authorized.hint")}</p>
            {view.data.authorized.length === 0 ? (
              <p className="t-body-md options-empty" data-testid="options-authorized-empty">
                {t("extension.options.authorized.empty")}
              </p>
            ) : (
              <ul className="domain-list">
                {view.data.authorized.map((host) => (
                  <DomainRow
                    key={host}
                    host={host}
                    kind="authorized"
                    actionLabel={t("extension.options.revoke")}
                    onAction={() => revoke(host)}
                    disabled={busy}
                  />
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {notice !== null && (
        <Toast
          message={notice}
          severity="warning"
          onClose={dismissNotice}
          testID="options-notice"
        />
      )}
    </main>
  );
}
