/**
 * F25/F27 — grafo del paquete ES de un módulo `script` (ADR-0003, D1-A). El
 * cargador web crea un **blob URL por archivo** (en orden de dependencias) y
 * reescribe los `import` relativos para que apunten a la URL del archivo
 * destino; así un paquete multi-archivo carga en un Web Worker sin bundler.
 *
 * Todo aquí es puro y se prueba en Node; el worker real solo vive en el
 * navegador (e2e).
 */

/** Resuelve un especificador relativo contra la ruta POSIX del archivo que importa. */
export function resolveImport(fromPath: string, specifier: string): string {
  const base = fromPath.split("/").slice(0, -1);
  for (const segment of specifier.split("/")) {
    if (segment === "." || segment === "") continue;
    if (segment === "..") base.pop();
    else base.push(segment);
  }
  return base.join("/");
}

/**
 * Sentencias de import ancladas a inicio de línea o tras `;`: estáticas
 * (`import … from "…"`, `import "…"`, `export … from "…"`) y dinámicas
 * (`import("…")`). Anclar evita confundir literales de texto que contengan
 * «from» o «import» con imports reales.
 */
const IMPORT_RE =
  /(?:^|[;\n\r])\s*(?:import|export)\b[^;\n]*?\bfrom\s*(["'])([^"']+)\1|(?:^|[;\n\r])\s*import\s*(["'])([^"']+)\3|\bimport\s*\(\s*(["'])([^"']+)\5\s*\)/g;

/** Todos los especificadores de import de `code` (relativos o de paquete). */
export function allImports(code: string): string[] {
  const found: string[] = [];
  for (const match of code.matchAll(IMPORT_RE)) {
    const specifier = match[2] ?? match[4] ?? match[6] ?? "";
    if (specifier !== "") found.push(specifier);
  }
  return found;
}

/** Especificadores relativos (del paquete) de un código fuente. */
export function packageImports(code: string): string[] {
  return allImports(code).filter((specifier) => specifier.startsWith("."));
}

/**
 * Orden de carga (post-orden DFS desde `entry`): cada archivo va después de
 * todo lo que importa. Lanza con aviso claro si falta un archivo o hay ciclo.
 */
export function buildLoadOrder(files: Record<string, string>, entry: string): string[] {
  const order: string[] = [];
  const state = new Map<string, "visiting" | "done">();

  function visit(path: string): void {
    const current = state.get(path);
    if (current === "done") return;
    if (current === "visiting") throw new Error(`Ciclo de imports detectado en «${path}»`);
    const code = files[path];
    if (code === undefined) throw new Error(`El paquete no trae el archivo importado «${path}»`);
    state.set(path, "visiting");
    for (const specifier of packageImports(code)) {
      visit(resolveImport(path, specifier));
    }
    state.set(path, "done");
    order.push(path);
  }

  visit(entry);
  return order;
}

/**
 * Reescribe los import relativos de `code` (archivo `fromPath`) con
 * `urlFor(rutaResuelta)`. Los especificadores de paquete y los literales que
 * no son import quedan intactos.
 */
export function rewriteImports(
  code: string,
  fromPath: string,
  urlFor: (resolvedPath: string) => string,
): string {
  return code.replace(IMPORT_RE, (whole, q1: string, spec1: string, q2: string, spec2: string, q3: string, spec3: string) => {
    const quote = q1 ?? q2 ?? q3;
    const specifier = spec1 ?? spec2 ?? spec3;
    if (!specifier.startsWith(".")) return whole;
    const resolved = resolveImport(fromPath, specifier);
    return whole.replace(`${quote}${specifier}${quote}`, `${quote}${urlFor(resolved)}${quote}`);
  });
}
