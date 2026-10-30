/**
 * F21 — puerto de archivos del respaldo (RF-37/RF-38): tipos, nombre del archivo
 * y detección de plataforma. Sin plataforma: lo comparten `backupFiles.ts` (web),
 * `backupFiles.native.ts` (dispositivo), la pantalla y las pruebas.
 *
 * El módulo se llama distinto de las implementaciones a propósito. En Android e
 * iOS Metro resuelve `./backupFiles` a `backupFiles.native.ts`: un archivo
 * `.native` que importara de su hermano `.ts` se importaría a sí mismo, y quien
 * pidiera de `backupFiles` algo que solo existe en la variante web lo recibiría
 * sin definir (F21: Inicio caía al renderizar con «isNativePlatform is not a
 * function»). Lo compartido vive aquí; lo único que cambia por plataforma es
 * `createBackupFiles`, que ambas variantes exportan con el mismo nombre.
 * `tests/platformResolution.test.ts` vigila esta regla.
 *
 * El núcleo exporta e importa **texto** (`exportBackup`/`importBackup`); aquí
 * vive cómo ese texto llega a un archivo y vuelve de él:
 *
 * - Nativo (Android/iOS): escribe en la caché de la app con `expo-file-system`
 *   y abre la hoja del sistema con `expo-sharing` (F21a); para importar, el
 *   selector del sistema (`expo-document-picker`) entrega una URI que se lee
 *   de vuelta a texto (F21b).
 * - Web (galería, Playwright, cliente web futuro): no hay hoja del sistema ni
 *   selector nativo. Exportar descarga el JSON con un enlace; importar usa un
 *   `input type="file"` oculto.
 *
 * Nada de esto lo sabe la pantalla: le entran y salen textos.
 */

/** Resultado de compartir: se abrió la hoja, o el usuario la descartó. */
export type ShareResult = "shared" | "dismissed";

/** Resultado de elegir un archivo: el texto leído, o `null` si se canceló. */
export type PickResult = { text: string; name: string } | null;

/** Puerto de archivos del respaldo. */
export interface BackupFiles {
  /** Escribe el texto como `ryuunest-respaldo-<fecha>.json` y abre la hoja del sistema. */
  shareBackup(text: string): Promise<ShareResult>;
  /** Abre el selector del sistema y devuelve el texto del archivo elegido. */
  pickBackup(): Promise<PickResult>;
  /** Descarga el texto como archivo (web: la alternativa a la hoja del sistema). */
  downloadBackup(text: string, fileName: string): void;
}

/** Nombre de archivo del respaldo: `ryuunest-respaldo-2026-10-28.json`. */
export function backupFileName(now: Date = new Date()): string {
  const fecha = now.toISOString().slice(0, 10);
  return `ryuunest-respaldo-${fecha}.json`;
}

/** En web no hay hoja del sistema: la UI de respaldo usa la descarga directa. */
export function isNativePlatform(): boolean {
  // Sin importar `react-native` aquí: este módulo lo usan pruebas sin Metro
  // (MEMORY §5: Vitest no parsea el `index.js` de RN).
  return typeof document === "undefined";
}
