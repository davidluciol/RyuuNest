import { Text, View } from "react-native";
import { activeColors, spacing, typography } from "@ryuunest/ui-tokens";

import Button from "../../components/Button";
import SheetModal from "../../components/SheetModal";
import { textStyle } from "../../components/textStyle";
import { t } from "../../i18n";
import { themedStyles } from "../../components/themedStyles";

/**
 * F45 — aviso de primera vez al elegir un módulo NSFW: dice qué significa la
 * sigla y deja volver sin marcarlo como visto.
 */

const colors = activeColors;

export interface NsfwNoticeSheetProps {
  moduleName: string;
  /** #183: el sitio a veces pide resolver un reto anti-bot; se avisa aquí también. */
  antiBot?: boolean;
  onContinue: () => void;
  onBack: () => void;
}

export default function NsfwNoticeSheet({
  moduleName,
  antiBot = false,
  onContinue,
  onBack,
}: NsfwNoticeSheetProps) {
  return (
    <SheetModal visible title={t("nsfw.first.title")} onClose={onBack} testID="sheet-nsfw-notice">
      <Text style={styles.message}>{t("nsfw.first.message", { name: moduleName })}</Text>
      {antiBot ? <Text style={styles.message}>{t("sources.antiBotNote")}</Text> : null}
      <View style={styles.actions}>
        <Button variant="secondary" label={t("nsfw.first.back")} onPress={onBack} />
        <Button label={t("nsfw.first.continue")} onPress={onContinue} />
      </View>
    </SheetModal>
  );
}

const styles = themedStyles(() => ({
  message: { ...textStyle(typography.bodyMd), color: colors.textPrimary },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
}));
