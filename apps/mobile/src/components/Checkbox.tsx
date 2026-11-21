import FocusPressable from "./FocusPressable";
import { View } from "react-native";
import { Check } from "lucide-react-native";
import { touchTarget, activeColors } from "@ryuunest/ui-tokens";

import { checkboxStyle, radioStyle } from "./fieldStyles";
import { themedStyles } from "./themedStyles";

/**
 * F06 — casilla y radio (SPEC §11.10): 20×20, borde 1,5 px `border`; marcado
 * con relleno `accent` y glifo `bg`. El área táctil llega a 48 dp con
 * `hitSlop` (RNF-7). Props tipadas; todo desde `ui-tokens`.
 */

const colors = activeColors;

export interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  /** Círculo completo en vez de casilla (radio). */
  radio?: boolean;
}

export default function Checkbox({ checked = false, onChange, radio = false }: CheckboxProps) {
  const style = radio ? radioStyle(checked) : checkboxStyle(checked);
  return (
    <FocusPressable
      accessibilityRole={radio ? "radio" : "checkbox"}
      accessibilityState={{ checked }}
      onPress={() => onChange?.(!checked)}
      hitSlop={(touchTarget.min - 20) / 2} // 20 visible → 48 táctil
    >
      <View style={[style, styles.center]}>
        {checked ? <Check size={14} color={colors.bg} strokeWidth={3} /> : null}
      </View>
    </FocusPressable>
  );
}

const styles = themedStyles(() => ({
  center: { alignItems: "center", justifyContent: "center" },
}));
