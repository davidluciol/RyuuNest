import { describe, expect, it } from "vitest";

import type { Chapter } from "@ryuunest/core";

import { readerChapters, readingOrder } from "../../src/reader/readingOrder";

/**
 * F18 — `ReaderState` pide los capítulos «en orden de lectura» (del primero al último), pero
 * `SeriesDetails.chapters` llega «más nuevo primero» según el contrato (y el sitio falso lo
 * entrega ascendente). El orden se decide por el número de capítulo, no por quien llame.
 */

function chapter(id: string, number: number | undefined, groups: string[] = ["r-1"]): Chapter {
  return {
    id,
    title: `Título ${id}`,
    ...(number === undefined ? {} : { number }),
    releases: groups.map((group) => ({ id: group, group: `Grupo ${group}` })),
  };
}

describe("readingOrder", () => {
  it("ordena de menor a mayor número, venga como venga", () => {
    const newestFirst = [chapter("c3", 3), chapter("c2", 2), chapter("c1", 1)];
    const oldestFirst = [chapter("c1", 1), chapter("c2", 2), chapter("c3", 3)];
    const shuffled = [chapter("c2", 2), chapter("c3", 3), chapter("c1", 1)];

    for (const input of [newestFirst, oldestFirst, shuffled]) {
      expect(readingOrder(input).map((c) => c.id)).toEqual(["c1", "c2", "c3"]);
    }
  });

  it("respeta los decimales (capítulo 10.5 entre el 10 y el 11)", () => {
    const input = [chapter("c11", 11), chapter("c10-5", 10.5), chapter("c10", 10)];

    expect(readingOrder(input).map((c) => c.id)).toEqual(["c10", "c10-5", "c11"]);
  });

  it("sin números en todos los capítulos, invierte la lista (el contrato la entrega más nuevo primero)", () => {
    const input = [chapter("nuevo", undefined), chapter("medio", 5), chapter("viejo", undefined)];

    expect(readingOrder(input).map((c) => c.id)).toEqual(["viejo", "medio", "nuevo"]);
  });

  it("no modifica la lista original", () => {
    const input = [chapter("c2", 2), chapter("c1", 1)];
    readingOrder(input);

    expect(input.map((c) => c.id)).toEqual(["c2", "c1"]);
  });
});

describe("readerChapters", () => {
  const chapters = [chapter("c1", 1, ["r-a", "r-b"]), chapter("c2", 2, ["r-a"])];

  it("convierte cada capítulo con su título y la edición preferida (o la primera)", () => {
    expect(readerChapters(chapters, "r-b")).toEqual([
      { chapterId: "c1", title: "Título c1", releaseId: "r-b", pageTotal: null },
      { chapterId: "c2", title: "Título c2", releaseId: "r-a", pageTotal: null },
    ]);
  });

  it("sin preferencia usa la primera edición de cada capítulo", () => {
    expect(readerChapters(chapters, null).map((c) => c.releaseId)).toEqual(["r-a", "r-a"]);
  });
});
