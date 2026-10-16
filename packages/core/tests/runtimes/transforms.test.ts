import { describe, expect, it } from "vitest";

import { ModuleError } from "../../src/contract/errors";
import {
  applyTransforms,
  joinValues,
  type TransformContext,
  type TransformSpec,
} from "../../src/runtimes/transforms";

/**
 * Transformaciones del módulo declarativo (SPEC §6.6).
 *
 * Son funciones puras: no tocan red ni HTML. `absoluteUrl` y `path` reciben una
 * URL (posiblemente relativa) y la interpretan; `path` devuelve el último segmento
 * de la ruta (decisión P-50), que es el `id` estable de una serie.
 */

const context: TransformContext = { baseUrl: "https://sitio-html.test" };

function run(value: string, spec: TransformSpec): string {
  return applyTransforms(value, [spec], context);
}

describe("transforms · trim", () => {
  it("quita los espacios de los extremos", () => {
    expect(run("  El dragón de ceniza \n", "trim")).toBe("El dragón de ceniza");
  });
});

describe("transforms · path (último segmento)", () => {
  it("devuelve el último segmento de una ruta relativa", () => {
    expect(run("/serie/dragon-de-ceniza", "path")).toBe("dragon-de-ceniza");
  });

  it("ignora la consulta y el ancla de una URL absoluta", () => {
    expect(run("https://sitio-html.test/serie/dragon-de-ceniza?page=2#top", "path")).toBe(
      "dragon-de-ceniza",
    );
  });

  it("ignora una barra final", () => {
    expect(run("/serie/guardiana-del-nido/", "path")).toBe("guardiana-del-nido");
  });

  it("devuelve el valor tal cual si no hay ninguna barra", () => {
    expect(run("draco-de-jade", "path")).toBe("draco-de-jade");
  });

  it("devuelve cadena vacía si no hay valor", () => {
    expect(run("", "path")).toBe("");
  });
});

describe("transforms · absoluteUrl", () => {
  it("resuelve una ruta relativa contra la base", () => {
    expect(run("/img/x.svg", "absoluteUrl")).toBe("https://sitio-html.test/img/x.svg");
  });

  it("resuelve una ruta relativa sin barra inicial", () => {
    expect(
      applyTransforms("img/x.svg", ["absoluteUrl"], { baseUrl: "https://sitio-html.test/serie/" }),
    ).toBe("https://sitio-html.test/serie/img/x.svg");
  });

  it("deja intacta una URL absoluta", () => {
    expect(run("https://otro.test/a.svg", "absoluteUrl")).toBe("https://otro.test/a.svg");
  });
});

describe("transforms · regex", () => {
  it("devuelve el primer grupo de captura", () => {
    expect(run("url('/img/a.png')", ["regex", "url\\(['\"]?(.*?)['\"]?\\)"])).toBe("/img/a.png");
  });

  it("devuelve la coincidencia entera si no hay grupo", () => {
    expect(run("capítulo 12", ["regex", "\\d+"])).toBe("12");
  });

  it("devuelve cadena vacía si no hay coincidencia", () => {
    expect(run("sin url", ["regex", "url\\((.*)\\)"])).toBe("");
  });
});

describe("transforms · number", () => {
  it("extrae el primer número", () => {
    expect(run("Capítulo 12", "number")).toBe("12");
  });

  it("admite decimales y signo", () => {
    expect(run("★ -8.4", "number")).toBe("-8.4");
  });

  it("devuelve cadena vacía si no hay número", () => {
    expect(run("sin número", "number")).toBe("");
  });
});

describe("transforms · replace", () => {
  it("sustituye todas las coincidencias de la expresión regular", () => {
    expect(run("mundo mundo", ["replace", "mundo", "dragón"])).toBe("dragón dragón");
  });
});

describe("transforms · cadena", () => {
  it("aplica las transformaciones en orden", () => {
    expect(run("  /serie/x?p=1  ", "trim")).toBe("/serie/x?p=1");
    expect(applyTransforms("  /serie/x?p=1  ", ["trim", "path"], context)).toBe("x");
  });

  it("no hace nada sin transformaciones", () => {
    expect(applyTransforms("x", undefined, context)).toBe("x");
  });

  it("rechaza una transformación desconocida con un ModuleError", () => {
    expect(() => applyTransforms("x", ["recortar" as TransformSpec], context)).toThrow(ModuleError);
  });

  it("rechaza `join` dentro de una transformación de texto", () => {
    expect(() => applyTransforms("x", [["join", ", "]], context)).toThrow(ModuleError);
  });
});

describe("transforms · join", () => {
  it("une los valores no vacíos con el separador", () => {
    expect(joinValues(["Fantasía", "", "Aventura"], ", ")).toBe("Fantasía, Aventura");
  });

  it("devuelve cadena vacía si no hay valores", () => {
    expect(joinValues([], ", ")).toBe("");
  });
});
