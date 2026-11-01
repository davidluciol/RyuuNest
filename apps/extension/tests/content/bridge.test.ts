import { PROTOCOL_CHANNEL, PROTOCOL_VERSION } from "@ryuunest/extension-protocol";
import { describe, expect, it, vi } from "vitest";

import { startBridge, type BridgeEvent, type BridgeWindow } from "../../src/content/bridge";

const APP = "http://localhost:5173";
const envelope = { channel: PROTOCOL_CHANNEL, version: PROTOCOL_VERSION } as const;
const validRequest = {
  ...envelope,
  id: "r1",
  type: "http.request",
  url: "https://sitio.org/a",
  method: "GET",
  headers: {},
};
const httpResponse = {
  ...envelope,
  id: "r1",
  type: "http.response",
  status: 200,
  headers: {},
  url: "https://sitio.org/a",
  encoding: "text",
  body: "hola",
};

function fakeWindow(origin = APP) {
  const listeners = new Set<(event: BridgeEvent) => void>();
  const posted: Array<{ message: unknown; targetOrigin: string }> = [];
  const win: BridgeWindow = {
    location: { origin },
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
    postMessage: (message, targetOrigin) => posted.push({ message, targetOrigin }),
  };
  const dispatch = (event: Partial<BridgeEvent> & { data: unknown }) => {
    const full: BridgeEvent = { source: win, origin, ...event };
    for (const listener of [...listeners]) listener(full);
  };
  return { win, listeners, posted, dispatch };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("startBridge", () => {
  it("en un origen que no es de la app no escucha nada", () => {
    const { win, listeners } = fakeWindow("https://malo.example");
    const runtime = { sendMessage: vi.fn() };
    startBridge({ window: win, runtime, appOrigins: [APP] });
    expect(listeners.size).toBe(0);
  });

  it("reenvía al fondo una petición válida y devuelve la respuesta al mismo origen", async () => {
    const { win, posted, dispatch } = fakeWindow();
    const runtime = { sendMessage: vi.fn(async () => httpResponse) };
    startBridge({ window: win, runtime, appOrigins: [APP] });

    dispatch({ data: validRequest });
    await flush();

    expect(runtime.sendMessage).toHaveBeenCalledWith(validRequest);
    expect(posted).toEqual([{ message: httpResponse, targetOrigin: APP }]);
  });

  it("reenvía solo los campos del protocolo", async () => {
    const { win, dispatch } = fakeWindow();
    const runtime = { sendMessage: vi.fn(async () => httpResponse) };
    startBridge({ window: win, runtime, appOrigins: [APP] });

    dispatch({ data: { ...validRequest, credentials: "include", extra: 1 } });
    await flush();

    expect(runtime.sendMessage).toHaveBeenCalledWith(validRequest);
  });

  it.each([
    ["vienen de otra ventana (un iframe)", { source: {} }],
    ["vienen de otro origen", { origin: "https://malo.example" }],
    ["no son una petición del protocolo", { data: { hola: "mundo" } }],
    ["son una respuesta (la propia página las publica)", { data: httpResponse }],
    ["son de otra versión del protocolo", { data: { ...validRequest, version: 99 } }],
  ])("ignora los mensajes que %s", async (_motivo, override) => {
    const { win, posted, dispatch } = fakeWindow();
    const runtime = { sendMessage: vi.fn(async () => httpResponse) };
    startBridge({ window: win, runtime, appOrigins: [APP] });

    dispatch({ data: validRequest, ...override });
    await flush();

    expect(runtime.sendMessage).not.toHaveBeenCalled();
    expect(posted).toEqual([]);
  });

  it("si el fondo falla, la página recibe un error INTERNAL con su id", async () => {
    const { win, posted, dispatch } = fakeWindow();
    const runtime = {
      sendMessage: vi.fn(async () => {
        throw new Error("Extension context invalidated");
      }),
    };
    startBridge({ window: win, runtime, appOrigins: [APP] });

    dispatch({ data: validRequest });
    await flush();

    expect(posted).toHaveLength(1);
    expect(posted[0]?.targetOrigin).toBe(APP);
    expect(posted[0]?.message).toMatchObject({
      ...envelope,
      id: "r1",
      type: "error",
      code: "INTERNAL",
    });
  });

  it("si el fondo contesta algo que no es del protocolo, también es INTERNAL", async () => {
    const { win, posted, dispatch } = fakeWindow();
    const runtime = { sendMessage: vi.fn(async () => ({ cualquier: "cosa" })) };
    startBridge({ window: win, runtime, appOrigins: [APP] });

    dispatch({ data: validRequest });
    await flush();

    expect(posted[0]?.message).toMatchObject({ id: "r1", type: "error", code: "INTERNAL" });
  });

  it("no deja pasar al fondo una respuesta de otro id", async () => {
    const { win, posted, dispatch } = fakeWindow();
    const runtime = { sendMessage: vi.fn(async () => ({ ...httpResponse, id: "otro" })) };
    startBridge({ window: win, runtime, appOrigins: [APP] });

    dispatch({ data: validRequest });
    await flush();

    expect(posted[0]?.message).toMatchObject({ id: "r1", type: "error", code: "INTERNAL" });
  });

  it("la función devuelta deja de escuchar", async () => {
    const { win, listeners, dispatch } = fakeWindow();
    const runtime = { sendMessage: vi.fn(async () => httpResponse) };
    const stop = startBridge({ window: win, runtime, appOrigins: [APP] });
    expect(listeners.size).toBe(1);

    stop();
    expect(listeners.size).toBe(0);
    dispatch({ data: validRequest });
    await flush();
    expect(runtime.sendMessage).not.toHaveBeenCalled();
  });
});
