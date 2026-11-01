import { useNavigate } from "react-router";

import { t } from "@ryuunest/i18n";
import { kindLabel } from "@ryuunest/mobile-src/components/kindLabel";
import {
  READER_MODE_OPTIONS,
  installProtectionHintKey,
} from "@ryuunest/mobile-src/screens/settings/settingsView";

import Button from "../../components/Button";
import Chip from "../../components/Chip";
import Dialog from "../../components/Dialog";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import Switch from "../../components/Switch";
import Toast from "../../components/Toast";
import { ChevronRight } from "../../icons";
import { DIAGNOSTICS_PATH } from "../../routes";
import "./settings.css";
import { useSettingsData } from "./useSettingsData";

/**
 * F25 — Ajustes web: secciones como tarjetas (idioma, lectura, seguridad,
 * fuentes, caché, respaldo, diagnóstico) sobre la base real. En web no hay
 * bloqueo del dispositivo (SPEC §5.3): la protección queda desactivada con
 * aviso. Respaldo: exportar (descarga JSON) e importar (fusionar/reemplazar
 * con confirmación + sugerencias; nada se instala solo, AC-8).
 */
export default function SettingsScreen() {
  const navigate = useNavigate();
  const state = useSettingsData(() => navigate("/sources"));
  const { view, flow, notice, controller, busy } = state;

  return (
    <div className="screen settings-screen" data-testid="screen-settings">
      <header className="screen-header">
        <h1 className="t-headline-md">{t("nav.settings")}</h1>
      </header>

      {view.status === "loading" && <LoadingState label={t("state.loading.title")} testID="settings-loading" />}
      {view.status === "error" && (
        <ErrorState
          title={t("state.error.settings.title")}
          message={t("state.error.settings.message")}
          actionLabel={t("actions.retry")}
          onAction={state.retry}
          testID="settings-error"
        />
      )}

      {view.status === "ready" && controller !== null && (
        <div className="settings-content">
          <section className="settings-card" aria-label={t("settings.section.language")}>
            <h2 className="t-title-lg">{t("settings.section.language")}</h2>
            <div className="settings-row">
              <div>
                <p className="t-body-md settings-row-label">{t("settings.language.label")}</p>
                <p className="t-body-sm settings-hint">{t("settings.language.hint")}</p>
              </div>
              <span className="t-body-md settings-value">
                {view.data.language === "es" ? t("settings.language.es") : view.data.language}
              </span>
            </div>
          </section>

          <section className="settings-card" aria-label={t("settings.section.reading")}>
            <h2 className="t-title-lg">{t("settings.section.reading")}</h2>
            <p className="t-body-sm settings-hint">{t("settings.reading.defaultModeHint")}</p>
            <div className="settings-chips">
              {READER_MODE_OPTIONS.map((option) => (
                <Chip
                  key={option.mode}
                  label={t(option.labelKey)}
                  active={view.data.defaultReaderMode === option.mode}
                  onClick={() => state.setMode(option.mode)}
                  testID={`settings-mode-${option.mode}`}
                />
              ))}
            </div>
          </section>

          <section className="settings-card" aria-label={t("settings.section.security")}>
            <h2 className="t-title-lg">{t("settings.section.security")}</h2>
            <Switch
              checked={view.data.nsfwVisible}
              disabled={busy}
              label={t("settings.security.nsfw")}
              hint={t("settings.security.nsfwHint")}
              onChange={state.setNsfw}
              testID="settings-nsfw"
            />
            <Switch
              checked={view.data.installProtection}
              disabled={!view.data.lockAvailable || busy}
              label={t("settings.security.installProtection")}
              hint={t(installProtectionHintKey(view.data.lockAvailable))}
              hintTone={view.data.lockAvailable ? "default" : "warning"}
              onChange={state.setProtection}
              testID="settings-protection"
            />
          </section>

          {!view.data.officialRepoRegistered && (
            <section className="settings-card" aria-label={t("settings.section.sources")}>
              <h2 className="t-title-lg">{t("settings.section.sources")}</h2>
              <div className="settings-row">
                <div>
                  <p className="t-body-md settings-row-label">{t("settings.official.title")}</p>
                  <p className="t-body-sm settings-hint">{t("settings.official.hint")}</p>
                </div>
                <Button
                  variant="secondary"
                  label={t("settings.official.restore")}
                  onClick={state.restoreOfficial}
                  disabled={busy}
                  testID="settings-restore-official"
                />
              </div>
            </section>
          )}

          <section className="settings-card" aria-label={t("settings.section.cache")}>
            <h2 className="t-title-lg">{t("settings.section.cache")}</h2>
            <div className="settings-row">
              <div>
                <p className="t-body-md settings-row-label">{t("settings.cache.images")}</p>
                <p className="t-body-sm settings-hint">{t("settings.cache.hint")}</p>
              </div>
              <Button
                variant="secondary"
                label={t("settings.cache.clear")}
                onClick={state.clearCache}
                disabled={busy}
                testID="settings-clear-cache"
              />
            </div>
          </section>

          <section className="settings-card" aria-label={t("settings.section.backup")}>
            <h2 className="t-title-lg">{t("settings.section.backup")}</h2>
            <div className="settings-row">
              <div>
                <p className="t-body-md settings-row-label">{t("settings.backup.export")}</p>
                <p className="t-body-sm settings-hint">{t("settings.backup.exportHint")}</p>
              </div>
              <Button
                variant="secondary"
                label={t("settings.backup.export")}
                onClick={() => void controller.exportBackup()}
                disabled={busy}
                testID="settings-backup-export"
              />
            </div>
            <div className="settings-row">
              <div>
                <p className="t-body-md settings-row-label">{t("settings.backup.import")}</p>
                <p className="t-body-sm settings-hint">{t("settings.backup.importHint")}</p>
              </div>
              <Button
                variant="secondary"
                label={t("settings.backup.import")}
                onClick={() => void controller.importBackup()}
                disabled={busy}
                testID="settings-backup-import"
              />
            </div>
          </section>

          <section className="settings-card" aria-label={t("settings.section.diagnostics")}>
            <h2 className="t-title-lg">{t("settings.section.diagnostics")}</h2>
            <button
              type="button"
              className="settings-nav-row"
              onClick={() => navigate(DIAGNOSTICS_PATH)}
              data-testid="settings-diagnostics"
            >
              <span>
                <span className="t-body-md settings-row-label settings-nav-label">{t("settings.diagnostics.row")}</span>
                <span className="t-body-sm settings-hint settings-nav-hint">{t("settings.diagnostics.rowHint")}</span>
              </span>
              <ChevronRight size={20} aria-hidden />
            </button>
          </section>
        </div>
      )}

      {notice !== null && <Toast message={notice} onClose={state.dismissNotice} testID="settings-notice" />}

      {controller !== null && flow.sheet === "import-mode" && (
        <Dialog title={t("settings.backup.sheet.title")} onClose={controller.close} testID="backup-mode-dialog">
          <p className="t-body-md settings-hint">{t("settings.backup.sheet.description")}</p>
          <p className="t-body-sm settings-hint">{t("settings.backup.sheet.mergeHint")}</p>
          <div className="settings-dialog-actions">
            <Button
              variant="primary"
              label={t("settings.backup.sheet.merge")}
              onClick={() => void controller.applyImport("merge")}
              disabled={flow.busy}
              testID="backup-merge"
            />
          </div>
          <p className="t-body-sm settings-hint">{t("settings.backup.sheet.replaceHint")}</p>
          <div className="settings-dialog-actions">
            <Button
              variant="destructive"
              label={t("settings.backup.sheet.replace")}
              onClick={controller.askReplace}
              disabled={flow.busy}
              testID="backup-replace"
            />
            <Button variant="secondary" label={t("settings.backup.sheet.cancel")} onClick={controller.close} testID="backup-cancel" />
          </div>
          {flow.error !== null && (
            <p className="t-body-sm field-error" role="alert">
              {flow.error}
            </p>
          )}
        </Dialog>
      )}
      {controller !== null && flow.sheet === "replace-confirm" && (
        <Dialog title={t("settings.backup.replace.title")} onClose={controller.close} testID="backup-replace-dialog">
          <p className="t-body-md settings-hint">{t("settings.backup.replace.message")}</p>
          {flow.error !== null && (
            <p className="t-body-sm field-error" role="alert">
              {flow.error}
            </p>
          )}
          <div className="settings-dialog-actions">
            <Button variant="secondary" label={t("settings.backup.sheet.cancel")} onClick={controller.close} testID="backup-replace-cancel" />
            <Button
              variant="destructive"
              label={t("settings.backup.replace.confirm")}
              onClick={() => void controller.applyImport("replace")}
              disabled={flow.busy}
              testID="backup-replace-confirm"
            />
          </div>
        </Dialog>
      )}
      {controller !== null && flow.sheet === "suggestions" && (
        <Dialog title={t("settings.backup.suggestions.title")} onClose={controller.close} testID="backup-suggestions">
          <p className="t-body-md settings-hint">{t("settings.backup.suggestions.message")}</p>
          {flow.suggestions.repos.length === 0 && flow.suggestions.modules.length === 0 ? (
            <p className="t-body-md settings-hint">{t("settings.backup.suggestions.empty")}</p>
          ) : (
            <ul className="settings-suggestions">
              {flow.suggestions.repos.map((repo) => {
                const confirmed = flow.confirmedRepos.includes(repo.url);
                return (
                  <li key={repo.url} className="settings-row settings-suggestion">
                    <span className="settings-suggestion-text">
                      <span className="t-body-md settings-row-label">{repo.name}</span>
                      <span className="t-body-sm settings-hint">{repo.url}</span>
                    </span>
                    <Button
                      variant="secondary"
                      label={t(confirmed ? "settings.backup.suggestions.repo.confirmed" : "settings.backup.suggestions.repo.confirm")}
                      disabled={confirmed || flow.busy}
                      onClick={() => void controller.confirmRepo(repo.url)}
                      testID={`backup-repo-${repo.url}`}
                    />
                  </li>
                );
              })}
              {flow.suggestions.modules.map((module) => (
                <li key={module.id} className="settings-row settings-suggestion">
                  <span className="settings-suggestion-text">
                    <span className="t-body-md settings-row-label">{module.id}</span>
                    <span className="t-body-sm settings-hint">
                      {t("sources.module.meta", {
                        kind: module.kinds.map(kindLabel).join(", "),
                        lang: module.lang,
                        version: module.version,
                      })}
                    </span>
                    <span className="t-body-sm settings-hint">{t("settings.backup.suggestions.module.hint")}</span>
                  </span>
                  <Button
                    variant="secondary"
                    label={t("settings.backup.suggestions.module.goSources")}
                    onClick={controller.goToSources}
                    testID={`backup-module-${module.id}`}
                  />
                </li>
              ))}
            </ul>
          )}
          {flow.error !== null && (
            <p className="t-body-sm field-error" role="alert">
              {flow.error === "" ? t("settings.backup.suggestions.repo.failed") : flow.error}
            </p>
          )}
          <div className="settings-dialog-actions">
            <Button variant="secondary" label={t("settings.backup.suggestions.close")} onClick={controller.close} testID="backup-suggestions-close" />
          </div>
        </Dialog>
      )}
      {controller !== null && flow.sheet === "import-error" && (
        <Dialog title={t("settings.backup.importFailed")} onClose={controller.close} testID="backup-error-dialog">
          <p className="t-body-md settings-hint">{flow.error}</p>
          <div className="settings-dialog-actions">
            <Button label={t("actions.close")} onClick={controller.close} testID="backup-error-close" />
          </div>
        </Dialog>
      )}
    </div>
  );
}
