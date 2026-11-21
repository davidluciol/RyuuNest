import { useEffect, useState } from "react";
import { applyTheme, defaultTheme, getThemeVersion } from "@ryuunest/ui-tokens";

import { resolveSettingsService } from "../screens/settings/useSettingsData";

/**
 * F90 — aplica el tema guardado al arrancar y al cambiarlo en Ajustes. Devuelve
 * la versión del tema: la raíz la usa de `key` para repintar todo al instante.
 * Si los ajustes no abren, la app sigue con Dragon Night.
 */
export function useAppTheme(): { ready: boolean; version: number } {
  const [state, setState] = useState({ ready: false, version: getThemeVersion() });

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};
    let appliedId = "";

    const sync = async (service: Awaited<ReturnType<typeof resolveSettingsService>>) => {
      const { activeThemeId, themes } = await service.load();
      if (cancelled) return;
      const theme = themes.find((t) => t.id === activeThemeId) ?? defaultTheme;
      // Un tema importado que se edita conserva el id: se compara también el contenido.
      const signature = `${theme.id}:${Object.values(theme.colors).join()}`;
      if (signature !== appliedId) {
        appliedId = signature;
        applyTheme(theme);
      }
      setState({ ready: true, version: getThemeVersion() });
    };

    resolveSettingsService()
      .then((service) => {
        if (cancelled) return;
        unsubscribe = service.subscribe(() => void sync(service).catch(() => {}));
        return sync(service);
      })
      .catch((error: unknown) => {
        console.warn("No se pudo cargar el tema; se usa Dragon Night:", error);
        if (!cancelled) setState((s) => ({ ...s, ready: true }));
      });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return state;
}
