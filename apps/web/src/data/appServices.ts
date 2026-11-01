import {
  createErrorReporter,
  createFetchHttp,
  createFflateArchive,
  createLogStore,
  InstallFlow,
  ModuleRegistry,
  NoopSecureLock,
  PackageInstaller,
  RepoRegistry,
  SqliteStorage,
  type Archive,
  type Clock,
  type ErrorReporter,
  type Http,
  type LogStore,
  type SecureLock,
  type SqlDriver,
  type Storage,
} from "@ryuunest/core";
import { validateManifest, validateRepoIndex } from "@ryuunest/module-sdk";

import { createIdbByteStore, type ByteStore } from "./byteStore";
import { openWebDatabase } from "./webDatabase";

/**
 * F25 — composición de los servicios del cliente web sobre la base persistida
 * (sql.js + IndexedDB): registro de repos y módulos, instalador y flujo de
 * instalación con confirmación manual (AC-8), registro de diagnóstico (T36) y
 * reporter de errores de pantallas (F31, P-72).
 *
 * La red usa `fetch` directo **de forma temporal** (P-111): hasta que F27
 * conecte el puente a la extensión (SPEC §10), la descarga de repos/módulos
 * funciona donde el CORS lo permite (p. ej. GitHub raw) y el resto de dominios
 * puede quedar bloqueado; entonces el puerto `Http` se sustituye por el de la
 * extensión sin tocar las pantallas.
 */
export interface WebServices {
  readonly driver: SqlDriver;
  readonly storage: Storage;
  readonly http: Http;
  readonly archive: Archive;
  readonly clock: Clock;
  /** En web no hay bloqueo del dispositivo (SPEC §5.3): nunca disponible. */
  readonly secureLock: SecureLock;
  readonly logStore: LogStore;
  readonly reporter: ErrorReporter;
  readonly repos: RepoRegistry;
  readonly modules: ModuleRegistry;
  readonly installer: PackageInstaller;
  readonly flow: InstallFlow;
  flush(): Promise<void>;
}

export interface OpenWebServicesOptions {
  readonly byteStore?: ByteStore;
  /** Inyectable para pruebas (StubHttp) y para el puente a la extensión en F27. */
  readonly http?: Http;
  readonly locateFile?: (file: string) => string;
  readonly appVersion?: string;
  readonly platform?: string;
}

export async function openWebServices(options: OpenWebServicesOptions = {}): Promise<WebServices> {
  const byteStore =
    options.byteStore ??
    createIdbByteStore({ dbName: "ryuunest-web", store: "bytes", key: "ryuunest.db" });
  const { driver, flush } = await openWebDatabase({
    byteStore,
    ...(options.locateFile === undefined ? {} : { locateFile: options.locateFile }),
  });

  const storage = new SqliteStorage(driver);
  // TEMPORARY (P-111): fetch directo hasta el puente a la extensión (F27, SPEC §10).
  const http = options.http ?? createFetchHttp();
  const archive = createFflateArchive();
  const clock: Clock = { now: () => Date.now() };
  const appVersion = options.appVersion;
  const logStore = createLogStore({
    driver,
    clock,
    ...(appVersion === undefined ? {} : { appVersion }),
    platform: options.platform ?? "web",
  });
  const reporter = createErrorReporter(logStore);
  const repos = new RepoRegistry({
    storage,
    http,
    clock,
    validateIndex: (value) => validateRepoIndex(value, appVersion === undefined ? {} : { appVersion }),
  });
  const modules = new ModuleRegistry({ storage });
  const installer = new PackageInstaller({
    http,
    archive,
    storage,
    clock,
    validateManifest,
    ...(appVersion === undefined ? {} : { appVersion }),
  });
  const flow = new InstallFlow({ repos, installer, modules });
  const secureLock = new NoopSecureLock();

  return {
    driver,
    storage,
    http,
    archive,
    clock,
    secureLock,
    logStore,
    reporter,
    repos,
    modules,
    installer,
    flow,
    flush,
  };
}
