import { describe, expect, it } from "vitest";

import { withTransaction, type SqlDriver } from "../../src/storage/SqlDriver.js";

/** Driver que, como SQLite con una sola conexión, rechaza un `BEGIN` dentro de otro. */
function strictDriver(log: string[]): SqlDriver {
  let open = false;
  const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
  return {
    async exec(sql) {
      await tick();
      if (sql === "BEGIN") {
        if (open) throw new Error("cannot start a transaction within a transaction");
        open = true;
      } else if (sql === "COMMIT" || sql === "ROLLBACK") {
        open = false;
      }
      log.push(sql);
    },
    async run(sql) {
      await tick();
      log.push(sql);
      return { changes: 1, lastInsertRowid: 0 };
    },
    all: async () => [],
    get: async () => undefined,
  };
}

describe("withTransaction", () => {
  it("serializa transacciones concurrentes sobre el mismo driver (sin BEGIN anidado)", async () => {
    const log: string[] = [];
    const driver = strictDriver(log);
    await Promise.all([
      withTransaction(driver, () => driver.run("A")),
      withTransaction(driver, () => driver.run("B")),
    ]);
    expect(log).toEqual(["BEGIN", "A", "COMMIT", "BEGIN", "B", "COMMIT"]);
  });

  it("un fallo hace ROLLBACK y no bloquea la siguiente transacción", async () => {
    const log: string[] = [];
    const driver = strictDriver(log);
    const failed = withTransaction(driver, async () => {
      throw new Error("boom");
    });
    const next = withTransaction(driver, () => driver.run("B"));
    await expect(failed).rejects.toThrow("boom");
    await next;
    expect(log).toEqual(["BEGIN", "ROLLBACK", "BEGIN", "B", "COMMIT"]);
  });
});
