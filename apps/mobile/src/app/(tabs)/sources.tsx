import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ADD_REPO_PARAM, addRepoLinkUrl } from "../../screens/sources/addRepoLink";
import SourcesScreen from "../../screens/sources/SourcesScreen";
import { useSourcesData } from "../../screens/sources/useSourcesData";

/**
 * F16 — ruta Fuentes: solo conecta el estado (useSourcesData) con la
 * pantalla. El título de la sección lo pinta la cabecera del shell (F11).
 */
export default function SourcesRoute() {
  const { view, flow, notice, noticeKind, controller, retry, recommended, refreshRecommended } =
    useSourcesData();

  // G5: el enlace `ryuunest://add-repo` llega con la URL en el parámetro; solo abre la hoja.
  const params = useLocalSearchParams();
  const router = useRouter();
  const linked = params[ADD_REPO_PARAM];
  useEffect(() => {
    if (linked === undefined || controller === null) return;
    controller.openAddRepo(addRepoLinkUrl(linked) ?? undefined);
    router.setParams({ [ADD_REPO_PARAM]: undefined });
  }, [linked, controller, router]);

  return (
    <SourcesScreen
      view={view}
      flow={flow}
      controller={controller}
      notice={notice}
      noticeKind={noticeKind}
      onRetry={retry}
      recommended={recommended}
      onRefreshRecommended={refreshRecommended}
    />
  );
}
