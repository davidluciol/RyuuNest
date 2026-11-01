import { describe, expect, it, vi } from "vitest";

import { createExtensionStatus } from "../../src/ports/extensionStatus";

describe("createExtensionStatus", () => {
  it("empieza sin saber si hay extensión y sin dominios pendientes", () => {
    expect(createExtensionStatus().get()).toEqual({ state: "unknown", pendingDomains: [] });
  });

  it("notifica los cambios de estado y no los repetidos", () => {
    const status = createExtensionStatus();
    const listener = vi.fn();
    status.subscribe(listener);

    status.setState("ready");
    expect(status.get().state).toBe("ready");
    expect(listener).toHaveBeenCalledTimes(1);

    const snapshot = status.get();
    status.setState("ready");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(status.get()).toBe(snapshot);
  });

  it("devuelve la misma instantánea mientras nada cambie (useSyncExternalStore)", () => {
    const status = createExtensionStatus();
    expect(status.get()).toBe(status.get());
  });

  it("anota dominios pendientes sin repetirlos y los quita uno a uno", () => {
    const status = createExtensionStatus();
    status.addPendingDomain("a.org");
    status.addPendingDomain("b.org");
    status.addPendingDomain("a.org");
    expect(status.get().pendingDomains).toEqual(["a.org", "b.org"]);

    status.removePendingDomain("a.org");
    expect(status.get().pendingDomains).toEqual(["b.org"]);

    status.removePendingDomain("no-estaba.org");
    expect(status.get().pendingDomains).toEqual(["b.org"]);
  });

  it("vacía todos los pendientes", () => {
    const status = createExtensionStatus();
    status.addPendingDomain("a.org");
    status.clearPendingDomains();
    expect(status.get().pendingDomains).toEqual([]);
  });

  it("deja de avisar al darse de baja", () => {
    const status = createExtensionStatus();
    const listener = vi.fn();
    const unsubscribe = status.subscribe(listener);
    unsubscribe();
    status.setState("missing");
    expect(listener).not.toHaveBeenCalled();
  });
});
