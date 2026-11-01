import {
  createErrorReporter,
  createFflateArchive,
  createLogStore,
  createInstalledMounter,
  InstallFlow,
  ModuleRegistry,
  type ModuleMounter,
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

import {
  createBrowserChannel,
  createExtensionHttp,
  type ExtensionHttpOptions,
} from "../ports/extensionHttp";
import { createExtensionStatus, type ExtensionStatusStore } from "../ports/extensionStatus";
import { createIdbByteStore, type ByteStore } from "./byteStore";
import { openWebDatabase } from "./webDatabase";
import { createWebScriptLoader } from "./webScriptLoader";

/**
 * F25 — composición de los servicios del cliente web sobre la base persistida
 * (sql.js + IndexedDB): registro de repos y módulos, instalador y flujo de
 * instalación con confirmación manual (AC-8), registro de diagnóstico (T36) y
 * reporter de errores de pantallas (F31, P-72).
 *
 * F27 — **toda** la red pasa por la extensión de navegador (SPEC §10): el puerto
 * `Http` por defecto son mensajes a la extensión (`ports/extensionHttp`), sin
 * `fetch` directo. Esto retira el TEMPORARY de P-111. Las pantallas no cambian:
 * leen el estado de la extensión (`extension.status`) para avisar de lo accionable.
 */
export interface WebServices {
  readonly driver: SqlDriver;
  readonly storage: Storage;
  readonly http: Http;
  /** Estado de la extensión de navegador y acceso a su página de opciones. */
  readonly extension: {
    readonly status: ExtensionStatusStore;
    /** Comprueba que la extensión está (actualiza `status`). */
    detect(): Promise<boolean>;
    openOptions(domain?: string): Promise<void>;
  };
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
  /** Monta módulos instalados (declarativos y, con el worker, `script`). */
  readonly mounter: ModuleMounter;
  flush(): Promise<void>;
}

export interface OpenWebServicesOptions {
  readonly byteStore?: ByteStore;
  /** Inyectable en pruebas (StubHttp); por defecto, la red va por la extensión. */
  readonly http?: Http;
  /** Canal y tiempos del puente a la extensión (inyectables en pruebas). */
  readonly extension?: Partial<
    Pick<ExtensionHttpOptions, "channel" | "detectTimeoutMs" | "requestTimeoutMs" | "newId">
  >;
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
  const extensionStatus = createExtensionStatus();
  const extensionHttp = createExtensionHttp({
    channel: options.extension?.channel ?? createBrowserChannel(),
    status: extensionStatus,
    ...(options.extension?.detectTimeoutMs === undefined
      ? {}
      : { detectTimeoutMs: options.extension.detectTimeoutMs }),
    ...(options.extension?.requestTimeoutMs === undefined
      ? {}
      : { requestTimeoutMs: options.extension.requestTimeoutMs }),
    ...(options.extension?.newId === undefined ? {} : { newId: options.extension.newId }),
  });
  const http = options.http ?? extensionHttp;
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
  const mounter = createInstalledMounter({ driver, http, loader: createWebScriptLoader() });

  return {
    driver,
    storage,
    http,
    extension: {
      status: extensionStatus,
      detect: () => extensionHttp.detect(),
      openOptions: (domain) => extensionHttp.openOptions(domain),
    },
    archive,
    clock,
    secureLock,
    logStore,
    reporter,
    repos,
    modules,
    installer,
    flow,
    mounter,
    flush,
  };
}
