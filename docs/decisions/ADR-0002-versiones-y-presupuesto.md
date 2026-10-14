# ADR-0002: Versiones y presupuesto de memoria (calibración de dispositivos)

- **Estado:** borrador — **pendiente de mediciones en los 3 dispositivos**
- **Fecha:** 2026-10-13
- **Tarea:** T05 (Fase 0)
- **Fuentes:** `docs/SPEC.md` §14 y §17.2; `tasks/todo.md` T05; registro npm (2026-10-13)

## Contexto

La Fase 0 exige fijar las versiones de Expo, React Native y React Native TV y medir el
presupuesto de memoria y el arranque en frío en los tres equipos de prueba, con la
**Xiaomi MiBox 4 (Android 9, 2 GB)** como piso de rendimiento. También hay que responder la
pregunta abierta del SPEC §17.2: **¿el SDK de Expo vigente admite Android 9 (API 28)?**

La app de calibración es un shell mínimo en `apps/mobile` (`@ryuunest/mobile`) que además
comprueba que las tres librerías JS puras del núcleo (`@noble/hashes`, `fflate` y
`htmlparser2`) corren en React Native.

> **Este ADR no está cerrado.** Las versiones de abajo son **candidatas** y las tablas de
> medición están vacías hasta que se ejecute la app en los tres dispositivos.

## Versiones candidatas (de `apps/mobile/package.json`)

| Componente | Versión | Estado |
|---|---|---|
| Expo SDK | `~57.0.28` | Candidata (última) |
| React Native | `0.86.3` | Candidata (la que fija el SDK 57) |
| React | `19.2.3` | Candidata (la que fija el SDK 57) |
| expo-status-bar | `~57.0.1` | Candidata |
| TypeScript | `~6.0.3` | Fijada (ver ADR-0001 y `MEMORY.md` P-34) |
| @noble/hashes | `^2.4.0` | Candidata |
| fflate | `^0.8.3` | Candidata |
| htmlparser2 | `^12.0.0` | Candidata |
| better-sqlite3 (dev/test) | `^13.0.3` | Candidata (aún no instalada) |
| react-native-tvos | `0.87.1-1` | **Pendiente de confirmar** contra el SDK 57 |

## Android mínimo (SPEC §17.2)

- **Objetivo:** Android 9 (API 28), para cubrir la MiBox 4 (SPEC §14, D-9).
- **A confirmar:** el `minSdkVersion` efectivo del SDK de Expo 57 (se configura con el
  plugin `expo-build-properties`). Rellenar aquí el valor medido y la decisión final.

| Pregunta | Respuesta | Fecha |
|---|---|---|
| ¿El SDK 57 admite API 28? | _pendiente_ | |
| `minSdkVersion` efectivo | _pendiente_ | |

## Arranque en frío y memoria

Medir con `adb shell am start -W` (arranque) y el perfil de memoria del sistema, o los
números que muestre la app. Rellenar una fila por dispositivo.

| Dispositivo | Android | Arranque en frío (ms) | Memoria (MB) | Notas |
|---|---|---|---|---|
| POCO F6 Pro | 12–15 | _pendiente_ | _pendiente_ | Equipo principal |
| Galaxy S25 Ultra | 12–15 | _pendiente_ | _pendiente_ | Equipo principal |
| Xiaomi MiBox 4 | 9 (API 28) | _pendiente_ | _pendiente_ | Piso de rendimiento (2 GB) |

**Tope de imágenes en memoria para la MiBox 4:** _pendiente_ (lo usará el lector, SPEC §9).

## Librerías JS puras en React Native

La app de calibración ejecuta estas comprobaciones y muestra OK/FALLO por dispositivo:

| Comprobación | POCO F6 Pro | Galaxy S25 Ultra | MiBox 4 |
|---|---|---|---|
| `@noble/hashes` · sha256 | _pendiente_ | _pendiente_ | _pendiente_ |
| `fflate` · gzip round-trip | _pendiente_ | _pendiente_ | _pendiente_ |
| `htmlparser2` · parse | _pendiente_ | _pendiente_ | _pendiente_ |

## Consecuencias

- Al cerrar la calibración, estas versiones pasan a **fijadas** y se replican en los demás
  paquetes cuando toque.
- Si el SDK 57 exigiera un `minSdk` mayor que 28, se decide entre degradar el SDK o cambiar
  el equipo mínimo (afecta a D-9 y a la MiBox 4) — se registra como decisión nueva.
- El presupuesto de memoria de la MiBox 4 condiciona las políticas del estado del lector
  (T27, SPEC §9).
