import { describe, expect, it } from "vitest";

import { ModuleError } from "../../src/contract/errors";
import type { Host, ModuleApi } from "../../src/contract/types";
import { FakeScriptLoader } from "../../src/ports/fakes";
import { toModuleError } from "../../src/runtimes/errorMapping";
import { ScriptRuntime } from "../../src/runtimes/ScriptRuntime";

/** Lo que crea un módulo `.js` suelto, que no puede importar `ModuleError`. */
function shapedError(
  code: unknown,
  message: string,
  details?: unknown,
  name: string = "ModuleError",
): Error {
  return Object.assign(new Error(message), {
    name,
    code,
    ...(details === undefined ? {} : { details }),
  });
}

const noopHost = {} as Host;

describe("errorMapping · errores tipados por forma (T31)", () => {
  it("convierte un error con name ModuleError y code válido en un ModuleError real", () => {
    const error = toModuleError(
      shapedError("NOT_FOUND", "no existe", { url: "https://x.com/a", status: 404 }),
    );

    expect(error).toBeInstanceOf(ModuleError);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toBe("no existe");
    expect(error.details).toEqual({ url: "https://x.com/a", status: 404 });
  });

  it("acepta un error sin detalles", () => {
    const error = toModuleError(shapedError("PARSE", "selector roto"));

    expect(error.code).toBe("PARSE");
    expect(error.details).toBeUndefined();
  });

  it("descarta los detalles desconocidos o de tipo incorrecto", () => {
    const error = toModuleError(
      shapedError("PARSE", "x", { selector: "h1", status: "404", url: 5, extra: "no" }),
    );

    expect(error.details).toEqual({ selector: "h1" });
  });

  it("un code que no es del contrato cae en INTERNAL", () => {
    const error = toModuleError(shapedError("ENOENT", "disco"));

    expect(error.code).toBe("INTERNAL");
    expect(error.message).toBe("disco");
  });

  it("un code válido sin name ModuleError cae en INTERNAL (no se confía en cualquier error)", () => {
    const error = toModuleError(shapedError("NOT_FOUND", "otro", undefined, "Error"));

    expect(error.code).toBe("INTERNAL");
  });

  it("un valor que no es Error sigue siendo INTERNAL", () => {
    expect(toModuleError({ name: "ModuleError", code: "NOT_FOUND" }).code).toBe("INTERNAL");
    expect(toModuleError("boom").code).toBe("INTERNAL");
  });

  it("el runtime script conserva el código de un error por forma lanzado por el módulo", async () => {
    const loader = new FakeScriptLoader({
      "module.js": (): ModuleApi => ({
        search: async () => {
          throw shapedError("BLOCKED", "protegido", { status: 403 });
        },
        details: async () => {
          throw new Error("sin tipo");
        },
        pages: async () => ({ images: [] }),
      }),
    });
    const api = await new ScriptRuntime({
      host: noopHost,
      loader,
      source: "module.js",
    }).createApi();

    const blocked = await api.search("x", 1).catch((reason: unknown) => reason);
    const plain = await api.details("x").catch((reason: unknown) => reason);

    expect(blocked).toBeInstanceOf(ModuleError);
    expect((blocked as ModuleError).code).toBe("BLOCKED");
    expect((blocked as ModuleError).details).toEqual({ status: 403 });
    expect((plain as ModuleError).code).toBe("INTERNAL");
  });
});
