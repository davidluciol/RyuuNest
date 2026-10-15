/**
 * Registro de repositorios de módulos (SPEC §3.1, RF-2, RF-3 y RF-8).
 *
 * Añade un repo por URL HTTPS, descarga y valida su `index.json`, lo persiste y lista
 * sus módulos con metadatos. El **validador entra inyectado** (`RepoIndexValidator`):
 * vive en `module-sdk` (SPEC §5.1) y el núcleo no puede importarlo (P-37).
 */
import { ModuleError } from "../contract/errors.js";
import type { RepoIndex } from "../contract/repoIndex.js";
import type { MediaKind } from "../contract/types.js";
import type { Clock } from "../ports/clock.js";
import type { Http } from "../ports/http.js";
import { httpErrorCode, httpErrorMessage } from "../ports/httpStatus.js";
import type { Storage } from "../ports/storage.js";
import type { ValidationResult } from "../validation.js";
import { describeIssues } from "../validation.js";

/** Validador de `index.json` (SPEC §6.7). Lo aporta `module-sdk`. */
export type RepoIndexValidator = (value: unknown) => ValidationResult<RepoIndex>;

/** Repositorio registrado (SPEC §8.1, tabla `repo`). */
export interface RepoRecord {
  /** Igual a la URL canónica: es la identidad estable del repo. */
  id: string;
  url: string;
  name: string;
  /** Milisegundos desde la época. */
  addedAt: number;
  /** Milisegundos desde la época. */
  updatedAt: number;
}

/** Módulo listado desde el índice de un repo (RF-3). */
export interface RepoModuleSummary {
  repoId: string;
  id: string;
  name: string;
  version: string;
  runtime: "declarative" | "script";
  kinds: MediaKind[];
  lang: string;
  nsfw: boolean;
  permissions: { domains: string[] };
  package: string;
  sha256: string;
  size: number;
}

/** Opciones del registro. */
export interface RepoRegistryOptions {
  storage: Storage;
  http: Http;
  clock: Clock;
  validateIndex: RepoIndexValidator;
}

/** Clave del registro de un repo. */
export function repoKey(id: string): string {
  return `repo:${id}`;
}

/** Clave del índice validado de un repo. */
export function repoIndexKey(id: string): string {
  return `repoIndex:${id}`;
}

/** Prefijo de las claves de registro. No choca con `repoIndex:` (falta los dos puntos). */
const REPO_PREFIX = "repo:";

/** Convierte la URL en su forma canónica y exige HTTPS (RF-2). */
function canonicalHttpsUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ModuleError("UNSUPPORTED", `URL de repositorio no válida: ${url}`, { url });
  }

  if (parsed.protocol !== "https:") {
    throw new ModuleError(
      "UNSUPPORTED",
      `El repositorio debe usar HTTPS (recibido ${parsed.protocol})`,
      { url },
    );
  }

  return parsed.href;
}

export class RepoRegistry {
  private readonly storage: Storage;
  private readonly http: Http;
  private readonly clock: Clock;
  private readonly validateIndex: RepoIndexValidator;

  constructor(options: RepoRegistryOptions) {
    this.storage = options.storage;
    this.http = options.http;
    this.clock = options.clock;
    this.validateIndex = options.validateIndex;
  }

  /** Añade (o refresca) un repo a partir de su `index.json` (RF-2). */
  async addRepo(url: string): Promise<RepoRecord> {
    const id = canonicalHttpsUrl(url);
    const index = await this.fetchIndex(id);
    const now = this.clock.now();
    const previous = await this.getRepo(id);

    const record: RepoRecord = {
      id,
      url: id,
      name: index.name,
      addedAt: previous?.addedAt ?? now,
      updatedAt: now,
    };

    await this.storage.set(repoKey(id), JSON.stringify(record));
    await this.storage.set(repoIndexKey(id), JSON.stringify(index));
    return record;
  }

  /** Todos los repos, ordenados por fecha de alta. */
  async listRepos(): Promise<RepoRecord[]> {
    const records: RepoRecord[] = [];

    for (const key of await this.storage.keys(REPO_PREFIX)) {
      const raw = await this.storage.get(key);
      if (raw !== undefined) {
        records.push(JSON.parse(raw) as RepoRecord);
      }
    }

    return records.sort((a, b) => a.addedAt - b.addedAt);
  }

  async getRepo(id: string): Promise<RepoRecord | undefined> {
    const raw = await this.storage.get(repoKey(id));
    return raw === undefined ? undefined : (JSON.parse(raw) as RepoRecord);
  }

  /** Módulos del índice (RF-3): de un repo o de todos. */
  async listModules(repoId?: string): Promise<RepoModuleSummary[]> {
    const ids = repoId === undefined ? (await this.listRepos()).map((repo) => repo.id) : [repoId];
    const modules: RepoModuleSummary[] = [];

    for (const id of ids) {
      const raw = await this.storage.get(repoIndexKey(id));
      if (raw === undefined) {
        continue;
      }
      const index = JSON.parse(raw) as RepoIndex;
      for (const entry of index.modules) {
        modules.push({ repoId: id, ...entry });
      }
    }

    return modules.sort((a, b) =>
      a.repoId === b.repoId ? a.id.localeCompare(b.id) : a.repoId.localeCompare(b.repoId),
    );
  }

  /** Elimina un repo y su índice (RF-8). No toca los módulos instalados. */
  async removeRepo(id: string): Promise<void> {
    await this.storage.delete(repoKey(id));
    await this.storage.delete(repoIndexKey(id));
  }

  /** Descarga, parsea y valida el `index.json`. */
  private async fetchIndex(url: string): Promise<RepoIndex> {
    const response = await this.http.request(url);
    if (response.status < 200 || response.status >= 300) {
      throw new ModuleError(
        httpErrorCode(response.status),
        httpErrorMessage(response.status, "Repositorio", url),
        {
          url,
          status: response.status,
        },
      );
    }

    const text = await response.text();
    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch {
      throw new ModuleError("PARSE", `index.json no es JSON válido: ${url}`, { url });
    }

    const result = this.validateIndex(value);
    if (!result.ok) {
      throw new ModuleError("PARSE", `index.json inválido: ${describeIssues(result.issues)}`, {
        url,
      });
    }

    return result.value;
  }
}
