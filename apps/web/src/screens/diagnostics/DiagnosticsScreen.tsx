import { useNavigate } from "react-router";

import { t } from "@ryuunest/i18n";
import { eventDetailLines, eventLevel, eventWhen, confirmClearMessage } from "@ryuunest/mobile-src/screens/settings/diagnostics/diagnosticsView";

import Button from "../../components/Button";
import Chip from "../../components/Chip";
import Dialog from "../../components/Dialog";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import Toast from "../../components/Toast";
import { ChevronLeft, Copy, Trash2, Upload } from "../../icons";
import "./diagnostics.css";
import { useDiagnosticsData } from "./useDiagnosticsData";

/**
 * F25 — Diagnóstico web (`/diagnostics`, fuera del marco como en móvil): lista
 * los eventos del registro real, exporta el informe (descarga), lo copia al
 * portapapeles y lo borra con confirmación. Nada sale del dispositivo salvo
 * que el usuario elija exportar o copiar.
 */
export default function DiagnosticsScreen() {
  const navigate = useNavigate();
  const { view, flow, controller, notice, retry } = useDiagnosticsData();
  const onBack = () => navigate("/settings");

  const header = (
    <header className="diag-header">
      <button type="button" className="diag-back" onClick={onBack} aria-label={t("actions.back")} data-testid="diagnostics-back">
        <ChevronLeft size={24} aria-hidden />
      </button>
      <h1 className="t-headline-sm">{t("diagnostics.title")}</h1>
    </header>
  );

  if (view.status === "loading") {
    return (
      <div className="screen diag-screen" data-testid="screen-diagnostics">
        {header}
        <LoadingState label={t("state.loading.title")} testID="diagnostics-loading" />
      </div>
    );
  }

  if (view.status === "error") {
    return (
      <div className="screen diag-screen" data-testid="screen-diagnostics">
        {header}
        <ErrorState
          title={t("state.error.diagnostics.title")}
          message={t("state.error.diagnostics.message")}
          actionLabel={t("actions.retry")}
          onAction={retry}
          testID="diagnostics-error"
        />
      </div>
    );
  }

  const { events } = view;

  if (events.length === 0) {
    return (
      <div className="screen diag-screen" data-testid="screen-diagnostics">
        {header}
        <EmptyState
          title={t("diagnostics.empty.title")}
          message={t("diagnostics.empty.message")}
          actionLabel={t("diagnostics.empty.action")}
          onAction={onBack}
          testID="diagnostics-empty"
        />
        {notice !== null && controller !== null && (
          <Toast message={notice.message} severity={notice.severity} onClose={controller.dismissNotice} testID="diagnostics-toast" />
        )}
      </div>
    );
  }

  const disabled = flow.busy || controller === null;
  const now = Date.now();

  return (
    <div className="screen diag-screen" data-testid="screen-diagnostics">
      {header}
      <div className="diag-content">
        <p className="t-body-md diag-intro">{t("diagnostics.intro")}</p>

        <section className="diag-group" aria-label={t("diagnostics.format.label")}>
          <h2 className="t-label-md diag-label">{t("diagnostics.format.label")}</h2>
          <div className="diag-chips">
            <Chip
              label={t("diagnostics.format.text")}
              active={flow.format === "text"}
              onClick={() => controller?.setFormat("text")}
              testID="diagnostics-format-text"
            />
            <Chip
              label={t("diagnostics.format.json")}
              active={flow.format === "json"}
              onClick={() => controller?.setFormat("json")}
              testID="diagnostics-format-json"
            />
          </div>
          <Button
            label={t("diagnostics.export")}
            icon={<Upload size={16} aria-hidden />}
            disabled={disabled}
            onClick={() => void controller?.exportReport()}
            testID="diagnostics-export"
          />
          <div className="diag-pair">
            <Button
              variant="secondary"
              label={t("diagnostics.copy")}
              icon={<Copy size={16} aria-hidden />}
              disabled={disabled}
              onClick={() => void controller?.copyReport()}
              testID="diagnostics-copy"
            />
            <Button
              variant="destructive"
              label={t("diagnostics.clear")}
              icon={<Trash2 size={16} aria-hidden />}
              disabled={disabled}
              onClick={() => controller?.askClear()}
              testID="diagnostics-clear"
            />
          </div>
        </section>

        <section className="diag-group">
          <h2 className="t-label-md diag-label">{t("diagnostics.events", { count: events.length })}</h2>
          <ul className="diag-list" data-testid="diagnostics-list">
            {events.map((event, index) => {
              const level = eventLevel(event.level);
              const expanded = flow.expanded.includes(event.id);
              return (
                <li key={event.id} className={index === 0 ? undefined : "diag-divider"}>
                  <button
                    type="button"
                    className="diag-event-head"
                    onClick={() => controller?.toggleDetail(event.id)}
                    aria-expanded={expanded}
                    data-testid={`diagnostics-event-${event.id}`}
                  >
                    <span className={`t-label-sm diag-level diag-level-${level.tone}`}>{level.label}</span>
                    <span className="t-label-sm diag-code">{event.code}</span>
                    <span className="t-body-sm diag-message">{event.message}</span>
                    <span className="t-body-sm diag-when">{eventWhen(event.at, now)}</span>
                  </button>
                  {expanded && (
                    <dl className="diag-detail" data-testid={`diagnostics-detail-${event.id}`}>
                      {eventDetailLines(event).map((line) => (
                        <div className="diag-detail-row" key={line.label}>
                          <dt>{line.label}</dt>
                          <dd>{line.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {controller !== null && flow.confirmClear && (
        <Dialog title={t("diagnostics.confirm.title")} onClose={controller.cancelClear} testID="diagnostics-confirm">
          <p className="t-body-md diag-confirm-text">{confirmClearMessage(events.length)}</p>
          <div className="diag-pair">
            <Button variant="secondary" label={t("diagnostics.confirm.cancel")} onClick={controller.cancelClear} testID="diagnostics-confirm-cancel" />
            <Button
              variant="destructive"
              label={t("diagnostics.confirm.submit")}
              onClick={() => void controller.confirmClear()}
              testID="diagnostics-confirm-submit"
            />
          </div>
        </Dialog>
      )}

      {notice !== null && controller !== null && (
        <Toast message={notice.message} severity={notice.severity} onClose={controller.dismissNotice} testID="diagnostics-toast" />
      )}
    </div>
  );
}
