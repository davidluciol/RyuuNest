import { useEffect } from "react";
import type { ChallengeSolution } from "@ryuunest/core";

/** Props del navegador de verificación (F100). */
export interface ChallengeBrowserProps {
  url: string;
  host: string;
  /** Dominios del módulo: la navegación principal no sale de ellos. */
  domains: readonly string[];
  onFinish: (solution: ChallengeSolution | null) => void;
}

/** F100 — en web no hay navegador de verificación: se cierra sin guardar nada. */
export default function ChallengeBrowser({ onFinish }: ChallengeBrowserProps) {
  useEffect(() => onFinish(null), [onFinish]);
  return null;
}
