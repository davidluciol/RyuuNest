import { useSyncExternalStore } from "react";

import ReportSheet from "../../components/ReportSheet";
import { appReport } from "../../data/appReport";

/** F103 — capa global de «Mandar reporte», montada una vez en la raíz (como F100). */
export default function ReportHost() {
  const state = useSyncExternalStore(appReport.subscribe, appReport.getState);
  if (state.phase !== "open") return null;
  return (
    <ReportSheet
      visible
      preview={appReport.preview()}
      details={state.details}
      onDetailsChange={appReport.setDetails}
      includeLog={state.includeLog}
      onIncludeLogChange={appReport.setIncludeLog}
      sending={state.sending}
      sendFailed={state.sendFailed}
      onSend={(channel) => void appReport.send(channel)}
      onCopy={() => void appReport.copy()}
      copied={state.copied}
      onSearchExisting={() => void appReport.searchExisting()}
      onClose={appReport.close}
    />
  );
}
