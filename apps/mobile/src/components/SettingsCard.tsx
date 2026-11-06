import { Children, Fragment, type ReactNode } from "react";
import { View } from "react-native";

import { settingsCardDividerStyle, settingsCardStyle } from "./cardStyles";

/**
 * F34.2 — tarjeta de una sección de ajustes: contiene sus filas sobre `surface`
 * con borde y una línea separadora entre ellas (`ajustes_pantalla/screen.png`).
 */

export interface SettingsCardProps {
  children: ReactNode;
  testID?: string;
}

export default function SettingsCard({ children, testID }: SettingsCardProps) {
  const rows = Children.toArray(children);
  return (
    <View style={settingsCardStyle()} testID={testID}>
      {rows.map((row, index) => (
        <Fragment key={index}>
          {index > 0 ? <View style={settingsCardDividerStyle()} /> : null}
          {row}
        </Fragment>
      ))}
    </View>
  );
}
