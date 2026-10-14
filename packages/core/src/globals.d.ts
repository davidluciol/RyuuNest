/**
 * Globales mínimos que el núcleo usa y que existen en todos los entornos
 * objetivo (Node, React Native/Hermes y navegador).
 *
 * Se declaran aquí a propósito para no arrastrar las libs `DOM` ni `@types/node`,
 * que abrirían APIs de plataforma al núcleo. Este archivo no se emite a `dist/`,
 * así que no afecta a quien consume el paquete.
 */
declare function setTimeout(handler: () => void, timeout?: number): number;
declare function clearTimeout(id: number | undefined): void;

interface URL {
  readonly protocol: string;
  readonly hostname: string;
}

declare const URL: {
  new (input: string, base?: string): URL;
};
