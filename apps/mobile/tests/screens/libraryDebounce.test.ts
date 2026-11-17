import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDebouncer } from "../../src/screens/library/debounce";

/** F55 — la búsqueda espera a que se deje de escribir (debounce corto) antes de filtrar. */
describe("createDebouncer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("solo emite el último valor tras la pausa", () => {
    const emitted: string[] = [];
    const debounced = createDebouncer<string>(150, (value) => emitted.push(value));

    debounced.push("d");
    vi.advanceTimersByTime(100);
    debounced.push("dr");
    vi.advanceTimersByTime(100);
    debounced.push("dra");
    expect(emitted).toEqual([]);
    vi.advanceTimersByTime(150);

    expect(emitted).toEqual(["dra"]);
  });

  it("cancel descarta lo pendiente", () => {
    const emitted: string[] = [];
    const debounced = createDebouncer<string>(150, (value) => emitted.push(value));

    debounced.push("x");
    debounced.cancel();
    vi.advanceTimersByTime(500);

    expect(emitted).toEqual([]);
  });
});
