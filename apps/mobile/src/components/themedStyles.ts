import { getThemeVersion } from "@ryuunest/ui-tokens";
import { StyleSheet } from "react-native";

type Named<T> = { [K in keyof T]: StyleSheet.NamedStyles<T>[K] };

/**
 * F90 — `StyleSheet.create` que se recalcula al cambiar de tema. Devuelve un
 * proxy: cada lectura (`styles.card`) comprueba la versión del tema y rehace la
 * hoja solo si cambió, así el cambio es inmediato y sin coste en reposo.
 */
export function themedStyles<T extends Named<T>>(factory: () => T): T {
  let cached: T | undefined;
  let version = -1;
  return new Proxy({} as T, {
    get(_target, key) {
      if (cached === undefined || version !== getThemeVersion()) {
        cached = StyleSheet.create(factory());
        version = getThemeVersion();
      }
      return cached[key as keyof T];
    },
  });
}
