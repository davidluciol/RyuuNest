/**
 * Instalador de paquetes (SPEC §7.1): descarga el `.zip`, verifica el hash, descomprime
 * de forma segura, valida el manifest y guarda el paquete **de forma atómica**.
 *
 * El validador de manifest entra inyectado (`ManifestValidator`, P-46): vive en
 * `module-sdk` (SPEC §5.1) y el núcleo no puede importarlo (P-37).
 *
 * Atomicidad: todas las comprobaciones (tamaño, hash, rutas, límites, manifest) ocurren
 * **antes** de la única escritura (`module:<id>`). Si algo falla, el almacén no cambia.
 */
import { toHex, utf8Decode } from "../bytes.js";
import { ModuleError } from "../contract/errors.js";
import type { MediaKind, ModuleManifest } from "../contract/types.js";
import type { Archive, ArchiveEntry } from "../ports/archive.js";
import type { Clock } from "../ports/clock.js";
import type { Http } from "../ports/http.js";
import { httpErrorCode, httpErrorMessage } from "../ports/httpStatus.js";
import type { Storage } from "../ports/storage.js";
import { describeIssues, type ValidationResult } from "../validation.js";
import {
  assertSafeEntryPath,
  assertUnpackedLimits,
  INSTALL_LIMITS,
  sha256Hex,
  type InstallLimits,
} from "./verify.js";

/** Opciones para el validador de manifest (`module-sdk`). */
export interface ManifestValidateOptions {
  appVersion?: string;
}

/** Validador de manifest (SPEC §6.1). Lo aporta `module-sdk`. */
export type ManifestValidator = (
  value: unknown,
  options?: ManifestValidateOptions,
) => ValidationResult<ModuleManifest>;

/** Petición de instalación: lo que el índice del repo dice del paquete. */
export interface InstallRequest {
  /** URL del `index.json` del repo: base para resolver `package`. */
  repoUrl: string;
  /** Ruta del `.zip` dentro del repo (SPEC §6.7). */
  package: string;
  /** SHA-256 esperado del paquete, en hexadecimal. */
  sha256: string;
  /** Tamaño esperado del paquete, en bytes. */
  size: number;
}

/** Archivo de un paquete instalado. */
export interface PackageFile {
  path: string;
  /** Contenido en hexadecimal (el puerto `Storage` provisional es de texto). */
  hex: string;
}

/** Paquete instalado y guardado (SPEC §7.1, paso 8). */
export interface InstalledPackage {
  id: string;
  version: string;
  /** URL del repo del que salió. */
  repoUrl: string;
  runtime: "declarative" | "script";
  kinds: MediaKind[];
  lang: string;
  nsfw: boolean;
  permissions: { domains: string[] };
  manifest: ModuleManifest;
  files: PackageFile[];
  /** Milisegundos desde la época. */
  installedAt: number;
  /**
   * Ciclo de vida (SPEC §8.1, tabla `module`): lo gobierna el registro de módulos (T14).
   * El instalador siempre deja el módulo activado.
   */
  enabled: boolean;
  /** Último error del módulo, si lo hubo (RF-5, RNF-8). */
  lastError?: string;
}

/** Opciones del instalador. */
export interface PackageInstallerOptions {
  http: Http;
  archive: Archive;
  storage: Storage;
  clock: Clock;
  validateManifest: ManifestValidator;
  /** Versión de la app, para comprobar `minAppVersion`. */
  appVersion?: string;
  limits?: Partial<InstallLimits>;
}

/** Clave del almacén donde vive un paquete instalado. */
export function moduleKey(id: string): string {
  return `module:${id}`;
}

/** Normaliza la ruta de una entrada: barras normales y sin `./` inicial. */
function normalizeEntryPath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\.\//, "");
}

/** Resuelve la ruta del paquete contra la URL del repo y exige HTTPS (SPEC §7.2). */
function resolveHttpsUrl(reference: string, base: string): string {
  let resolved: URL;
  try {
    resolved = new URL(reference, base);
  } catch {
    throw new ModuleError("UNSUPPORTED", `URL de paquete no válida: ${reference}`, {
      url: reference,
    });
  }

  if (resolved.protocol !== "https:") {
    throw new ModuleError(
      "UNSUPPORTED",
      `El paquete debe servirse por HTTPS (recibido ${resolved.protocol})`,
      { url: resolved.href },
    );
  }

  return resolved.href;
}

export class PackageInstaller {
  private readonly http: Http;
  private readonly archive: Archive;
  private readonly storage: Storage;
  private readonly clock: Clock;
  private readonly validateManifest: ManifestValidator;
  private readonly appVersion: string | undefined;
  private readonly limits: InstallLimits;

  constructor(options: PackageInstallerOptions) {
    this.http = options.http;
    this.archive = options.archive;
    this.storage = options.storage;
    this.clock = options.clock;
    this.validateManifest = options.validateManifest;
    this.appVersion = options.appVersion;
    this.limits = { ...INSTALL_LIMITS, ...options.limits };
  }

  /** Descarga y valida el paquete, y lo guarda si todo pasa (SPEC §7.1). */
  async install(request: InstallRequest): Promise<InstalledPackage> {
    if (request.size > this.limits.packageBytes) {
      throw new ModuleError(
        "UNSUPPORTED",
        `El paquete declara ${request.size} bytes y el tope es ${this.limits.packageBytes} bytes`,
        { url: request.package },
      );
    }

    const url = resolveHttpsUrl(request.package, request.repoUrl);
    const bytes = await this.download(url);

    if (bytes.length > this.limits.packageBytes) {
      throw new ModuleError(
        "UNSUPPORTED",
        `El paquete descargado ocupa ${bytes.length} bytes y el tope es ${this.limits.packageBytes} bytes`,
        { url },
      );
    }

    if (sha256Hex(bytes).toLowerCase() !== request.sha256.toLowerCase()) {
      throw new ModuleError("PARSE", `El paquete no coincide con el hash esperado: ${url}`, {
        url,
      });
    }

    const entries = await this.unzip(bytes, url);
    for (const entry of entries) {
      assertSafeEntryPath(entry.path);
    }
    assertUnpackedLimits(entries, this.limits);

    const manifest = this.readManifest(entries, url);
    const entryPath = normalizeEntryPath(manifest.entry);
    if (!entries.some((entry) => normalizeEntryPath(entry.path) === entryPath)) {
      throw new ModuleError(
        "PARSE",
        `Al paquete le falta el archivo de entrada «${manifest.entry}»`,
        { url },
      );
    }

    const installed: InstalledPackage = {
      id: manifest.id,
      version: manifest.version,
      repoUrl: request.repoUrl,
      runtime: manifest.runtime,
      kinds: manifest.kinds,
      lang: manifest.lang,
      nsfw: manifest.nsfw,
      permissions: manifest.permissions,
      manifest,
      files: entries
        .map((entry) => ({ path: normalizeEntryPath(entry.path), hex: toHex(entry.data) }))
        .sort((a, b) => a.path.localeCompare(b.path)),
      installedAt: this.clock.now(),
      enabled: true,
    };

    await this.storage.set(moduleKey(manifest.id), JSON.stringify(installed));
    return installed;
  }

  /** Descarga el `.zip` y traduce los fallos de red y de estado. */
  private async download(url: string): Promise<Uint8Array> {
    let response;
    try {
      response = await this.http.request(url);
    } catch (error) {
      if (error instanceof ModuleError) {
        throw error;
      }
      throw new ModuleError("NETWORK", `Fallo de red al descargar ${url}`, { url });
    }

    if (response.status < 200 || response.status >= 300) {
      throw new ModuleError(
        httpErrorCode(response.status),
        httpErrorMessage(response.status, "Paquete", url),
        { url, status: response.status },
      );
    }

    return response.bytes();
  }

  /** Descomprime el paquete, sin dejar que un zip roto rompa la app. */
  private async unzip(bytes: Uint8Array, url: string): Promise<ArchiveEntry[]> {
    try {
      return await this.archive.unzip(bytes);
    } catch (error) {
      if (error instanceof ModuleError) {
        throw error;
      }
      throw new ModuleError("PARSE", `No se pudo descomprimir el paquete: ${url}`, { url });
    }
  }

  /** Lee y valida `manifest.json` (SPEC §7.1, paso 7). */
  private readManifest(entries: readonly ArchiveEntry[], url: string): ModuleManifest {
    const entry = entries.find(
      (candidate) => normalizeEntryPath(candidate.path) === "manifest.json",
    );
    if (entry === undefined) {
      throw new ModuleError("PARSE", `El paquete no trae manifest.json: ${url}`, { url });
    }

    let value: unknown;
    try {
      value = JSON.parse(utf8Decode(entry.data));
    } catch {
      throw new ModuleError("PARSE", `El manifest.json del paquete no es JSON válido: ${url}`, {
        url,
      });
    }

    const options = this.appVersion === undefined ? undefined : { appVersion: this.appVersion };
    const result = this.validateManifest(value, options);
    if (!result.ok) {
      throw new ModuleError("PARSE", `Manifest inválido: ${describeIssues(result.issues)}`, {
        url,
      });
    }

    return result.value;
  }
}

export { INSTALL_LIMITS };
export type { InstallLimits };
