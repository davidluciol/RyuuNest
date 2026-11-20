import { describe, expect, it, vi } from "vitest";

import {
  clearModuleSwitcher,
  getModuleSwitcher,
  publishModuleSwitcher,
  subscribeModuleSwitcher,
} from "../../src/navigation/moduleSwitcherStore";

/** F88 — la pantalla Aventuras publica sus módulos y la cabecera los muestra. */
describe("moduleSwitcherStore", () => {
  it("arranca vacío (la cabecera no muestra selector fuera de Aventuras)", () => {
    clearModuleSwitcher();
    expect(getModuleSwitcher()).toBeNull();
  });

  it("publica módulos, selección y acción, y avisa a los suscritos", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeModuleSwitcher(listener);
    const onSelect = vi.fn();

    publishModuleSwitcher({ modules: [{ id: "a", name: "A" }], selectedId: "a", onSelect });

    expect(getModuleSwitcher()?.selectedId).toBe("a");
    expect(listener).toHaveBeenCalledTimes(1);
    getModuleSwitcher()?.onSelect("b");
    expect(onSelect).toHaveBeenCalledWith("b");

    clearModuleSwitcher();
    expect(getModuleSwitcher()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    publishModuleSwitcher({ modules: [], selectedId: "x", onSelect });
    expect(listener).toHaveBeenCalledTimes(2);
    clearModuleSwitcher();
  });
});
