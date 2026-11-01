/**
 * F26 — cabeceras de las peticiones del fondo (SPEC §10; D2/RF-24: los módulos
 * devuelven `ImageRef.headers`, p. ej. `Referer`).
 *
 * `fetch` no puede poner `Referer`, `Origin` ni `User-Agent`: se aplican con
 * reglas de sesión de `declarativeNetRequest`, acotadas a **una URL exacta** y a
 * las peticiones sin pestaña (`tabIds: [-1]`, o sea, las del propio fondo), y se
 * retiran al terminar. El resto de cabeceras prohibidas (cookies, `host`…) se
 * descarta: la extensión no envía credenciales.
 */

/** Cabeceras que solo se pueden fijar con reglas. */
const RULE_HEADER_NAMES = new Set(["referer", "origin", "user-agent"]);

/** Cabeceras prohibidas por la especificación de `fetch` (se descartan). */
const FORBIDDEN_HEADER_NAMES = new Set([
  "accept-charset",
  "accept-encoding",
  "access-control-request-headers",
  "access-control-request-method",
  "connection",
  "content-length",
  "cookie",
  "cookie2",
  "date",
  "dnt",
  "expect",
  "host",
  "keep-alive",
  "set-cookie",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "via",
]);

const HEADER_NAME = /^[!#$%&'*+\-.^_`|~0-9a-z]+$/;
const HEADER_VALUE = /^[^\r\n\0]*$/;

export interface ClassifiedHeaders {
  /** Van en `fetch`. */
  fetchHeaders: Record<string, string>;
  /** Van en una regla `declarativeNetRequest`. */
  ruleHeaders: Record<string, string>;
  /** Nombres descartados (prohibidos o inválidos). */
  dropped: string[];
}

export function classifyHeaders(headers: Readonly<Record<string, string>>): ClassifiedHeaders {
  const fetchHeaders: Record<string, string> = {};
  const ruleHeaders: Record<string, string> = {};
  const dropped: string[] = [];

  for (const [rawName, value] of Object.entries(headers)) {
    const name = rawName.toLowerCase();
    const forbidden =
      FORBIDDEN_HEADER_NAMES.has(name) || name.startsWith("proxy-") || name.startsWith("sec-");
    if (forbidden || !HEADER_NAME.test(name) || !HEADER_VALUE.test(value)) {
      dropped.push(name);
    } else if (RULE_HEADER_NAMES.has(name)) {
      ruleHeaders[name] = value;
    } else {
      fetchHeaders[name] = value;
    }
  }
  return { fetchHeaders, ruleHeaders, dropped };
}

/** Regla de sesión de `declarativeNetRequest` (forma mínima que usamos). */
export interface HeaderRule {
  id: number;
  priority: number;
  action: {
    type: "modifyHeaders";
    requestHeaders: Array<{ header: string; operation: "set"; value: string }>;
  };
  condition: {
    regexFilter: string;
    isUrlFilterCaseSensitive: boolean;
    resourceTypes: ["xmlhttprequest"];
    tabIds: number[];
  };
}

/** Escapa los metacaracteres de RE2 para casar la URL literal. */
function escapeRegex(text: string): string {
  return text.replace(/[\\^$.*+?()[\]{}|/]/g, "\\$&");
}

export function buildHeaderRule(
  id: number,
  url: string,
  ruleHeaders: Readonly<Record<string, string>>,
): HeaderRule {
  return {
    id,
    priority: 1,
    action: {
      type: "modifyHeaders",
      requestHeaders: Object.entries(ruleHeaders).map(([header, value]) => ({
        header,
        operation: "set" as const,
        value,
      })),
    },
    condition: {
      regexFilter: `^${escapeRegex(url)}$`,
      isUrlFilterCaseSensitive: true,
      resourceTypes: ["xmlhttprequest"],
      tabIds: [-1],
    },
  };
}

/** Parte de `chrome.declarativeNetRequest` que usamos (inyectable en pruebas). */
export interface SessionRulesApi {
  updateSessionRules(options: { addRules?: HeaderRule[]; removeRuleIds?: number[] }): Promise<void>;
  getSessionRules(): Promise<Array<{ id: number }>>;
}

export interface HeaderRules {
  /** Instala la regla de la URL y devuelve cómo retirarla. Sin cabeceras de regla no hace nada. */
  apply(url: string, ruleHeaders: Readonly<Record<string, string>>): Promise<() => Promise<void>>;
  /** Borra las reglas de sesiones anteriores (las de sesión sobreviven al reinicio del fondo). */
  reset(): Promise<void>;
}

export function createHeaderRules(api: SessionRulesApi): HeaderRules {
  let nextId = 1;

  return {
    async apply(url, ruleHeaders) {
      if (Object.keys(ruleHeaders).length === 0) return async () => {};
      const id = nextId++;
      await api.updateSessionRules({ addRules: [buildHeaderRule(id, url, ruleHeaders)] });
      return async () => {
        try {
          await api.updateSessionRules({ removeRuleIds: [id] });
        } catch {
          // Mejor esfuerzo: si no se puede retirar, `reset` la barre al arrancar.
        }
      };
    },
    async reset() {
      const existing = await api.getSessionRules();
      if (existing.length > 0) {
        await api.updateSessionRules({ removeRuleIds: existing.map((rule) => rule.id) });
      }
    },
  };
}
