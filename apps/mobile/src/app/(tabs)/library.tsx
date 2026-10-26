import { StyleSheet, View } from "react-native";
import { dragonNightColors } from "@ryuunest/ui-tokens";

import ErrorState from "../../components/ErrorState";
import { t } from "../../i18n";
import LibraryScreen from "../../screens/library/LibraryScreen";
import { useLibraryData } from "../../screens/library/useLibraryData";

export default function LibraryRoute() {
  const library = useLibraryData();

  if (library.status === "ready") {
    return <LibraryScreen data={library.data} />;
  }

  return (
    <View style={styles.screen}>
      {library.status === "error" ? (
        <ErrorState
          title={t("state.error.library.title")}
          message={t("state.error.library.message")}
          retryLabel={t("actions.retry")}
          onRetry={library.reload}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", backgroundColor: dragonNightColors.bg },
});
