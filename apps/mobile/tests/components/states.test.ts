import { describe, expect, it } from "vitest";

import {
  detailBoxStyle,
  detailLines,
  type ErrorDetail,
  messageStyle,
  stateColors,
  stateStyle,
  titleStyle,
} from "../../src/components/stateStyles";

/**
 * F08 — estados vacíos, de error y de carga (SPEC §11.12): dragón pequeño
 * (carga breve, 48) o mediano (vacío/error, 96), título en Manrope, acción en
 * `accent` y detalle técnico desplegable en el error (módulo, URL, código,
 * selector). Sin tarjetas-mascota (T4).
 */
describe("stateStyle (tamaños de §11.12)", () => {
  it("carga breve lleva el dragón pequeño (48) y vacío/error el mediano (96)", () => {
    expect(stateStyle("sm").dragonSize).toBe(48);
    expect(stateStyle("md").dragonSize).toBe(96);
  });

  it("espaciado desde tokens: separación 16 y relleno 32", () => {
    expect(stateStyle("md")).toMatchObject({ gap: 16, padding: 32 });
  });
});

describe("stateColors y tipografía", () => {
  it("título en texto principal, mensaje atenuado, acción accent, error en error", () => {
    expect(stateColors()).toEqual({
      dragon: "#9BA5B5",
      title: "#F2F0EA",
      message: "#9BA5B5",
      action: "#35C98A",
      error: "#F06A6A",
    });
  });

  it("el título es Manrope y el mensaje Inter", () => {
    expect(titleStyle().fontFamily).toBe("Manrope");
    expect(messageStyle().fontFamily).toBe("Inter");
  });
});

describe("detalle técnico del error (desplegable)", () => {
  it("lista solo los campos presentes, en orden módulo, URL, código, selector", () => {
    const detail: ErrorDetail = {
      code: "PARSE",
      module: "m-dragon",
      selector: ".lista .item",
      url: "https://ejemplo.test/listado?page=2",
    };
    expect(detailLines(detail)).toEqual([
      "módulo: m-dragon",
      "URL: https://ejemplo.test/listado?page=2",
      "código: PARSE",
      "selector: .lista .item",
    ]);
  });

  it("sin datos no lista nada (y nunca inventa campos)", () => {
    expect(detailLines({})).toEqual([]);
    expect(detailLines({ code: "NETWORK" })).toEqual(["código: NETWORK"]);
  });

  it("la caja del detalle usa niveles de superficie, sin sombra (RNF-12)", () => {
    expect(detailBoxStyle()).toMatchObject({
      borderWidth: 1,
      borderColor: "#263147",
      borderRadius: 8,
      backgroundColor: "#141923",
      shadowOpacity: 0,
      elevation: 0,
    });
  });
});
