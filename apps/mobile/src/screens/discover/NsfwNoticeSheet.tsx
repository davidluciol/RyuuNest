import { StyleSheet, Text, View } from "react-native";
import { dragonNightColors, spacing, typography } from "@ryuunest/ui-tokens";

import Button from "../../components/Button";
import SheetModal from "../../components/SheetModal";
import { textStyle } from "../../components/textStyle";
import { t } from "../../i18n";

/**
 * F45 — aviso de primera vez al elegir un módulo NSFW: dice qué significa la
 * sigla y deja volver sin marcarlo como visto.
 */

const colors = dragonNightColors;

export interface NsfwNoticeSheetProps {
  moduleName: string;
  onContinue: () => void;
  onBack: () => void;
}

export default function NsfwNoticeSheet({ moduleName, onContinue, onBack }: NsfwNoticeSheetProps) {
  return (
    <SheetModal visible title={t("nsfw.first.title")} onClose={onBack} testID="sheet-nsfw-notice">
      <Text style={styles.message}>{t("nsfw.first.message", { name: moduleName })}</Text>
      <View style={styles.actions}>
        <Button variant="secondary" label={t("nsfw.first.back")} onPress={onBack} />
        <Button label={t("nsfw.first.continue")} onPress={onContinue} />
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  message: { ...textStyle(typography.bodyMd), color: colors.textPrimary },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
});
