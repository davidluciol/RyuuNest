import { Switch as NativeSwitch, View } from "react-native";

import { switchColors } from "./switchStyles";

/**
 * F16b — interruptor (Regla 3): el control de las filas de ajustes. Colores
 * desde tokens; React Native atenúa el control deshabilitado. Se envuelve en
 * un `View` con rol `switch` para que la etiqueta de accesibilidad y el estado
 * (marcado/deshabilitado) se expongan igual en móvil y web.
 */

export interface SwitchProps {
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
  /** Etiqueta de accesibilidad del interruptor. */
  accessibilityLabel: string;
  /** Marcador estable para las pruebas de interfaz. */
  testID?: string;
}

export default function Switch({
  value,
  disabled = false,
  onValueChange,
  accessibilityLabel,
  testID,
}: SwitchProps) {
  const colors = switchColors();
  return (
    <View
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      testID={testID}
    >
      <NativeSwitch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={colors.track}
        thumbColor={colors.thumb}
        ios_backgroundColor={colors.iosBackground}
      />
    </View>
  );
}
