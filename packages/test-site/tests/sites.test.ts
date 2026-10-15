import { describe, expect, it } from "vitest";

import {
  createHtmlSite,
  createJsonApiSite,
  createSiteHttp,
  FIXTURE_DEFAULTS,
  FIXTURE_SERIES,
  HTML_SITE_BASE_URL,
  JSON_API_BASE_URL,
  JSON_API_IMAGE_HEADERS,
} from "../src/index";

const seriesTitle = FIXTURE_SERIES[0]?.title ?? "";
const [releaseA = "", releaseB = ""] = FIXTURE_DEFAULTS.releaseIds;

async function body(url: string): Promise<{ status: number; text: string }> {
  const site = url.startsWith(HTML_SITE_BASE_URL) ? createHtmlSite() : createJsonApiSite();
  const response = await createSiteHttp(site).request(url);
  return { status: response.status, text: await response.text() };
}

describe("sitio falso · arquitectura HTML", () => {
  it("sirve la primera y la última página de `popular`", async () => {
    const first = await body(`${HTML_SITE_BASE_URL}/popular?page=1`);
    expect(first.status).toBe(200);
    expect(first.text).toContain(seriesTitle);
    expect(first.text).toContain('class="next"');

    const last = await body(`${HTML_SITE_BASE_URL}/popular?page=2`);
    expect(last.status).toBe(200);
    expect(last.text).not.toContain('class="next"');
  });

  it("sirve la ficha de una serie con sus capítulos y releases", async () => {
    const detail = await body(`${HTML_SITE_BASE_URL}/serie/${FIXTURE_DEFAULTS.seriesId}`);
    expect(detail.status).toBe(200);
    expect(detail.text).toContain(`data-serie-id="${FIXTURE_DEFAULTS.seriesId}"`);
    expect(detail.text).toContain(`data-chapter-id="${FIXTURE_DEFAULTS.chapterId}"`);
    expect(detail.text).toContain(`data-release-id="${releaseA}"`);
    expect(detail.text).toContain(`data-release-id="${releaseB}"`);
  });

  it("sirve las páginas de un capítulo y un release", async () => {
    const page = await body(`${HTML_SITE_BASE_URL}/leer/${FIXTURE_DEFAULTS.chapterId}/${releaseA}`);
    expect(page.status).toBe(200);
    expect(page.text).toContain('class="pagina"');
  });

  it("responde 404 a rutas y orígenes desconocidos", async () => {
    expect((await body(`${HTML_SITE_BASE_URL}/no-existe`)).status).toBe(404);
    expect((await body("https://otro-sitio.test/popular?page=1")).status).toBe(404);
  });
});

describe("sitio falso · arquitectura JSON con cursor", () => {
  it("pagina con cursor en lugar de número de página", async () => {
    const first = await body(`${JSON_API_BASE_URL}/api/popular`);
    expect(first.status).toBe(200);
    const firstPayload = JSON.parse(first.text) as { items: unknown[]; next: string | null };
    expect(firstPayload.items.length).toBeGreaterThan(0);
    expect(typeof firstPayload.next).toBe("string");

    const second = await body(`${JSON_API_BASE_URL}/api/popular?cursor=${firstPayload.next ?? ""}`);
    const secondPayload = JSON.parse(second.text) as { items: unknown[]; next: string | null };
    expect(secondPayload.items.length).toBeGreaterThan(0);
    expect(secondPayload.next).toBeNull();
  });

  it("devuelve las imágenes con cabeceras exigidas por el sitio", async () => {
    const pagesUrl = `${JSON_API_BASE_URL}/api/pages/${FIXTURE_DEFAULTS.chapterId}/${releaseA}`;
    const payload = JSON.parse((await body(pagesUrl)).text) as {
      images: Array<{ url: string; headers?: Record<string, string> }>;
    };

    expect(payload.images.length).toBeGreaterThan(0);
    expect(payload.images[0]?.headers).toMatchObject(JSON_API_IMAGE_HEADERS);
  });

  it("filtra la búsqueda sin distinguir acentos ni mayúsculas", async () => {
    const payload = JSON.parse(
      (
        await body(
          `${JSON_API_BASE_URL}/api/search?q=${encodeURIComponent(FIXTURE_DEFAULTS.searchQuery)}`,
        )
      ).text,
    ) as { items: Array<{ id: string }> };

    expect(payload.items.map((item) => item.id)).toContain(FIXTURE_DEFAULTS.seriesId);
  });
});
