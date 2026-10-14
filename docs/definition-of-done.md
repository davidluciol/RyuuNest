# Definición de terminado (DoD)

Una tarea de `tasks/todo.md` está **terminada** solo cuando cumple **todo** lo siguiente.
Es la barra común: cada incremento la respeta, no solo el final de la fase
(`AGENTS.md` §8; `tasks/plan.md` §10).

## 1. Alcance y criterios

- [ ] Se cumplen **todos** los criterios de aceptación de la tarea.
- [ ] Se ejecutaron los pasos de verificación de la tarea.
- [ ] El cambio hace **una** cosa y la hace completa; no se tocó nada fuera del alcance.
- [ ] Si algo se notó fuera de alcance, se anotó como tarea aparte (no se arregló «de paso»).

## 2. Calidad (en verde)

- [ ] `pnpm lint` pasa.
- [ ] `pnpm -r typecheck` pasa (TypeScript estricto).
- [ ] `pnpm -r test` pasa, con las pruebas nuevas de la tarea.
- [ ] `pnpm -r build` compila.
- [ ] No hay `any` sin justificar ni código muerto.

## 3. Pruebas

- [ ] Hay pruebas que fallarían si se quita la funcionalidad (no pruebas tautológicas).
- [ ] Las pruebas verifican comportamiento a través de las interfaces públicas acordadas.
- [ ] El contrato de módulos se prueba contra fixtures, nunca contra sitios reales.

## 4. Documentación

- [ ] `MEMORY.md` tiene la entrada de la sesión (qué se hizo, decisiones, siguiente paso).
- [ ] Las decisiones nuevas o cambiadas quedan registradas por su ID (`D-n` del SPEC o
      `P-n` de `MEMORY.md`); nunca por el `P-n` local de `tasks/plan.md`.
- [ ] Si aplica, se añadió o actualizó un ADR en `docs/decisions/`.
- [ ] La documentación afectada (`SPEC.md`, `CONTRIBUTING.md`, `ASSETS.md`…) está coherente.

## 5. Interfaz (solo si la tarea toca UI)

- [ ] Pantallas tocadas verificadas con **Playwright** (web/galería), o anotado que falta la
      verificación nativa (`AGENTS.md` §5).
- [ ] Componentes nuevos o ampliados añadidos a la **galería** con todos sus estados.
- [ ] Ningún color ni medida literal fuera de `ui-tokens`.
- [ ] Textos en el archivo de traducciones; ninguno literal en los componentes.
- [ ] Diferencias aceptadas registradas en `design/stitch/DIFFS.md`.

## 6. Git

- [ ] Un commit por tarea, con mensaje descriptivo (Conventional Commits, en español).
- [ ] Se prepararon solo los archivos de la tarea.
- [ ] No quedan cambios sin confirmar del trabajo de la tarea.

## Cierre de sesión

Además, al cerrar la sesión (`AGENTS.md` §8):

- [ ] Lint, tipos y pruebas en verde.
- [ ] Pantallas tocadas verificadas (o anotado lo que falta).
- [ ] Componentes nuevos en la galería; ningún valor literal.
- [ ] Diferencias aceptadas en `design/stitch/DIFFS.md`.
- [ ] Entrada nueva en `MEMORY.md`: qué se hizo, decisiones, siguiente paso.
- [ ] Preguntas sin resolver listadas en `MEMORY.md` y dichas al humano.
