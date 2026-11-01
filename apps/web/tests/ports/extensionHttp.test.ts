import { ModuleError } from "@ryuunest/core";
import {
  PROTOCOL_CHANNEL,
  PROTOCOL_VERSION,
  bytesToBase64,
  withEnvelope,
  type RequestMessage,
  type ResponseMessage,
} from "@ryuunest/extension-protocol";
import { describe, expect, it } from "vitest";

import {
  ExtensionHttpError,
  createExtensionHttp,
  createWindowChannel,
  type ExtensionChannel,
} from "../../src/ports/extensionHttp";
import { createExtensionStatus } from "../../src/ports/extensionStatus";

type Handler = (
  request: RequestMessage,
) => ResponseMessage | null | Promise<ResponseMessage | null>;

/** Una extensión simulada al otro lado del canal. `null` = no contesta. */
function fakeExtension(handler: Handler) {
  const listeners = new Set<(message: ResponseMessage) => void>();
  const sent: RequestMessage[] = [];
  const channel: ExtensionChannel = {
    post(message) {
      sent.push(message);
      void Promise.resolve(handler(message)).then((reply) => {
        if (reply !== null) for (const listener of [...listeners]) listener(reply);
      });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return { channel, sent, listeners };
}

const pong = (request: RequestMessage): ResponseMessage =>
  withEnvelope({ id: request.id, type: "pong" as const, extensionVersion: "1.2.3" });

function htmlResponse(request: RequestMessage, body = "<p>hola</p>"): ResponseMessage {
  return withEnvelope({
    id: request.id,
    type: "http.response" as const,
    status: 200,
    headers: { "content-type": "text/html" },
    url: request.type === "http.request" ? request.url : "",
    encoding: "text" as const,
    body,
  });
}

function failure(
  request: RequestMessage,
  code: string,
  extra: { domain?: string } = {},
): ResponseMessage {
  return withEnvelope({
    id: request.id,
    type: "error" as const,
    code: code as "NETWORK",
    message: `fallo ${code}`,
    ...extra,
  });
}

const okHandler: Handler = (request) =>
  request.type === "ping" ? pong(request) : htmlResponse(request);

function make(
  handler: Handler = okHandler,
  overrides: Partial<Parameters<typeof createExtensionHttp>[0]> = {},
) {
  const extension = fakeExtension(handler);
  const status = createExtensionStatus();
  let counter = 0;
  const http = createExtensionHttp({
    channel: extension.channel,
    status,
    newId: () => `r${++counter}`,
    detectTimeoutMs: 20,
    requestTimeoutMs: 40,
    ...overrides,
  });
  return { http, status, ...extension };
}

describe("detect", () => {
  it("es true y deja el estado en ready cuando la extensión contesta al ping", async () => {
    const { http, status } = make();
    expect(await http.detect()).toBe(true);
    expect(status.get().state).toBe("ready");
  });

  it("es false y deja el estado en missing si nadie contesta", async () => {
    const { http, status } = make(() => null);
    expect(await http.detect()).toBe(false);
    expect(status.get().state).toBe("missing");
  });
});

describe("request", () => {
  it("sin extensión falla con EXTENSION_MISSING y no manda ninguna petición", async () => {
    const { http, sent } = make(() => null);
    const error = await http.request("https://sitio.org/a").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ExtensionHttpError);
    expect(error).toBeInstanceOf(ModuleError);
    expect(error).toMatchObject({ reason: "EXTENSION_MISSING", code: "NETWORK" });
    expect(sent.map((m) => m.type)).toEqual(["ping"]);
  });

  it("detecta la extensión una sola vez y luego va directo", async () => {
    const { http, sent } = make();
    await http.request("https://sitio.org/a");
    await http.request("https://sitio.org/b");
    expect(sent.map((m) => m.type)).toEqual(["ping", "http.request", "http.request"]);
  });

  it("manda método, cabeceras y cuerpo; el método se normaliza a mayúsculas", async () => {
    const { http, sent } = make();
    await http.request("https://sitio.org/q", {
      method: "post",
      headers: { Accept: "application/json" },
      body: '{"q":1}',
    });
    expect(sent.at(-1)).toEqual({
      channel: PROTOCOL_CHANNEL,
      version: PROTOCOL_VERSION,
      id: "r2",
      type: "http.request",
      url: "https://sitio.org/q",
      method: "POST",
      headers: { Accept: "application/json" },
      body: '{"q":1}',
    });
  });

  it("por defecto es GET sin cabeceras ni cuerpo", async () => {
    const { http, sent } = make();
    await http.request("https://sitio.org/a");
    expect(sent.at(-1)).toMatchObject({ method: "GET", headers: {} });
    expect(sent.at(-1)).not.toHaveProperty("body");
  });

  it("rechaza un método que la extensión no admite, sin enviarlo", async () => {
    const { http, sent } = make();
    const error = await http
      .request("https://sitio.org/a", { method: "DELETE" })
      .catch((e: unknown) => e);
    expect(error).toMatchObject({ code: "UNSUPPORTED" });
    expect(sent).toEqual([]);
  });

  it("rechaza un cuerpo en un GET y una URL que no es http(s): la extensión los descartaría en silencio", async () => {
    const { http, sent } = make();
    const withBody = await http
      .request("https://sitio.org/a", { method: "GET", body: "x" })
      .catch((e: unknown) => e);
    const notHttp = await http.request("file:///etc/passwd").catch((e: unknown) => e);
    expect(withBody).toMatchObject({ code: "UNSUPPORTED" });
    expect(notHttp).toMatchObject({ code: "UNSUPPORTED" });
    expect(sent).toEqual([]);
  });

  it("una respuesta de texto: estado, cabeceras, URL final, text() y bytes() UTF-8", async () => {
    const { http } = make((request) =>
      request.type === "ping"
        ? pong(request)
        : withEnvelope({
            id: request.id,
            type: "http.response" as const,
            status: 404,
            headers: { "content-type": "text/plain" },
            url: "https://sitio.org/final",
            encoding: "text" as const,
            body: "no está 🐉",
          }),
    );
    const response = await http.request("https://sitio.org/a");
    expect(response.status).toBe(404);
    expect(response.headers).toEqual({ "content-type": "text/plain" });
    expect(response.url).toBe("https://sitio.org/final");
    expect(await response.text()).toBe("no está 🐉");
    expect(await response.bytes()).toEqual(new TextEncoder().encode("no está 🐉"));
  });

  it("una respuesta binaria: bytes() exactos y text() la decodifica como UTF-8", async () => {
    const bytes = Uint8Array.of(0xff, 0xd8, 0xff, 0x00, 0x80);
    const { http } = make((request) =>
      request.type === "ping"
        ? pong(request)
        : withEnvelope({
            id: request.id,
            type: "http.response" as const,
            status: 200,
            headers: { "content-type": "image/jpeg" },
            url: "https://sitio.org/i.jpg",
            encoding: "base64" as const,
            body: bytesToBase64(bytes),
          }),
    );
    const response = await http.request("https://sitio.org/i.jpg");
    expect(await response.bytes()).toEqual(bytes);
    expect(typeof (await response.text())).toBe("string");
  });

  it("contesta a cada petición simultánea con su propia respuesta", async () => {
    const { http } = make(async (request) => {
      if (request.type === "ping") return pong(request);
      if (request.type !== "http.request") return null;
      // La primera tarda más: las respuestas llegan en orden inverso.
      await new Promise((resolve) => setTimeout(resolve, request.url.endsWith("/lenta") ? 10 : 0));
      return htmlResponse(request, request.url);
    });
    await http.detect();
    const [lenta, rapida] = await Promise.all([
      http.request("https://sitio.org/lenta"),
      http.request("https://sitio.org/rapida"),
    ]);
    expect(await lenta.text()).toBe("https://sitio.org/lenta");
    expect(await rapida.text()).toBe("https://sitio.org/rapida");
  });

  it("ignora respuestas de ids que no pidió", async () => {
    const { http } = make((request) => {
      if (request.type === "ping") return pong(request);
      return htmlResponse({ ...request, id: "ajeno" }, "intruso");
    });
    const error = await http.request("https://sitio.org/a").catch((e: unknown) => e);
    expect(error).toMatchObject({ code: "TIMEOUT" });
  });

  it("si la extensión deja de contestar: TIMEOUT y el estado vuelve a «unknown»", async () => {
    let answering = true;
    const { http, status } = make((request) => {
      if (request.type === "ping") return pong(request);
      return answering ? htmlResponse(request) : null;
    });
    await http.request("https://sitio.org/a");
    expect(status.get().state).toBe("ready");

    answering = false;
    const error = await http.request("https://sitio.org/b").catch((e: unknown) => e);
    expect(error).toMatchObject({ code: "TIMEOUT" });
    expect(status.get().state).toBe("unknown");
  });
});

describe("errores de la extensión", () => {
  it("DOMAIN_NOT_AUTHORIZED: anota el dominio pendiente y lo cuenta como fallo de red", async () => {
    const { http, status } = make((request) =>
      request.type === "ping"
        ? pong(request)
        : failure(request, "DOMAIN_NOT_AUTHORIZED", { domain: "cdn.sitio.org" }),
    );
    const error = await http.request("https://cdn.sitio.org/i.jpg").catch((e: unknown) => e);
    expect(error).toMatchObject({
      reason: "DOMAIN_NOT_AUTHORIZED",
      domain: "cdn.sitio.org",
      code: "NETWORK",
    });
    expect(status.get().pendingDomains).toEqual(["cdn.sitio.org"]);
  });

  it("cuando ese dominio ya responde, deja de estar pendiente", async () => {
    let authorized = false;
    const { http, status } = make((request) => {
      if (request.type === "ping") return pong(request);
      return authorized
        ? htmlResponse(request)
        : failure(request, "DOMAIN_NOT_AUTHORIZED", { domain: "sitio.org" });
    });
    await http.request("https://sitio.org/a").catch(() => {});
    expect(status.get().pendingDomains).toEqual(["sitio.org"]);

    authorized = true;
    await http.request("https://sitio.org/a");
    expect(status.get().pendingDomains).toEqual([]);
  });

  it.each([
    ["NETWORK", "NETWORK"],
    ["TIMEOUT", "TIMEOUT"],
    ["INTERNAL", "INTERNAL"],
    ["BAD_REQUEST", "INTERNAL"],
    ["ORIGIN_NOT_ALLOWED", "INTERNAL"],
  ])("%s de la extensión llega como código %s del contrato", async (reason, code) => {
    const { http } = make((request) =>
      request.type === "ping" ? pong(request) : failure(request, reason),
    );
    const error = await http.request("https://sitio.org/a").catch((e: unknown) => e);
    expect(error).toMatchObject({ reason, code });
  });

  it("el mensaje no incluye la URL completa (puede llevar tokens), solo el host", async () => {
    const { http } = make((request) =>
      request.type === "ping" ? pong(request) : failure(request, "NETWORK"),
    );
    const error = (await http
      .request("https://sitio.org/a?token=secreto")
      .catch((e: unknown) => e)) as Error;
    expect(error.message).not.toContain("secreto");
    expect(error.message).toContain("sitio.org");
  });
});

describe("openOptions", () => {
  it("pide abrir las opciones con el dominio y espera la confirmación", async () => {
    const { http, sent } = make((request) => {
      if (request.type === "ping") return pong(request);
      return withEnvelope({ id: request.id, type: "ack" as const });
    });
    await http.openOptions("cdn.sitio.org");
    expect(sent.at(-1)).toMatchObject({ type: "options.open", domain: "cdn.sitio.org" });
  });

  it("sin extensión falla con EXTENSION_MISSING", async () => {
    const { http } = make(() => null);
    const error = await http.openOptions().catch((e: unknown) => e);
    expect(error).toMatchObject({ reason: "EXTENSION_MISSING" });
  });
});

describe("createWindowChannel", () => {
  function fakeWindow(origin = "http://localhost:4173") {
    const listeners = new Set<
      (event: { source: unknown; origin: string; data: unknown }) => void
    >();
    const posted: Array<{ message: unknown; targetOrigin: string }> = [];
    const win = {
      location: { origin },
      postMessage: (message: unknown, targetOrigin: string) =>
        posted.push({ message, targetOrigin }),
      addEventListener: (_type: "message", listener: (event: never) => void) =>
        listeners.add(listener as never),
      removeEventListener: (_type: "message", listener: (event: never) => void) =>
        listeners.delete(listener as never),
    };
    const dispatch = (data: unknown, overrides: { source?: unknown; origin?: string } = {}) => {
      for (const listener of [...listeners]) {
        listener({ source: win, origin, data, ...overrides });
      }
    };
    return { win, posted, dispatch, listeners };
  }

  const ping: RequestMessage = withEnvelope({ id: "p1", type: "ping" as const });
  const reply: ResponseMessage = withEnvelope({
    id: "p1",
    type: "pong" as const,
    extensionVersion: "1",
  });

  it("publica en su propio origen, nunca con «*»", () => {
    const { win, posted } = fakeWindow();
    createWindowChannel(win).post(ping);
    expect(posted).toEqual([{ message: ping, targetOrigin: "http://localhost:4173" }]);
  });

  it("entrega solo respuestas válidas de su propia ventana y origen", () => {
    const { win, dispatch } = fakeWindow();
    const received: ResponseMessage[] = [];
    createWindowChannel(win).subscribe((message) => received.push(message));

    dispatch(reply);
    dispatch(ping); // su propia petición rebota en la ventana: no es una respuesta
    dispatch({ cualquier: "cosa" });
    dispatch(reply, { source: {} });
    dispatch(reply, { origin: "https://otro.example" });

    expect(received).toEqual([reply]);
  });

  it("deja de escuchar al darse de baja", () => {
    const { win, listeners } = fakeWindow();
    const unsubscribe = createWindowChannel(win).subscribe(() => {});
    expect(listeners.size).toBe(1);
    unsubscribe();
    expect(listeners.size).toBe(0);
  });
});
