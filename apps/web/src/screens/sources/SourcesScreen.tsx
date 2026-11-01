import { useState } from "react";

import { t } from "@ryuunest/i18n";
import type { InstallPreview, UpdatePreview } from "@ryuunest/core";
import { kindLabel } from "@ryuunest/mobile-src/components/kindLabel";
import type { SourceModule, SourcesData } from "@ryuunest/mobile-src/screens/sources/sourcesData";
import {
  BADGE_LABEL_KEYS,
  ROW_ACTION_KEYS,
  moduleBadges,
  moduleRowAction,
} from "@ryuunest/mobile-src/screens/sources/sourcesView";
import type { SourcesFlow } from "@ryuunest/mobile-src/screens/sources/sourcesFlow";
import type { SourcesController } from "@ryuunest/mobile-src/screens/sources/sourcesController";
import { Plus, RefreshCw, Trash2 } from "../../icons";

import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import Dialog from "../../components/Dialog";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import HoldToConfirm from "../../components/HoldToConfirm";
import LoadingState from "../../components/LoadingState";
import TextField from "../../components/TextField";
import Toast from "../../components/Toast";
import "./sources.css";
import { useSourcesData } from "./useSourcesData";

/**
 * F25 — pantalla Fuentes web: repositorios y módulos sobre los servicios
 * reales (sql.js + IndexedDB). La lógica (flujo de hojas, controlador,
 * servicio) viene de `apps/mobile` (pura); aquí solo se pinta en DOM.
 * Estados: carga, vacío, error con reintento y datos; nada se instala sin
 * confirmación (AC-8).
 */
export default function SourcesScreen() {
  const state = useSourcesData();
  const { view, flow, notice, controller } = state;

  return (
    <div className="screen sources-screen" data-testid="screen-sources">
      <header className="screen-header">
        <h1 className="t-headline-md">{t("nav.sources")}</h1>
        <p className="t-body-md screen-subtitle">{t("sources.subtitle")}</p>
      </header>

      {view.status === "loading" && <LoadingState label={t("state.loading.title")} testID="sources-loading" />}

      {view.status === "error" && (
        <ErrorState
          title={t("state.error.sources.title")}
          message={t("state.error.sources.message")}
          actionLabel={t("actions.retry")}
          onAction={state.retry}
          testID="sources-error"
        />
      )}

      {view.status === "ready" && controller !== null && (
        <SourcesReady data={view.data} controller={controller} />
      )}

      {notice !== null && controller !== null && (
        <Toast message={notice} onClose={controller.dismissNotice} testID="sources-notice" />
      )}

      {controller !== null && flow.sheet === "add-repo" && (
        <AddRepoDialog flow={flow} controller={controller} />
      )}
      {controller !== null && flow.sheet === "install" && (
        <InstallDialog preview={flow.preview} busy={flow.busy} error={flow.error} controller={controller} />
      )}
      {controller !== null && flow.sheet === "manage" && (
        <ManageDialog moduleId={flow.moduleId} busy={flow.busy} error={flow.error} controller={controller} data={view.status === "ready" ? view.data : null} />
      )}
      {controller !== null && flow.sheet === "update" && (
        <UpdateDialog preview={flow.preview} busy={flow.busy} error={flow.error} controller={controller} />
      )}
      {controller !== null && flow.sheet === "uninstall" && (
        <ConfirmDialog
          titleKey="sources.uninstall.title"
          messageKey="sources.uninstall.message"
          submitKey="sources.uninstall.submit"
          busy={flow.busy}
          error={flow.error}
          onSubmit={() => void controller.confirmUninstall()}
          onClose={controller.back}
          testID="uninstall-dialog"
        />
      )}
      {controller !== null && flow.sheet === "remove-repo" && (
        <ConfirmDialog
          titleKey="sources.removeRepo.title"
          messageKey="sources.removeRepo.message"
          submitKey="sources.removeRepo.submit"
          busy={flow.busy}
          error={flow.error}
          onSubmit={() => void controller.confirmRemoveRepo()}
          onClose={controller.close}
          testID="remove-repo-dialog"
        />
      )}
    </div>
  );
}

function SourcesReady({
  data,
  controller,
}: {
  data: SourcesData;
  controller: SourcesController;
}) {
  const [kindFilter, setKindFilter] = useState<string>("all");
  const kinds = Array.from(new Set(data.modules.flatMap((m) => m.kinds)));
  const visible =
    kindFilter === "all" ? data.modules : data.modules.filter((m) => m.kinds.includes(kindFilter as never));

  if (data.repos.length === 0) {
    return (
      <EmptyState
        title={t(data.officialRepoDismissed ? "sources.empty.dismissedTitle" : "sources.empty.title")}
        message={t(data.officialRepoDismissed ? "sources.empty.dismissedMessage" : "sources.empty.message")}
        actionLabel={t("actions.addRepository")}
        onAction={controller.openAddRepo}
        testID="sources-empty"
      />
    );
  }

  return (
    <div className="sources-content">
      <div className="sources-toolbar">
        <p className="t-body-sm sources-summary">
          {t("sources.summary", {
            installed: data.modules.filter((m) => m.status === "installed").length,
            available: data.modules.length,
          })}
        </p>
        <Button
          variant="primary"
          label={t("actions.addRepository")}
          icon={<Plus size={18} aria-hidden />}
          onClick={controller.openAddRepo}
          testID="sources-add-repo"
        />
      </div>

      <section className="sources-section" aria-label={t("sources.section.repos")}>
        <h2 className="t-title-lg">{t("sources.section.repos")}</h2>
        <ul className="sources-list">
          {data.repos.map((repo) => (
            <li key={repo.id} className="sources-row" data-testid={`repo-${repo.id}`}>
              <div className="sources-row-main">
                <span className="t-body-lg sources-row-title">{repo.name}</span>
                <span className="t-body-sm sources-row-meta">{repo.url}</span>
                <span className="t-body-sm sources-row-meta">{t("sources.repo.modules", { count: repo.moduleCount })}</span>
              </div>
              <div className="sources-row-actions">
                <Button
                  variant="secondary"
                  label={t("sources.repo.sync")}
                  icon={<RefreshCw size={16} aria-hidden />}
                  onClick={() => void controller.syncRepo(repo.id)}
                  testID={`repo-sync-${repo.id}`}
                />
                <Button
                  variant="destructive"
                  label={t("sources.repo.remove")}
                  icon={<Trash2 size={16} aria-hidden />}
                  onClick={() => controller.askRemoveRepo(repo.id)}
                  testID={`repo-remove-${repo.id}`}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="sources-section" aria-label={t("sources.section.modules")}>
        <h2 className="t-title-lg">{t("sources.section.modules")}</h2>
        {kinds.length > 0 && (
          <div className="sources-chips">
            <Chip
              label={t("sources.chip.all", { count: data.modules.length })}
              active={kindFilter === "all"}
              onClick={() => setKindFilter("all")}
              testID="chip-all"
            />
            {kinds.map((kind) => (
              <Chip
                key={kind}
                label={t("sources.chip.kind", {
                  kind: kindLabel(kind),
                  count: data.modules.filter((m) => m.kinds.includes(kind)).length,
                })}
                active={kindFilter === kind}
                onClick={() => setKindFilter(kind)}
                testID={`chip-${kind}`}
              />
            ))}
          </div>
        )}
        {visible.length === 0 ? (
          <p className="t-body-md sources-row-meta">{t("sources.filtered.title")}</p>
        ) : (
          <ul className="sources-list">
            {visible.map((module) => (
              <ModuleRow
                key={`${module.repoId}:${module.id}`}
                module={module}
                onAction={() =>
                  moduleRowAction(module) === "install"
                    ? void controller.openInstall(module.repoId, module.id)
                    : controller.openManage(module.id)
                }
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ModuleRow({ module, onAction }: { module: SourceModule; onAction: () => void }) {
  const action = moduleRowAction(module);
  return (
    <li className="sources-row" data-testid={`module-${module.id}`}>
      <div className="sources-row-main">
        <span className="t-body-lg sources-row-title">{module.name}</span>
        <span className="t-body-sm sources-row-meta">
          {t("sources.module.meta", { kind: kindLabel(module.kinds[0] ?? "manga"), lang: module.lang, version: module.version })}
        </span>
        <span className="sources-row-badges">
          {moduleBadges(module).map((badge) => (
            <Badge key={badge} label={t(BADGE_LABEL_KEYS[badge])} tone={badge === "error" ? "error" : badge === "update" ? "warning" : "neutral"} />
          ))}
        </span>
      </div>
      <div className="sources-row-actions">
        <Button
          variant={action === "install" ? "primary" : "secondary"}
          label={t(ROW_ACTION_KEYS[action])}
          onClick={onAction}
          testID={`module-action-${module.id}`}
        />
      </div>
    </li>
  );
}

function AddRepoDialog({
  flow,
  controller,
}: {
  flow: Extract<SourcesFlow, { sheet: "add-repo" }>;
  controller: SourcesController;
}) {
  const [value, setValue] = useState("");
  return (
    <Dialog title={t("sources.add.title")} onClose={controller.close} testID="add-repo-dialog">
      <p className="t-body-md sources-dialog-text">{t("sources.add.description")}</p>
      <TextField
        label={t("sources.add.label")}
        value={value}
        onChange={setValue}
        placeholder={t("sources.add.placeholder")}
        error={flow.error ?? undefined}
        testID="add-repo-url"
        autoFocus
      />
      <Button
        label={t("sources.add.submit")}
        onClick={() => void controller.submitAddRepo(value)}
        testID="add-repo-submit"
      />
    </Dialog>
  );
}

function PreviewRows({ preview }: { preview: InstallPreview }) {
  return (
    <dl className="sources-detail">
      <div className="sources-detail-row">
        <dt className="t-label-md">{t("sources.detail.version")}</dt>
        <dd className="t-body-md">{preview.version}</dd>
      </div>
      <div className="sources-detail-row">
        <dt className="t-label-md">{t("sources.detail.runtime")}</dt>
        <dd className="t-body-md">{t(preview.runtime === "script" ? "sources.runtime.script" : "sources.runtime.declarative")}</dd>
      </div>
      <div className="sources-detail-row">
        <dt className="t-label-md">{t("sources.detail.permissions")}</dt>
        <dd className="t-body-md">{preview.permissions.domains.join(", ")}</dd>
      </div>
      <div className="sources-detail-row">
        <dt className="t-label-md">{t("sources.detail.hash")}</dt>
        <dd className="t-label-sm sources-detail-hash">{preview.sha256}</dd>
      </div>
    </dl>
  );
}

function InstallDialog({
  preview,
  busy,
  error,
  controller,
}: {
  preview: InstallPreview;
  busy: boolean;
  error: string | null;
  controller: SourcesController;
}) {
  return (
    <Dialog title={t("sources.install.title")} onClose={controller.close} testID="install-dialog">
      <p className="t-body-lg">{preview.name}</p>
      <PreviewRows preview={preview} />
      {preview.reinforced && <p className="t-body-sm sources-warning">{t("sources.install.scriptWarning")}</p>}
      {error !== null && <p className="t-body-sm field-error" role="alert">{error}</p>}
      {preview.reinforced ? (
        <HoldToConfirm
          label={t("sources.install.hold")}
          holdingLabel={t("sources.install.holding")}
          onConfirm={() => void controller.confirmInstall(true)}
          disabled={busy}
          testID="install-confirm"
        />
      ) : (
        <Button
          label={t("sources.install.submit")}
          onClick={() => void controller.confirmInstall(false)}
          disabled={busy}
          testID="install-confirm"
        />
      )}
    </Dialog>
  );
}

function ManageDialog({
  moduleId,
  busy,
  error,
  controller,
  data,
}: {
  moduleId: string;
  busy: boolean;
  error: string | null;
  controller: SourcesController;
  data: SourcesData | null;
}) {
  const module = data?.modules.find((m) => m.id === moduleId);
  if (module === undefined) return null;
  return (
    <Dialog title={module.name} onClose={controller.close} testID="manage-dialog">
      {error !== null && <p className="t-body-sm field-error" role="alert">{error}</p>}
      <div className="sources-dialog-actions">
        <Button
          variant="secondary"
          label={t(module.enabled ? "sources.manage.disable" : "sources.manage.enable")}
          onClick={() => void controller.setEnabled(moduleId, !module.enabled)}
          disabled={busy}
          testID="manage-toggle-enabled"
        />
        <Button
          variant="secondary"
          label={t("sources.module.updateTo", { version: module.updateTo ?? module.version })}
          onClick={() => void controller.openUpdate(moduleId)}
          disabled={busy || module.orphan}
          testID="manage-update"
        />
        <Button
          variant="destructive"
          label={t("sources.manage.uninstall")}
          onClick={controller.askUninstall}
          disabled={busy}
          testID="manage-uninstall"
        />
      </div>
    </Dialog>
  );
}

function UpdateDialog({
  preview,
  busy,
  error,
  controller,
}: {
  preview: UpdatePreview;
  busy: boolean;
  error: string | null;
  controller: SourcesController;
}) {
  return (
    <Dialog title={t("sources.update.title")} onClose={controller.back} testID="update-dialog">
      <p className="t-body-md sources-dialog-text">
        {t("sources.module.updateTo", { version: preview.nextVersion ?? preview.currentVersion })}
      </p>
      {preview.reasons.length > 0 && (
        <ul className="sources-dialog-list">
          {preview.reasons.map((reason) => (
            <li key={reason} className="t-body-sm sources-warning">
              {reason}
            </li>
          ))}
        </ul>
      )}
      {error !== null && <p className="t-body-sm field-error" role="alert">{error}</p>}
      {preview.reinforced ? (
        <HoldToConfirm
          label={t("sources.update.hold")}
          holdingLabel={t("sources.install.holding")}
          onConfirm={() => void controller.confirmUpdate(true)}
          disabled={busy}
          testID="update-confirm"
        />
      ) : (
        <Button
          label={t("sources.update.submit")}
          onClick={() => void controller.confirmUpdate(false)}
          disabled={busy}
          testID="update-confirm"
        />
      )}
    </Dialog>
  );
}

function ConfirmDialog({
  titleKey,
  messageKey,
  submitKey,
  busy,
  error,
  onSubmit,
  onClose,
  testID,
}: {
  titleKey: string;
  messageKey: string;
  submitKey: string;
  busy: boolean;
  error: string | null;
  onSubmit: () => void;
  onClose: () => void;
  testID: string;
}) {
  return (
    <Dialog title={t(titleKey)} onClose={onClose} testID={testID}>
      <p className="t-body-md sources-dialog-text">{t(messageKey)}</p>
      {error !== null && <p className="t-body-sm field-error" role="alert">{error}</p>}
      <div className="sources-dialog-actions">
        <Button variant="secondary" label={t("sources.sheet.cancel")} onClick={onClose} testID={`${testID}-cancel`} />
        <Button variant="destructive" label={t(submitKey)} onClick={onSubmit} disabled={busy} testID={`${testID}-submit`} />
      </div>
    </Dialog>
  );
}
