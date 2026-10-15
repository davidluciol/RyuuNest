# ADR-0002: Versiones y presupuesto de memoria (calibración de dispositivos)

- **Estado:** borrador — smokes **OK en los 2 teléfonos** (2026-10-14); **MiBox 4 pospuesta** (Android TV de lado, `MEMORY.md` P-43, alcance solo evidencia); quedan fijar las versiones y medir el tope de imágenes en un teléfono (provisional hasta repetirlo en la MiBox)
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
| --- | --- | --- |
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
- **Confirmado (2026-10-13):** el mínimo es Android 9 / API 28 y el SDK 57 lo admite
  (verificado en la MiBox 4). Se recomienda API 29/30 para producción; esa nota se añadirá
  al README tras la primera versión.

| Pregunta | Respuesta | Fecha |
| --- | --- | --- |
| ¿El SDK 57 admite API 28? | **Sí.** Confirmado por el humano en los 3 dispositivos (la MiBox 4 con Android 9 arranca). | 2026-10-13 |
| `minSdkVersion` efectivo | **28** (Android 9). Se adopta como mínimo del proyecto (D-9). Recomendación de API 29/30 para producción: se añadirá al README tras la primera versión. | 2026-10-13 |

## Arranque en frío y memoria

Medir con `adb shell am start -W` (arranque) y el perfil de memoria del sistema, o los
números que muestre la app. Rellenar una fila por dispositivo.

| Dispositivo | Android | Arranque en frío (ms) | Memoria (MB) | Notas |
| --- | --- | --- | --- | --- |
| POCO F5 Pro | 12–15 | 4580ms | 226mb | Equipo principal |
| Galaxy S25 Ultra | 12–15 | 1940ms | 140mb | Equipo principal |
| Xiaomi MiBox 4 | 9 (API 28) | 5600ms | 323mb | Piso de rendimiento (2 GB) |

**Tope de imágenes en memoria:** se mide **en un teléfono** (decisión 2026-10-14, con el
Android TV de lado) con el panel de calibración de `apps/mobile`, y queda como **constante
provisional**: se recalibra en la MiBox 4 cuando vuelva esa prueba. Lo usará el lector
(SPEC §9).

**Cómo se mide (panel de `apps/mobile`):**

1. `pnpm --filter @ryuunest/mobile exec expo start --clear` y abrir la app en el teléfono.
2. Bajar a «Tope de imágenes (T05)» y pulsar `+1` una vez: el panel sostiene N copias de
   `apps/mobile/assets/pagina-calibracion.png` (1440×3200, generada con
   `scripts/generate-pagina-calibracion.mjs`; el builder está en `src/calibrationPage.ts`).
3. Tras cada incremento: `adb shell dumpsys meminfo <paquete> | grep TOTAL` y anotar el PSS.
4. El **tope** es la mayor N estable: ni reinicio ni bloqueo de la app. Los bytes que ocupa
   cada imagen decodificada calcula `src/imageBudget.ts` (`tests/imageBudget.test.ts`).

| Dispositivo | PSS con N=1 | PSS con N=tope | Tope (N) | MB por imagen |
| --- | --- | --- | --- | --- |
| Galaxy S25 Ultra / POCO F5 Pro | _pendiente_ | _pendiente_ | _pendiente_ | _pendiente_ |

> ⚠ **Cuidado al leer esta tabla:** las mediciones se hicieron con la app **en desarrollo**
> (Expo Go + Metro, ver la captura con el menú de Expo). RNF-1 (`< 3 s` en frío) apunta al
> **APK compilado**, así que hay que revalidar en release antes de dar RNF-1 por cumplido.

## Librerías JS puras en React Native

La app de calibración ejecuta estas comprobaciones y muestra OK/FALLO por dispositivo:

| Comprobación | POCO F5 Pro | Galaxy S25 Ultra | MiBox 4 |
| --- | --- | --- | --- |
| `@noble/hashes` · sha256 | **OK** (2026-10-14) | **OK** (2026-10-14) | _pospuesto_ (P-43) |
| `fflate` · gzip round-trip | **OK** (2026-10-14) | **OK** (2026-10-14) | _pospuesto_ (P-43) |
| `htmlparser2` · parse | **OK** (2026-10-14) | **OK** (2026-10-14) | _pospuesto_ (P-43) |

**Evidencia:** `docs/capturasT05/Samsung_s25Ultra.jpeg` (Galaxy S25 Ultra: «Módulo cargado +314490 ms · 3/3 comprobaciones» con las tres filas `OK`) y la misma prueba **3/3 OK** en el POCO, hecha en mano sin captura.

> ⚠ **Modelo confirmado: POCO F5 Pro** (2026-10-14, el humano). El proyecto venía diciendo
> «F6 Pro» por error; se corrigió en SPEC, `AGENTS.md` y decisiones (`MEMORY.md` P-44).
> ⚠ **Android TV (MiBox 4) queda de lado de momento** (`MEMORY.md` P-43), con alcance **solo
> de evidencia**: la MiBox **sigue siendo el equipo mínimo** (D-9, `minSdk` 28). Sus casillas
> de smokes y el tope de imágenes quedan pendientes de tenerla en mano.

## Consecuencias

- Al cerrar la calibración, estas versiones pasan a **fijadas** y se replican en los demás
  paquetes cuando toque.
- Si el SDK 57 exigiera un `minSdk` mayor que 28, se decide entre degradar el SDK o cambiar
  el equipo mínimo (afecta a D-9 y a la MiBox 4) — se registra como decisión nueva.
- El presupuesto de memoria de la MiBox 4 condiciona las políticas del estado del lector
  (T27, SPEC §9).
