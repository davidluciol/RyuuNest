import { describe, expect, it } from "vitest";

import { capFor, clampCount, decodedBytes, toMB } from "../src/imageBudget.js";

/**
 * T05: presupuesto de imágenes en memoria (SPEC §9). Lógica pura que usa el panel de
 * calibración para decir cuántas imágenes caben en un presupuesto de memoria. Es la
 * parte comprobable del «tope de imágenes»; la medición en el teléfono es manual.
 */

describe("decodedBytes", () => {
  it("calcula los bytes de una imagen decodificada en RGBA8", () => {
    expect(decodedBytes(1440, 3200)).toBe(18_432_000);
    expect(decodedBytes(1, 1)).toBe(4);
  });

  it("no devuelve bytes negativos para dimensiones inválidas", () => {
    expect(decodedBytes(0, 3200)).toBe(0);
    expect(decodedBytes(-10, -10)).toBe(0);
  });
});

describe("toMB", () => {
  it("expresa los bytes en megabytes con un decimal", () => {
    expect(toMB(18_432_000)).toBe(17.6);
    expect(toMB(1_048_576)).toBe(1);
    expect(toMB(0)).toBe(0);
  });
});

describe("capFor", () => {
  it("propone el número de imágenes que cabe en el presupuesto", () => {
    // 1440×3200 RGBA = 18_432_000 bytes ≈ 17.6 MB
    expect(capFor(100, 1440, 3200)).toBe(5); // 100 MB = 104_857_600 B → 5.68
    expect(capFor(176, 1440, 3200)).toBe(10); // 176 MB ≈ 184_549_376 B → 10.01
  });

  it("devuelve 0 si el presupuesto no llega ni a una imagen", () => {
    expect(capFor(10, 1440, 3200)).toBe(0);
    expect(capFor(0, 1440, 3200)).toBe(0);
    expect(capFor(-5, 1440, 3200)).toBe(0);
  });
});

describe("clampCount", () => {
  it("mantiene el contador dentro de los límites del panel", () => {
    expect(clampCount(7, 1, 30)).toBe(7);
    expect(clampCount(0, 1, 30)).toBe(1);
    expect(clampCount(999, 1, 30)).toBe(30);
  });

  it("trunca decimales y trata los no finitos como el límite inferior", () => {
    expect(clampCount(3.9, 1, 30)).toBe(3);
    expect(clampCount(Number.NaN, 1, 30)).toBe(1);
    expect(clampCount(Number.POSITIVE_INFINITY, 1, 30)).toBe(30);
  });
});
