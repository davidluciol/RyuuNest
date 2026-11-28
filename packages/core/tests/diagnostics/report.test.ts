import { describe, expect, it } from "vitest";

import {
  GITHUB_URL_MAX,
  MAILTO_URL_MAX,
  REPORT_DETAILS_MAX,
  buildErrorReport,
  githubIssueUrl,
  mailtoUrl,
  normalizeForFingerprint,
  reportFingerprint,
  type ErrorReportInput,
} from "../../src/diagnostics/report";

/**
 * F103 — «Mandar reporte»: el usuario revisa el texto y lo envía a mano por
 * GitHub o por correo (P-198, RNF-5). Aquí, la parte pura: limpieza, huella
 * para agrupar duplicados y los enlaces de cada canal con su tope de largo.
 */
const base: ErrorReportInput = {
  code: "TIMEOUT",
  message: "Sin respuesta tras 30123 ms en https://m440.in/manga/kusuriya?page=3",
  stack: [
    "Error: TIMEOUT",
    "    at fetchPage (module.js:120:15)",
    "    at async pages (module.js:88:3)",
    "    at async load (reader.js:41:9)",
    "    at async run (host.js:7:1)",
  ].join("\n"),
  moduleId: "m440",
  moduleVersion: "0.2.2",
  appVersion: "1.0.0",
  platform: "Android 14",
  date: "2026-11-27T22:00:00.000Z",
};

describe("normalizeForFingerprint", () => {
  it("quita números, URLs, hashes, rutas y comillas", () => {
    expect(
      normalizeForFingerprint(
        'Falló "Kusuriya" tras 30123 ms en https://x.io/a/1 hash 9f86d081884c7d65 /data/user/0/app',
      ),
    ).toBe("falló tras ms en hash");
  });
});

describe("reportFingerprint", () => {
  it("son 12 caracteres hexadecimales", () => {
    expect(reportFingerprint(base)).toMatch(/^[0-9a-f]{12}$/);
  });

  it("el mismo error con otros números, URL o parche del módulo da la misma huella", () => {
    const same = {
      ...base,
      message: "Sin respuesta tras 29870 ms en https://m440.in/manga/otra?page=9",
      moduleVersion: "0.2.7",
      stack: base.stack?.replace("120:15", "131:2"),
    };
    expect(reportFingerprint(same)).toBe(reportFingerprint(base));
  });

  it("otro código, otro módulo, otra versión menor u otra pila dan otra huella", () => {
    const fp = reportFingerprint(base);
    expect(reportFingerprint({ ...base, code: "NETWORK" })).not.toBe(fp);
    expect(reportFingerprint({ ...base, moduleId: "zonatmo" })).not.toBe(fp);
    expect(reportFingerprint({ ...base, moduleVersion: "0.3.0" })).not.toBe(fp);
    expect(reportFingerprint({ ...base, stack: "Error\n    at otra (x.js:1:1)" })).not.toBe(fp);
  });

  it("solo cuentan los 3 primeros marcos de la pila", () => {
    const deeper = { ...base, stack: `${base.stack}\n    at extra (otro.js:1:1)` };
    expect(reportFingerprint(deeper)).toBe(reportFingerprint(base));
  });
});

describe("buildErrorReport", () => {
  it("el título lleva la huella, el código y el módulo con su versión mayor.menor", () => {
    const report = buildErrorReport(base);
    expect(report.title).toBe(`[fp:${report.fingerprint}] TIMEOUT en m440 0.2`);
  });

  it("sin módulo, el título solo lleva la huella y el código", () => {
    const report = buildErrorReport({ ...base, moduleId: undefined, moduleVersion: undefined });
    expect(report.title).toBe(`[fp:${report.fingerprint}] TIMEOUT`);
  });

  it("el cuerpo trae los datos obligatorios y la huella", () => {
    const { body, fingerprint } = buildErrorReport(base);
    for (const text of [
      "TIMEOUT",
      "m440 0.2.2",
      "1.0.0",
      "Android 14",
      "2026-11-27T22:00:00.000Z",
    ]) {
      expect(body).toContain(text);
    }
    expect(body).toContain(`fp:${fingerprint}`);
  });

  it("limpia URLs, dominios, cabeceras, HTML y rutas del mensaje, los detalles y el registro", () => {
    const { body } = buildErrorReport({
      ...base,
      message: "403 en fanfox.net con Cookie: cf_clearance=abc123 <b>x</b>",
      details: "Pasó en https://zonatmo.com/library/manhwa/30664 y C:\\Users\\yo\\app",
      log: ["GET mangation.net/serie/12 → 500", "Authorization: Bearer secreto"],
    });
    for (const leak of [
      "fanfox.net",
      "cf_clearance",
      "abc123",
      "<b>",
      "zonatmo.com",
      "30664",
      "C:\\Users",
      "mangation.net",
      "secreto",
    ]) {
      expect(body).not.toContain(leak);
    }
  });

  it("recorta los detalles del usuario a su tope", () => {
    const { body } = buildErrorReport({ ...base, details: "a".repeat(REPORT_DETAILS_MAX + 500) });
    expect(body).not.toContain("a".repeat(REPORT_DETAILS_MAX + 1));
  });
});

describe("enlaces de envío", () => {
  const log = Array.from({ length: 400 }, (_, i) => `entrada ${i} ${"x".repeat(40)}`);

  it("GitHub abre issues/new del repo con título y cuerpo", () => {
    const report = buildErrorReport(base);
    const url = githubIssueUrl("https://github.com/davidluciol/RyuuNest", report);
    const [path, query = ""] = url.split("?");
    expect(path).toBe("https://github.com/davidluciol/RyuuNest/issues/new");
    const params = new URLSearchParams(query);
    expect(params.get("title")).toBe(report.title);
    expect(params.get("body")).toBe(report.body);
  });

  it("correo: mailto con asunto y cuerpo", () => {
    const report = buildErrorReport(base);
    const url = mailtoUrl("potigameplays@gmail.com", report);
    expect(url.startsWith("mailto:potigameplays@gmail.com?")).toBe(true);
    const params = new URLSearchParams(url.slice(url.indexOf("?") + 1));
    expect(params.get("subject")).toBe(report.title);
    expect(params.get("body")).toBe(report.body);
    expect(url).not.toContain("+"); // los espacios van como %20 (algunas apps de correo muestran «+»)
  });

  it("si no cabe, se recorta el registro desde lo más viejo y nunca se pasa del tope", () => {
    const report = buildErrorReport({ ...base, log });
    const github = githubIssueUrl("https://github.com/davidluciol/RyuuNest", report);
    const mail = mailtoUrl("potigameplays@gmail.com", report);
    expect(github.length).toBeLessThanOrEqual(GITHUB_URL_MAX);
    expect(mail.length).toBeLessThanOrEqual(MAILTO_URL_MAX);
    expect(decodeURIComponent(mail)).toContain("entrada 399");
    expect(decodeURIComponent(mail)).not.toContain("entrada 0 ");
    expect(decodeURIComponent(mail)).toContain(`fp:${report.fingerprint}`);
  });
});
