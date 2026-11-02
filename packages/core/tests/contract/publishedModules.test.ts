import { describe, expect, it } from "vitest";

import { ModuleError } from "../../src/contract/errors";
import type { Host, ModuleApi } from "../../src/contract/types";
import { FakeScriptLoader } from "../../src/ports/fakes";
import type { ScriptFactory } from "../../src/ports/scriptLoader";
import { createModuleApi } from "../../src/runtimes/ModuleRuntime";
import { publishedModules, type PublishedModuleOutputs } from "./publishedModuleFixtures";

/**
 * Regresión de la validación de forma del contrato con los tres módulos publicados
 * de `RyuuNest-Models` (T37, R4 del ADR-0003): «endurecer cuando haya muchos rompe
 * módulos publicados», así que sus formas son el caso de prueba.
 *
 * Cada módulo se monta por el camino real (`createModuleApi` con un módulo script) y
 * sus salidas deben pasar la validación de `guardApi` tal cual: con `related` (zonatmo,
 * yupmanga), ids opacos con `?`/`=` (yupmanga), una sola release por capítulo (m440,
 * yupmanga) y cabeceras en las imágenes (los tres). Además, cada familia de formas
 * trae un daño mínimo que la validación **sí** debe cazar, para probar que está activa.
 *
 * Las formas salen del código publicado (ver `publishedModuleFixtures.ts`); los
 * valores son inventados y no hay red.
 */

const SOURCE = "export default function create(host) { /* … */ }";

const noopHost = {} as Host;

/**
 * Monta las salidas del módulo publicado como si fuera un módulo script instalado.
 * `overrides` sustituye métodos completos para los casos con la forma dañada.
 */
async function mountPublishedModule(
  module: PublishedModuleOutputs,
  overrides: Record<string, unknown> = {},
) {
  const api: Record<string, unknown> = {
    popular: async () => module.popular,
    latest: async () => module.latest,
    search: async () => module.search,
    details: async () => module.details,
    pages: async () => module.chapterPages,
    ...overrides,
  };
  const factory: ScriptFactory = () => api as unknown as ModuleApi;
  return createModuleApi({
    manifest: module.manifest,
    entry: SOURCE,
    host: noopHost,
    loader: new FakeScriptLoader({ "module.js": factory }),
  });
}

/** Lo que rechaza la promesa (o `undefined` si resolvió). */
async function rejection(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(
    () => undefined,
    (error: unknown) => error,
  );
}

/** Copia el objeto sin una clave, para dañar una forma válida. */
function withoutKey(value: object, key: string): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...value };
  delete copy[key];
  return copy;
}

describe.each(publishedModules)(
  "módulo publicado $id ($version) · regresión de forma",
  (module) => {
    it("sus cinco métodos pasan la validación y devuelven las salidas intactas", async () => {
      const handle = await mountPublishedModule(module);

      await expect(handle.api.popular?.(1)).resolves.toEqual(module.popular);
      await expect(handle.api.latest?.(1)).resolves.toEqual(module.latest);
      await expect(handle.api.search("ejemplo", 1)).resolves.toEqual(module.search);
      await expect(handle.api.details(module.details.id)).resolves.toEqual(module.details);
      await expect(handle.api.pages("capitulo", "release")).resolves.toEqual(module.chapterPages);
      expect(handle.lastError()).toBeUndefined();
    });

    it("una imagen sin url cae en PARSE (la validación está activa en pages())", async () => {
      const roto = {
        images: module.chapterPages.images.map((imagen) => ({ headers: imagen.headers })),
      };
      const handle = await mountPublishedModule(module, { pages: async () => roto });

      const error = (await rejection(handle.api.pages("capitulo", "release"))) as ModuleError;

      expect(error).toBeInstanceOf(ModuleError);
      expect(error.code).toBe("PARSE");
      expect(error.message).toContain("«images[0].url»");
      expect(handle.lastError()).toBe(error);
    });

    it("una ficha sin un campo obligatorio cae en PARSE (la validación está activa en details())", async () => {
      const roto = withoutKey(module.details, "genres");
      const handle = await mountPublishedModule(module, { details: async () => roto });

      const error = (await rejection(handle.api.details(module.details.id))) as ModuleError;

      expect(error).toBeInstanceOf(ModuleError);
      expect(error.code).toBe("PARSE");
      expect(error.message).toContain("«genres»");
    });

    it("un resumen sin título cae en PARSE (la validación está activa en search())", async () => {
      const roto = {
        items: module.search.items.map((item) => withoutKey(item, "title")),
        hasNext: module.search.hasNext,
      };
      const handle = await mountPublishedModule(module, { search: async () => roto });

      const error = (await rejection(handle.api.search("ejemplo", 1))) as ModuleError;

      expect(error).toBeInstanceOf(ModuleError);
      expect(error.code).toBe("PARSE");
      expect(error.message).toContain("«items[0].title»");
    });
  },
);
