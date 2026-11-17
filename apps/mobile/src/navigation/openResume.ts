import { router } from "expo-router";
import { Platform } from "react-native";

import { resumeRoutes, type ResumeTarget } from "./resume";

/** Pausa entre los pushes de «Reanudar» (Detalles → lector). */
const RESUME_STEP_MS = 50;

/** P-155: abre la lectura donde se dejó (Inicio y «Ver todas»). Un push por ciclo: dos seguidos se pisan. */
export function openResume(item: ResumeTarget): void {
  resumeRoutes(item, Platform.OS).forEach((route, i) => {
    setTimeout(() => router.push(route), i * RESUME_STEP_MS);
  });
}
