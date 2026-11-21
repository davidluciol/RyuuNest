import { ModuleError } from "@ryuunest/core";
import {
  dragonNight,
  themes as builtInThemes,
  THEME_SCHEMA_VERSION,
  validateTheme,
  type Theme,
} from "@ryuunest/ui-tokens";

/**
 * F90/F91 — temas en Ajustes: el activo y los importados se guardan en `setting`
 * (clave/valor). La lógica es la misma con SQLite y en memoria; solo cambia el
 * almacén. Un tema importado nunca es código: es un JSON validado por `validateTheme`.
 */

export const ACTIVE_THEME_SETTING = "settings.theme";
export const IMPORTED_THEMES_SETTING = "settings.themes.imported";

/** Tema del selector: los integrados no se pueden borrar. */
export interface ThemeEntry extends Theme {
  readonly builtIn: boolean;
}

const BUILT_IN: readonly Theme[] = Object.values(builtInThemes);

export interface ThemeStore {
  read(key: string): Promise<string | undefined>;
  write(key: string, value: string): Promise<void>;
}

/** Lee y valida el JSON de un tema; el error lista los motivos en lenguaje claro. */
export function parseThemeFile(text: string): Theme {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ModuleError("PARSE", "El archivo no es un JSON válido");
  }
  const result = validateTheme(raw);
  if (!result.ok) throw new ModuleError("PARSE", `Tema no válido: ${result.errors.join("; ")}`);
  return result.theme;
}

function readImported(raw: string | undefined): Theme[] {
  if (raw === undefined) return [];
  try {
    const list: unknown = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    // Un tema guardado que ya no valida se ignora en vez de romper la app.
    return list.flatMap((item) => {
      const result = validateTheme(item);
      return result.ok ? [result.theme] : [];
    });
  } catch {
    return [];
  }
}

const withVersion = (theme: Theme) => ({ schemaVersion: THEME_SCHEMA_VERSION, ...theme });

export function createThemeSettings(store: ThemeStore) {
  const imported = async () => readImported(await store.read(IMPORTED_THEMES_SETTING));
  const saveImported = (list: Theme[]) =>
    store.write(IMPORTED_THEMES_SETTING, JSON.stringify(list.map(withVersion)));

  return {
    async load(): Promise<{ activeThemeId: string; themes: ThemeEntry[] }> {
      const themes: ThemeEntry[] = [
        ...BUILT_IN.map((t) => ({ ...t, builtIn: true })),
        ...(await imported()).map((t) => ({ ...t, builtIn: false })),
      ];
      const stored = await store.read(ACTIVE_THEME_SETTING);
      const activeThemeId = themes.some((t) => t.id === stored)
        ? (stored as string)
        : dragonNight.id;
      return { activeThemeId, themes };
    },

    async setActive(id: string): Promise<void> {
      const { themes } = await this.load();
      if (!themes.some((t) => t.id === id))
        throw new ModuleError("NOT_FOUND", `No existe el tema ${id}`);
      await store.write(ACTIVE_THEME_SETTING, id);
    },

    async import(text: string): Promise<void> {
      const theme = parseThemeFile(text);
      const { themes } = await this.load();
      if (themes.some((t) => t.id === theme.id)) {
        throw new ModuleError("PARSE", `Ya existe un tema con el id ${theme.id}`);
      }
      await saveImported([...(await imported()), theme]);
    },

    async remove(id: string): Promise<void> {
      const list = await imported();
      if (!list.some((t) => t.id === id)) {
        throw new ModuleError("NOT_FOUND", `No se puede borrar el tema ${id}`);
      }
      await saveImported(list.filter((t) => t.id !== id));
      if ((await store.read(ACTIVE_THEME_SETTING)) === id) {
        await store.write(ACTIVE_THEME_SETTING, dragonNight.id);
      }
    },
  };
}
