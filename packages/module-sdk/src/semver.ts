/** Comparación de versiones semver (sin dependencias). */

const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

export function isSemver(value: unknown): value is string {
  return typeof value === "string" && SEMVER.test(value);
}

/**
 * Compara dos versiones semver: negativo si `a < b`, positivo si `a > b`, 0 si son
 * iguales. Un `release` es mayor que su `prerelease`. Devuelve 0 si alguna no es semver.
 */
export function compareSemver(a: string, b: string): number {
  const left = SEMVER.exec(a);
  const right = SEMVER.exec(b);
  if (left === null || right === null) {
    return 0;
  }

  for (let index = 1; index <= 3; index += 1) {
    const aPart = Number(left[index] ?? 0);
    const bPart = Number(right[index] ?? 0);
    if (aPart !== bPart) {
      return aPart < bPart ? -1 : 1;
    }
  }

  const aPre = left[4];
  const bPre = right[4];
  if (aPre === undefined && bPre === undefined) {
    return 0;
  }
  if (aPre === undefined) {
    return 1;
  }
  if (bPre === undefined) {
    return -1;
  }
  if (aPre === bPre) {
    return 0;
  }
  return aPre < bPre ? -1 : 1;
}
