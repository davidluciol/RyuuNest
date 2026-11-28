import { Redirect, useLocalSearchParams } from "expo-router";

import { destinationRoutes } from "../navigation/routes";
import { ADD_REPO_PARAM, addRepoLinkUrl } from "../screens/sources/addRepoLink";

/**
 * G5 — `ryuunest://add-repo?url=…` llega aquí. Solo redirige a Portales con la URL; allí se
 * abre la hoja «Añadir repositorio» rellena y el usuario decide (AC-8: nada se instala solo).
 */
export default function AddRepoLinkRoute() {
  const { url } = useLocalSearchParams();
  return (
    <Redirect
      href={{
        pathname: destinationRoutes.sources,
        params: { [ADD_REPO_PARAM]: addRepoLinkUrl(url) ?? "" },
      }}
    />
  );
}
