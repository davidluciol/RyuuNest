import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { dragonNightColors } from "@ryuunest/ui-tokens";

import ErrorState from "../../components/ErrorState";
import SafeScreen from "../../components/SafeScreen";
import { t } from "../../i18n";
import { openResume } from "../../navigation/openResume";
import { destinationRoutes } from "../../navigation/routes";
import ListScreen from "../../screens/list/ListScreen";
import { listSourceOf, type ListSource } from "../../screens/list/listSources";
import { useListData } from "../../screens/list/useListData";
import { useSettingsPreferences } from "../../screens/settings/useSettingsData";

/** F82 — ruta en pila `/list/<source>` (fuera de pestañas): «atrás» vuelve a Guarida. */
export default function ListRoute() {
  const { source } = useLocalSearchParams<{ source: string }>();
  const found = listSourceOf(source);
  return (
    <SafeScreen>{found === null ? <UnknownList /> : <ListContent source={found} />}</SafeScreen>
  );
}

function UnknownList() {
  return (
    <View style={styles.center}>
      <ErrorState
        title={t("state.error.home.title")}
        message={t("state.error.home.message")}
        retryLabel={t("actions.back")}
        onRetry={goBack}
      />
    </View>
  );
}

function goBack(): void {
  if (router.canGoBack()) router.back();
  else router.replace(destinationRoutes.home);
}

function ListContent({ source }: { source: ListSource }) {
  const settings = useSettingsPreferences();
  const list = useListData(source, settings.nsfwVisible);

  if (list.status === "error") {
    return (
      <View style={styles.center}>
        <ErrorState
          title={t("state.error.home.title")}
          message={t("state.error.home.message")}
          retryLabel={t("actions.retry")}
          onRetry={list.reload}
        />
      </View>
    );
  }
  if (list.status === "loading") return <View style={styles.center} />;

  return (
    <ListScreen
      title={t(source.titleKey)}
      items={list.items}
      emptyTitle={t(source.emptyKey)}
      emptyActionLabel={t("actions.addRepository")}
      onBack={goBack}
      onItemPress={openResume}
      onEmptyAction={() => router.push(destinationRoutes.sources)}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", backgroundColor: dragonNightColors.bg },
});
