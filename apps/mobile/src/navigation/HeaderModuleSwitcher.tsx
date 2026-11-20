import { useSyncExternalStore } from "react";

import ModulePicker from "../components/ModulePicker";
import { getModuleSwitcher, subscribeModuleSwitcher } from "./moduleSwitcherStore";

/** F88 — selector de módulo de la cabecera; vacío si Aventuras no ha publicado módulos. */
export default function HeaderModuleSwitcher() {
  const switcher = useSyncExternalStore(
    subscribeModuleSwitcher,
    getModuleSwitcher,
    getModuleSwitcher,
  );
  if (switcher === null || switcher.modules.length === 0) return null;
  return (
    <ModulePicker
      modules={switcher.modules}
      selectedId={switcher.selectedId}
      onSelect={switcher.onSelect}
    />
  );
}
