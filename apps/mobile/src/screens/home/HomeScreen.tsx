import { useWindowDimensions, ScrollView, StyleSheet, View } from "react-native";
import { Flame, History, Gem } from "../../icons";
import {
  dragonNightColors,
  layoutForWidth,
  spacing,
} from "@ryuunest/ui-tokens";

import ContinueCard from "../../components/ContinueCard";
import EmptyState from "../../components/EmptyState";
import FolderCard from "../../components/FolderCard";
import RecentCard from "../../components/RecentCard";
import SectionHeader from "../../components/SectionHeader";
import { t } from "../../i18n";

import { EMPTY_HOME_DATA, type HomeData } from "./homeFixtures";

/**
 * F13 — pantalla Inicio (RF-14, RF-33, RF-41, SPEC §11.5): máximo 4
 * secciones — Continuar (hero), Lecturas Recientes (carrusel) y Tesoros
 * Guardados (carpetas). Sin «Novedades de Portales» ni tarjeta de estado
 * del nido (fuera de la v1, anotado en DIFFS.md). Estado vacío cuando no
 * hay favoritos ni progreso.
 */

const colors = dragonNightColors;

export interface HomeScreenProps {
  /** Datos de la pantalla; por defecto, el estado vacío. */
  data?: HomeData;
  /** Callback al pulsar «Continuar». */
  onContinue?: (seriesId: string) => void;
  /** Callback al pulsar una tarjeta reciente. */
  onRecentPress?: (seriesId: string) => void;
  /** Callback al pulsar una carpeta. */
  onFolderPress?: (folderId: string) => void;
  /** Callback de la acción «Ver todas» de recientes. */
  onSeeAllRecent?: () => void;
  /** Callback de la acción «Ver todas» de carpetas. */
  onSeeAllFolders?: () => void;
  /** Callback del estado vacío (añadir repositorio). */
  onEmptyAction?: () => void;
}

export default function HomeScreen({
  data = EMPTY_HOME_DATA,
  onContinue,
  onRecentPress,
  onFolderPress,
  onSeeAllRecent,
  onSeeAllFolders,
  onEmptyAction,
}: HomeScreenProps) {
  const { width } = useWindowDimensions();
  const layout = layoutForWidth(width);

  const hasContent =
    data.continueReading !== null || data.recent.length > 0 || data.folders.length > 0;

  if (!hasContent) {
    return (
      <View style={styles.emptyWrap}>
        <EmptyState
          title={t("state.empty.home.title")}
          message={t("state.empty.home.message")}
          actionLabel={t("actions.addRepository")}
          onAction={onEmptyAction}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingHorizontal: layout.margin, gap: layout.gap * 2 },
      ]}
    >
      {data.continueReading ? (
        <View style={styles.section}>
          <SectionHeader
            title={t("home.section.continue")}
            icon={Flame}
            actionLabel={t("home.action.resume")}
            onAction={() => onContinue?.(data.continueReading!.seriesId)}
          />
          <ContinueCard
            kind={data.continueReading.kind}
            title={data.continueReading.title}
            meta={data.continueReading.meta}
            chapter={data.continueReading.chapterLabel}
            pageIndex={data.continueReading.pageIndex}
            pageTotal={data.continueReading.pageTotal}
            actionLabel={t("home.action.continueChapter", {
              number: data.continueReading.chapterNumber,
            })}
            onPress={() => onContinue?.(data.continueReading!.seriesId)}
          />
        </View>
      ) : null}

      {data.recent.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader
            title={t("home.section.recent")}
            icon={History}
            actionLabel={t("home.action.seeAll")}
            onAction={onSeeAllRecent}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: layout.gap }}
          >
            {data.recent.map((item) => (
              <RecentCard
                key={item.seriesId}
                kind={item.kind}
                title={item.title}
                chapter={item.chapterLabel}
                progress={item.pageTotal > 0 ? item.pageIndex / item.pageTotal : 0}
                onPress={() => onRecentPress?.(item.seriesId)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {data.folders.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader
            title={t("home.section.folders")}
            icon={Gem}
            actionLabel={t("home.action.seeAll")}
            onAction={onSeeAllFolders}
          />
          <View style={[styles.folderGrid, { gap: layout.gap }]}>
            {data.folders.map((folder) => (
              <FolderCard
                key={folder.id}
                name={folder.name}
                description={folder.description}
                count={folder.count}
                onPress={() => onFolderPress?.(folder.id)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingVertical: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  folderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
