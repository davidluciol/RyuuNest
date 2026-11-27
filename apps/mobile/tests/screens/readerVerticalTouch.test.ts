import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * P-193 — en Android, un Pressable que **envuelve** un ScrollView le roba el arrastre: si JS le
 * concede el respondedor antes de que el ScrollView pase el umbral de arrastre, su vista nativa
 * intercepta los toques (JSResponderHandler) y la lista no se mueve. En webtoon, tocar y mantener
 * se atienden **dentro** del ScrollView, que sí puede quitarle el gesto a un hijo.
 */
const reader = path.resolve(import.meta.dirname, "../..", "src/screens/reader");
const source = (file: string) => readFileSync(path.join(reader, file), "utf8");

describe("toques del lector vertical", () => {
  it("el lienzo no responde a toques en vertical", () => {
    expect(source("ReaderScreen.tsx")).toMatch(/testID="reader-canvas"\s+disabled=\{mode === "vertical"\}/);
  });

  it("la lista vertical atiende tocar y mantener desde dentro del ScrollView", () => {
    const vertical = source("ReaderVertical.tsx");
    const scroll = vertical.indexOf("<ScrollView");
    const pressable = vertical.indexOf("<FocusPressable");
    expect(scroll).toBeGreaterThan(-1);
    expect(pressable).toBeGreaterThan(scroll);
    expect(vertical).toContain("onLongPress={onLongPress}");
  });
});
