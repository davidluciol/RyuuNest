import { beforeEach, describe, expect, it } from "vitest";

import { exportBackup } from "../../src/backup/export";
import { importBackup } from "../../src/backup/import";
import { BACKUP_FORMAT, BACKUP_VERSION, validateBackup } from "../../src/backup/schema";
import { Folders } from "../../src/library/Folders";
import { SeriesStore } from "../../src/library/SeriesStore";
import { FixedClock } from "../../src/ports/fakes";
import { MemoryStorage } from "../../src/storage/MemoryStorage";
import type { SqlDriver } from "../../src/storage/SqlDriver";
import { openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * F53 (P-162) — el respaldo v2 lleva las etiquetas de cada serie y de cada carpeta
 * inteligente dentro de `series[].tags` y `folders[].tags`. Un respaldo v1 (sin ellas) sigue
 * leyéndose.
 */

let origen: SqlDriver;
const clock = new FixedClock(5_000);

beforeEach(async () => {
  origen = await openMigratedDriver();
  const series = new SeriesStore({ driver: origen, clock });
  await series.upsert({ moduleId: "m", seriesId: "a", title: "A", nsfw: false });
  await series.setTags("m", "a", ["Seinen", "Acción"]);
  await new Folders({ driver: origen, clock }).create("Mis seinen", 1, ["Seinen"]);
});

async function exportar(db: SqlDriver) {
  return exportBackup({ driver: db, storage: new MemoryStorage(), clock });
}

describe("respaldo v2 · etiquetas (F53)", () => {
  it("exporta la versión 2 con las etiquetas de series y carpetas", async () => {
    const backup = await exportar(origen);

    expect(BACKUP_VERSION).toBe(3);
    expect(backup.version).toBe(3);
    expect(backup.series[0]?.tags).toEqual(["Acción", "Seinen"]);
    expect(backup.folders.find((f) => f.name === "Mis seinen")?.tags).toEqual(["Seinen"]);
    expect(backup.folders.find((f) => f.name === "Favoritos")?.tags).toEqual([]);
  });

  it.each(["merge", "replace"] as const)("ida y vuelta (%s): las etiquetas se restauran", async (mode) => {
    const texto = JSON.stringify(await exportar(origen));
    const destino = await openMigratedDriver();

    expect((await importBackup({ driver: destino, mode }, texto)).ok).toBe(true);

    const restaurado = await exportar(destino);
    expect(restaurado.series[0]?.tags).toEqual(["Acción", "Seinen"]);
    expect(restaurado.folders.find((f) => f.name === "Mis seinen")?.tags).toEqual(["Seinen"]);
  });

  it("un respaldo v1 (sin etiquetas) se acepta y no borra las locales al fusionar", async () => {
    const v1 = { ...(await exportar(origen)), version: 1 };
    v1.series = v1.series.map(({ tags: _t, ...resto }) => resto) as typeof v1.series;
    v1.folders = v1.folders.map(({ tags: _t, ...resto }) => resto) as typeof v1.folders;
    v1.series[0]!.updatedAt = 9_000; // más nuevo: actualiza la serie, pero sin etiquetas no las toca
    const destino = await openMigratedDriver();
    const seriesDestino = new SeriesStore({ driver: destino, clock });
    await seriesDestino.upsert({ moduleId: "m", seriesId: "a", title: "A", nsfw: false });
    await seriesDestino.setTags("m", "a", ["Local"]);

    const result = await importBackup({ driver: destino, mode: "merge" }, JSON.stringify(v1));

    expect(result.ok).toBe(true);
    expect(await seriesDestino.tags("m", "a")).toEqual(["Local"]);
  });

  it("al fusionar, la serie del respaldo más nueva reemplaza las etiquetas y la local más nueva las conserva", async () => {
    const backup = await exportar(origen);
    const nuevo = await openMigratedDriver();
    const s = new SeriesStore({ driver: nuevo, clock });
    await s.upsert({ moduleId: "m", seriesId: "a", title: "A", nsfw: false }); // updated_at = 5000
    await s.setTags("m", "a", ["Local"]);

    await importBackup({ driver: nuevo, mode: "merge" }, JSON.stringify(backup)); // 5000 no es > 5000
    expect(await s.tags("m", "a")).toEqual(["Local"]);

    backup.series[0]!.updatedAt = 9_000;
    await importBackup({ driver: nuevo, mode: "merge" }, JSON.stringify(backup));
    expect(await s.tags("m", "a")).toEqual(["Acción", "Seinen"]);
  });

  it("al fusionar carpetas con el mismo nombre se unen sus etiquetas", async () => {
    const backup = await exportar(origen);
    const destino = await openMigratedDriver();
    const carpetas = new Folders({ driver: destino, clock });
    const id = await carpetas.create("Mis seinen", 0, ["Isekai"]);

    await importBackup({ driver: destino, mode: "merge" }, JSON.stringify(backup));

    expect(await carpetas.tags(id)).toEqual(["Isekai", "Seinen"]);
  });

  it("valida las etiquetas: deben ser una lista de textos", () => {
    const base = {
      format: BACKUP_FORMAT, version: 2, createdAt: 1, repos: [], modules: [], folders: [],
      favorites: [], progress: [], read: [], prefs: [], settings: {},
    };
    const serie = { moduleId: "m", seriesId: "a", title: "A", coverUrl: null, kind: null, nsfw: false, status: null, updatedAt: 1 };

    const mala = validateBackup({ ...base, series: [{ ...serie, tags: "Seinen" }] });
    const buena = validateBackup({ ...base, series: [{ ...serie, tags: ["Seinen"] }] });

    expect(mala.ok).toBe(false);
    expect(!mala.ok && mala.issues.map((i) => i.path)).toContain("series[0].tags");
    expect(buena.ok).toBe(true);
  });
});

/** F47 — el respaldo v3 lleva las cabeceras de portada (decisión del humano 2026-11-17). */
describe("respaldo v3 · cabeceras de portada (F47)", () => {
  it.each(["merge", "replace"] as const)("ida y vuelta (%s): las cabeceras se restauran", async (mode) => {
    await new SeriesStore({ driver: origen, clock }).saveFromDetails("m", {
      id: "a",
      title: "A",
      genres: [],
      nsfw: false,
      status: "ongoing",
      kind: "manga",
      cover: { url: "https://x.test/a.jpg", headers: { Cookie: "s=1" } },
    } as never);
    const respaldo = await exportar(origen);
    expect(respaldo.series[0]?.coverHeaders).toEqual({ Cookie: "s=1" });

    const destino = await openMigratedDriver();
    expect((await importBackup({ driver: destino, mode }, JSON.stringify(respaldo))).ok).toBe(true);

    expect((await exportar(destino)).series[0]?.coverHeaders).toEqual({ Cookie: "s=1" });
  });

  it("un respaldo v2 (sin cabeceras) se acepta", async () => {
    const v2 = { ...(await exportar(origen)), version: 2 };

    expect(validateBackup(v2).ok).toBe(true);
  });

  it("unas cabeceras que no son texto se rechazan", async () => {
    const malo = await exportar(origen);
    (malo.series[0] as unknown as { coverHeaders: unknown }).coverHeaders = { Cookie: 1 };

    expect(validateBackup(malo).ok).toBe(false);
  });
});
