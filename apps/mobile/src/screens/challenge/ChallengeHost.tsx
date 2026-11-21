import { useSyncExternalStore } from "react";

import ConfirmSheet from "../../components/ConfirmSheet";
import { appChallenge } from "../../data/appChallenge";
import { t } from "../../i18n";
import ChallengeBrowser from "./ChallengeBrowser";

/**
 * F100 — capa global de la verificación de Cloudflare: la hoja de confirmación y,
 * solo si el usuario acepta, el navegador visible. Sin animación: también se abre
 * desde el lector (Regla 4).
 */
export default function ChallengeHost() {
  const state = useSyncExternalStore(appChallenge.subscribe, appChallenge.getState);

  if (state.phase === "confirm") {
    return (
      <ConfirmSheet
        visible
        animated={false}
        title={t("challenge.confirm.title")}
        message={t("challenge.confirm.message", { host: state.host })}
        subject={state.host}
        confirmLabel={t("challenge.confirm.action")}
        confirmIcon={null}
        onConfirm={() => appChallenge.answer(true)}
        onCancel={() => appChallenge.answer(false)}
        testID="sheet-challenge-confirm"
        confirmTestID="challenge-confirm"
        cancelTestID="challenge-cancel"
      />
    );
  }

  if (state.phase === "browse") {
    return (
      <ChallengeBrowser
        url={state.url}
        host={state.host}
        domains={state.domains}
        onFinish={appChallenge.finish}
      />
    );
  }

  return null;
}
