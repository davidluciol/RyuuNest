# Graph Report - RyuuNest  (2026-10-27)

## Corpus Check
- 382 files · ~446,983 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .ttf 5, (none) 4)

## Summary
- 2730 nodes · 6920 edges · 180 communities (118 shown, 62 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 382 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f272d7eb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- GalleryScreen.tsx
- DeclarativeRuntime
- Repository Index Format
- calibrationPage.ts
- BottomNav.tsx
- .details
- fieldStyles.ts
- Lint and Package Config
- DeclarativeRuntime.ts
- Module SDK Package Config
- install.e2e.test.ts
- FixedClock
- PackageInstaller.ts
- Core Parser Dependencies
- Design Rules and Screens
- SourcesSheets.tsx
- Base TypeScript Config
- exampleScript.ts
- Lista de tareas — RyuuNest Parte 1 (Back-end / Núcleo)
- Docs, ADRs and Principles
- Core Package Manifest
- Expo App Configuration
- FoxMangas Book Logic
- import.test.ts
- ui-tokens/src/index.ts
- App Test Dependencies
- RecentCard.tsx
- Settings Screen Sections
- Mobile Package Manifest
- discoverInstalled.test.ts
- ErrorState.tsx
- Library Screen Components
- TMO Module Port
- Test Site Manifest
- Sample Module Manifest
- spacing
- Detail Screen Components
- MangaIn Scraping Logic
- Sources Screen Elements
- import.ts
- fakes.ts
- Mobile App Dependencies
- ProgressStore.ts
- Button.tsx
- Task T15: E2E de instalación desde fixture (AC-2, AC-8)
- home.cjs
- Core Test TypeScript Config
- Discover Screen Components
- Home Screen Sections
- Module Contract and Templates
- ChapterRow.tsx
- UI Package Test Config
- Declarative Module Example
- Reader Screen Controls
- UI Tokens TypeScript Config
- SDK Test TypeScript Config
- Mobile App Scripts
- Mobile TypeScript Paths
- Core Build Config
- SDK Build Config
- UI Tokens Build Config
- Mobile Test TypeScript Config
- ref_node_fs
- CI Verification Pipeline
- Test Dev Dependencies
- Local Fonts and Icons
- TDD Contribution Workflow
- Monochrome Android Icon
- App Icon Brand Mark
- Splash Screen Icon
- node.d.ts
- GPL-3.0 Asset Licensing
- T05 Device Calibration Capture
- ModuleApi Contract Draft
- Installation Flow Tasks
- Ask Before Inventing Rule
- Session Memory Log
- Icon Background Asset
- Icon Foreground Chevron
- Favicon Brand Mark
- PNG Module Declarations
- Backup and SQLite Schema
- Design Tokens and Plan
- URL Global Declaration
- Filesystem Env Declaration
- Placeholder Art Assets
- Conventional Commits Rule
- External Module Repo Rule
- Arcane Vault Theme
- Ember Hearth Theme
- Moonlit Frost Theme
- Design Critique Adjustments
- Product Roadmap
- v1 Acceptance Criteria
- ModuleError Type
- Installation Threat Model
- InstallFlow Confirmation Rule
- createModuleApi Seam
- React Native Expo Stack
- sites.ts
- renderGallery.ts
- sourcesData.ts
- ModuleError
- SourcesController
- discoverData.ts
- Chip.tsx
- libraryData.ts
- export.ts
- test-site/src/index.ts
- eslint-plugin-ryuunest/package.json
- RowReader
- script.contract.test.ts
- core/src/index.ts
- ref_vitest
- SqlValue
- runtimeSelection.test.ts
- index.js
- types.ts
- NineManga
- ReaderState
- Luscious
- fontSources.ts
- dragonNightColors
- logicYupmanga
- metro.config.js
- 6. Índice de tareas y checkpoints
- Marcadores temporales (`assets/placeholder/`)
- sourcesFixtures.ts
- ModuleHost
- ModulePicker.tsx
- onboardingController.ts
- P2.5 Índice de tareas y checkpoints (Parte 2)
- Plan de Implementación: RyuuNest — Parte 1 (Back-end / Núcleo)
- complexity.md — Complejidad, modelo y límites de sesión (RyuuNest)
- i18nUsage.test.ts
- ImageCapPanel.tsx
- sourcesData.test.ts
- Task T05: Calibración de dispositivos y presupuesto de memoria
- Task T11: CLI del SDK + plantilla de módulo
- SourcesService
- Task T27: Máquina de estados del lector (headless)
- Task T30: E2E de respaldo (AC-7)
- Task T32: Segundo sitio falso de otra arquitectura + ADR de congelación de API 1.0
- Task T35: Puertas de CI / contrato / cobertura
- Task F21: Respaldo (UI)
- Task F23: Lector para TV (D-pad)
- Task F27: Puente web ↔ extensión (Host sobre mensajes)
- Task F28: Playwright por pantalla + `DIFFS.md` + lista de 20 s (AC-12)
- PARTE 2 — DISEÑO Y FRONT-END (Fases 6a, 6b, 7 y 8 del SPEC)
- SqlDriver
- RepoRegistry.ts
- useSourcesData.ts
- SectionHeader.tsx
- html.ts
- mobile/tests/fonts.test.ts
- discover.cjs
- Task T24: Preferencias por serie (modo de lectura, release preferida)
- useSettingsData.ts
- deviceSecureLock.ts
- harness.ts
- contrast.ts
- logicTMO.py
- harness.test.ts
- onboarding.cjs
- serve.cjs
- settingsView.ts
- conFalloEnEscritura
- .release

## God Nodes (most connected - your core abstractions)
1. `ModuleError` - 104 edges
2. `Lista de tareas — RyuuNest Parte 1 (Back-end / Núcleo)` - 81 edges
3. `SqlDriver` - 65 edges
4. `t()` - 58 edges
5. `spacing` - 54 edges
6. `dragonNightColors` - 52 edges
7. `GalleryScreen()` - 47 edges
8. `MediaKind` - 46 edges
9. `FixedClock` - 46 edges
10. `react-native` - 45 edges

## Surprising Connections (you probably didn't know these)
- `Task F08: Estados vacíos y de error + dragón marcador` --references--> `detailLines()`  [INFERRED]
  tasks/todo.archive.md → apps/mobile/src/components/stateStyles.ts
- `Task T20: Carga/selección de ModuleRuntime + mapeo de errores` --references--> `entry()`  [INFERRED]
  tasks/todo.archive.md → apps/mobile/tests/screens/discoverFixtures.test.ts
- `✅ Checkpoint E (tras T18–T20)` --references--> `ModuleErrorCode`  [INFERRED]
  tasks/plan.archive.md → packages/core/src/contract/errors.ts
- `Fase 8 — Web + extensión` --references--> `Host`  [INFERRED]
  tasks/plan.archive.md → packages/core/src/contract/types.ts
- `Task T28: Exportar respaldo JSON` --references--> `Storage`  [INFERRED]
  tasks/todo.archive.md → packages/core/src/ports/storage.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **design_stitch_biblioteca_tesoros_screen_hyper_filtering** — design_stitch_biblioteca_tesoros_screen_image, design_stitch_biblioteca_tesoros_screen_filter_chips, design_stitch_biblioteca_tesoros_screen_advanced_filters, design_stitch_biblioteca_tesoros_screen_sfw_toggle, design_stitch_biblioteca_tesoros_screen_reading_status [EXTRACTED 1.00]
- **design_stitch_biblioteca_tesoros_screen_hyper_progress_tracking** — design_stitch_biblioteca_tesoros_screen_image, design_stitch_biblioteca_tesoros_screen_cover_grid, design_stitch_biblioteca_tesoros_screen_progress_indicator, design_stitch_biblioteca_tesoros_screen_reading_status [EXTRACTED 1.00]
- **Discover screen composes search + module source + filters + curated sections + catalog grid** — design_stitch_descubrir_aventuras_screen_mockup, design_stitch_descubrir_aventuras_screen_search_field, design_stitch_descubrir_aventuras_screen_module_selector, design_stitch_descubrir_aventuras_screen_filter_chips, design_stitch_descubrir_aventuras_screen_cover_card, design_stitch_descubrir_aventuras_screen_catalog_pagination [EXTRACTED 1.00]
- **Sources screen composes repository management, filtering and sync visibility** — design_stitch_fuentes_portales_screen_mockup, design_stitch_fuentes_portales_screen_add_repository, design_stitch_fuentes_portales_screen_repository_card, design_stitch_fuentes_portales_screen_category_filters, design_stitch_fuentes_portales_screen_sync_indicator [EXTRACTED 1.00]
- **Home screen vertical stack: greeting header, nido status, continue-reading hero, recent reads carousel** — design_stitch_inicio_guarida_screen, design_stitch_inicio_guarida_screen_status_card, design_stitch_inicio_guarida_screen_continue_section, design_stitch_inicio_guarida_screen_recent_reads [EXTRACTED 1.00]
- **hyper_design_stitch_pantalla_lector_screen_reader_chrome** — design_stitch_pantalla_lector_screen_top_bar, design_stitch_pantalla_lector_screen_bottom_controls, design_stitch_pantalla_lector_screen_vertical_page_stream [EXTRACTED 1.00]
- **Ajustes screen grouped into vertical card sections** — design_stitch_ajustes_pantalla_screen_settings_screen, design_stitch_ajustes_pantalla_screen_local_profile, design_stitch_ajustes_pantalla_screen_language_setting, design_stitch_ajustes_pantalla_screen_reading_preferences, design_stitch_ajustes_pantalla_screen_nsfw_settings, design_stitch_ajustes_pantalla_screen_theme_picker, design_stitch_ajustes_pantalla_screen_backup_migration, design_stitch_ajustes_pantalla_screen_storage_cache, design_stitch_ajustes_pantalla_screen_footer_about [EXTRACTED 1.00]
- **Boolean settings rendered as switch toggles with explanatory subtitles** — design_stitch_ajustes_pantalla_screen_reader_toggles, design_stitch_ajustes_pantalla_screen_nsfw_settings, design_stitch_ajustes_pantalla_screen_install_protection, design_stitch_ajustes_pantalla_screen_oled_mode [EXTRACTED 1.00]
- **Module contract API v1 (SPEC §6)** — docs_spec_md_module_manifest, docs_spec_md_module_api, docs_spec_md_module_error, docs_spec_md_host_interface, docs_spec_md_declarative_module_format, docs_spec_md_repo_index_format [EXTRACTED 1.00]
- **7 Dragon Night captures reviewed under DESIGN_RULES** — design_stitch_inicio_guarida_code_screen, design_stitch_biblioteca_tesoros_code_screen, design_stitch_descubrir_aventuras_code_screen, design_stitch_fuentes_portales_code_screen, design_stitch_pantalla_lector_code_screen, design_stitch_detalle_pantalla_code_screen, design_stitch_ajustes_pantalla_code_screen, design_rules_anti_ai_slop [EXTRACTED 1.00]
- **Repository trust model: sandboxing, index, backup import and security card** — design_stitch_fuentes_portales_screen_security_card, design_stitch_fuentes_portales_screen_sandboxing, design_stitch_fuentes_portales_screen_repository_index, design_stitch_fuentes_portales_screen_import_backup [INFERRED 0.75]
- **Content provenance and extraction source disclosure** — design_stitch_detalle_pantalla_screen_origin_footer, design_stitch_detalle_pantalla_screen_source_badge, design_stitch_detalle_pantalla_screen_action_row [INFERRED 0.75]
- **Privacy-first stance: no telemetry, local-only data, user-controlled content visibility and install gating** — design_stitch_ajustes_pantalla_screen_footer_about, design_stitch_ajustes_pantalla_screen_nsfw_settings, design_stitch_ajustes_pantalla_screen_install_protection [INFERRED 0.75]
- **RyuuNest theme variants under one token architecture (v1 ships Dragon Night only)** — design_themes_dragon_night_design_theme, design_themes_arcane_vault_design_theme, design_themes_ember_hearth_design_theme, design_themes_moonlit_frost_design_theme [INFERRED 0.75]
- **Navigation and resume flow: bottom tabs with primary CTA continuing the last read chapter** — design_stitch_inicio_guarida_screen_bottom_nav, design_stitch_inicio_guarida_screen_continue_section, design_stitch_inicio_guarida_screen_resume_progress [INFERRED 0.75]
- **Design and documentation authority chain (SPEC §11.1)** — docs_spec_md_ryuunest_spec, docs_spec_md_visual_authority_order, docs_idea_md_ryuunest_vision, docs_spec_md_design_tokens_dragon_night [INFERRED 0.80]
- **Secure module installation path (SPEC §7 + T13)** — docs_spec_md_installation_flow, docs_spec_md_threat_model, tasks_todo_md_t13_package_installer, docs_spec_md_repo_index_format [INFERRED 0.80]
- **Reading resume and chapter navigation flow** — design_stitch_detalle_pantalla_screen_continue_bar, design_stitch_detalle_pantalla_screen_chapter_rows, design_stitch_detalle_pantalla_screen_chapter_toolbar [INFERRED 0.85]
- **Library organization and discovery: saved collections, portal update feed, and total work counter** — design_stitch_inicio_guarida_screen_treasures, design_stitch_inicio_guarida_screen_portal_updates, design_stitch_inicio_guarida_screen_work_count [INFERRED 0.85]
- **T05 verification evidence: module load calibration on Samsung S25 Ultra** — docs_capturast05_samsung_s25ultra_screenshot, docs_capturast05_samsung_s25ultra_calibration_screen, docs_capturast05_samsung_s25ultra_module_checks [INFERRED]

## Communities (180 total, 62 thin omitted)

### Community 0 - "GalleryScreen.tsx"
Cohesion: 0.09
Nodes (61): App(), styles, GalleryRoute(), HomeRoute(), LibraryRoute(), styles, Button(), Chip() (+53 more)

### Community 2 - "DeclarativeRuntime"
Cohesion: 0.23
Nodes (6): HtmlDocument, HtmlElement, DeclarativeRuntime, isMediaKind(), parseBoolean(), parseError()

### Community 3 - "Repository Index Format"
Cohesion: 0.07
Nodes (58): REPO_INDEX_FORMAT, REPO_INDEX_VERSION, CORE_VERSION, ValidationIssue, ValidationResult, applyPlaceholders(), BOOLEAN_FLAGS, CLI_NAME (+50 more)

### Community 4 - "calibrationPage.ts"
Cohesion: 0.26
Nodes (8): output, png, buildCalibrationPng(), chunk(), crc32(), header(), rawPixels(), SIGNATURE

### Community 5 - "BottomNav.tsx"
Cohesion: 0.08
Nodes (35): BottomNav(), BottomNavProps, DESTINATION_ICONS, styles, Header(), HeaderProps, styles, SettingsRow() (+27 more)

### Community 6 - ".details"
Cohesion: 0.42
Nodes (10): replace(), ModuleApi, guardApi(), ✅ Checkpoint D (tras T16–T17), 🚩 Checkpoint D (tras T16–T17), Task F15: Descubrir (Aventuras), Task T10: Paquete `test-site` + arnés de contrato, Task T16: DeclarativeRuntime + transformaciones (+2 more)

### Community 7 - "fieldStyles.ts"
Cohesion: 0.23
Nodes (12): Checkbox(), CheckboxProps, styles, CHECKBOX_SIZE, checkboxStyle(), CheckStyleShape, radioStyle(), textFieldColors() (+4 more)

### Community 8 - "Lint and Package Config"
Cohesion: 0.07
Nodes (29): description, devDependencies, eslint, prettier, @ryuunest/eslint-plugin, typescript, typescript-eslint, vitest (+21 more)

### Community 9 - "DeclarativeRuntime.ts"
Cohesion: 0.09
Nodes (33): DeclarativeChaptersSpec, DeclarativeDetailsMethod, DeclarativeFieldSpec, DeclarativeHasNext, DeclarativeListMethod, DeclarativePagesMethod, DeclarativeRuntimeOptions, findJoin() (+25 more)

### Community 10 - "Module SDK Package Config"
Cohesion: 0.07
Nodes (28): bin, ryuunest-module, dependencies, fflate, @noble/hashes, @ryuunest/core, @ryuunest/test-site, description (+20 more)

### Community 11 - "install.e2e.test.ts"
Cohesion: 0.10
Nodes (16): seed(), readModules(), readRepos(), InstallFlow, InstallFlowOptions, UpdateConfirmation, InstalledPackage, moduleKey() (+8 more)

### Community 12 - "FixedClock"
Cohesion: 0.07
Nodes (34): InstallRequest, FakeArchive, FixedClock, StubHttp, RepoIndexValidator, RepoRegistry, MemoryStorage, aceptarIndice() (+26 more)

### Community 13 - "PackageInstaller.ts"
Cohesion: 0.06
Nodes (38): packageFor(), toHex(), utf8Encode(), ManifestValidateOptions, ManifestValidator, normalizeEntryPath(), PackageFile, PackageInstaller (+30 more)

### Community 14 - "Core Parser Dependencies"
Cohesion: 0.08
Nodes (24): dependencies, css-select, domhandler, htmlparser2, @noble/hashes, description, devDependencies, @types/node (+16 more)

### Community 15 - "Design Rules and Screens"
Cohesion: 0.10
Nodes (13): Dragon Night design system (root DESIGN.md), Ajustes screen mockup, Biblioteca (Tesoros) screen mockup, Descubrir (Aventuras) screen mockup, Serie detail screen mockup, label-sm implemented at 12px (design table says 11px), Registry of accepted differences between Stitch design and implementation, Fuentes (Portales) screen mockup (+5 more)

### Community 16 - "SourcesSheets.tsx"
Cohesion: 0.08
Nodes (40): HoldToConfirm(), start(), HoldToConfirmProps, styles, HOLD_DURATION_MS, holdFillScale(), holdToConfirmStyle(), HoldToConfirmStyleShape (+32 more)

### Community 17 - "Base TypeScript Config"
Cohesion: 0.10
Nodes (20): compilerOptions, declaration, declarationMap, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module (+12 more)

### Community 18 - "exampleScript.ts"
Cohesion: 0.19
Nodes (15): attrIn(), attrOf(), createExampleScript(), createHtmlApi(), createJsonApi(), describe(), ExampleScriptSite, lastSegment() (+7 more)

### Community 19 - "Lista de tareas — RyuuNest Parte 1 (Back-end / Núcleo)"
Cohesion: 0.04
Nodes (45): Fase 0 — Fundación, Fase 1 — Contrato y arnés, Fase 2 — Corte vertical 1: instalar un módulo desde un repo, Fase 3 — Corte vertical 2: módulo declarativo, Fase 4 — Corte vertical 3: módulo script, Fase 5 — Corte vertical 4: biblioteca local, Fase 6 — Corte vertical 5: progreso y lecturas, Fase 6a — Sistema de diseño (+37 more)

### Community 20 - "Docs, ADRs and Principles"
Cohesion: 0.12
Nodes (11): Inter font SIL OFL 1.1 license, Manrope font SIL OFL 1.1 license, ADR-0001 stack and conventions, ADR-0002 versions and memory budget, Definition of Done, RyuuNest SPEC (legacy version), RyuuNest SPEC (authoritative specification), pnpm workspaces configuration (+3 more)

### Community 21 - "Core Package Manifest"
Cohesion: 0.11
Nodes (17): dependencies, @ryuunest/core, description, exports, files, @ryuunest/core, license, main (+9 more)

### Community 22 - "Expo App Configuration"
Cohesion: 0.11
Nodes (17): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, expo (+9 more)

### Community 24 - "import.test.ts"
Cohesion: 0.10
Nodes (19): ImportResult, BACKUP_FORMAT, BackupFavorite, BackupFolder, BackupPref, BackupProgress, BackupSeries, claveSerie() (+11 more)

### Community 25 - "ui-tokens/src/index.ts"
Cohesion: 0.11
Nodes (31): ThemeColors, breakpoints, coverAspectRatio, densities, Density, DensityName, touchTarget, UI_TOKENS_VERSION (+23 more)

### Community 26 - "App Test Dependencies"
Cohesion: 0.08
Nodes (25): fflate, htmlparser2, @noble/hashes, @ryuunest/test-site, typescript, vitest, main, name (+17 more)

### Community 27 - "RecentCard.tsx"
Cohesion: 0.13
Nodes (20): Badge(), BadgeProps, styles, BADGE_HEIGHT, badgeColors(), badgeStyle(), BadgeStyleShape, ChipProps (+12 more)

### Community 28 - "Settings Screen Sections"
Cohesion: 0.15
Nodes (14): Backup & Migration Section (Export/Import .json), Bottom Navigation (Portales / Ajustes), About Footer (RyuuNest v1.0.0, GPL-3.0, no telemetry), Module Install Protection (PIN/biometrics), App Language Selector (Idioma), Local Profile Card (Perfil Local), NSFW Content & Privacy Settings (Seguridad y Contenido), Pure OLED Black Mode Toggle (+6 more)

### Community 29 - "Mobile Package Manifest"
Cohesion: 0.13
Nodes (14): description, exports, files, license, main, name, private, scripts (+6 more)

### Community 30 - "discoverInstalled.test.ts"
Cohesion: 0.13
Nodes (16): ADULTO, APAGADO, INSTALADO, siteHttp(), DeclarativeConfig, makeApi(), EXAMPLE_DECLARATIVE, listFields (+8 more)

### Community 31 - "ErrorState.tsx"
Cohesion: 0.11
Nodes (26): DRAGON_VIEWBOX, colors, EmptyStateProps, styles, colors, ErrorStateProps, styles, colors (+18 more)

### Community 32 - "Library Screen Components"
Cohesion: 0.18
Nodes (13): Tipo and Portal Advanced Filter Dropdowns, Bottom Tab Navigation (Inicio, Biblioteca, Descubrir, Fuentes, Ajustes), Manga Cover Grid Cards with Type Badge and Chapter Info, Library Status Filter Chips (Todo, Leyendo, Carpetas), User Folder Organization Concept (Favoritos, Lectura Nocturna), Carpetas Folder Cards Section with Manage Action, Library Screen Header Bar, Biblioteca Library Screen Mockup (+5 more)

### Community 34 - "Test Site Manifest"
Cohesion: 0.14
Nodes (13): apiVersion, baseUrl, capabilities, entry, id, kinds, lang, name (+5 more)

### Community 35 - "Sample Module Manifest"
Cohesion: 0.14
Nodes (13): apiVersion, baseUrl, capabilities, entry, id, kinds, lang, name (+5 more)

### Community 36 - "spacing"
Cohesion: 0.10
Nodes (22): ContinueCard(), ContinueCardProps, styles, CONTINUE_CARD_COVER_WIDTH, continueCardColors, continueCardCoverHeight(), continueCardStyle(), ContinueCardStyleShape (+14 more)

### Community 37 - "Detail Screen Components"
Cohesion: 0.22
Nodes (13): Manga Detail Screen Mockup, Action Buttons Row (Favoritos, Descargar, Vertical), Chapter Row Component with Read/Unread/In-Progress States, Chapter List Toolbar (search, sort, status filter chips), Continuar Leyendo Progress Bar (Cap. 24, 42%), Dark Theme with Green Accent Palette, Genre Filter Chip Row, Load Older Chapters Pagination Button (+5 more)

### Community 39 - "Sources Screen Elements"
Cohesion: 0.18
Nodes (11): Add Repository Button (Añadir repositorio), Content Type Filter Chips (Todos, Manga, Manhwa, Cómic), Top Navigation Header (search, notifications, profile), Import Sources Backup Button (Importar respaldo de fuentes .json), Fuentes (Sources/Portals) Screen Mockup, Community Repository Card (Repositorio Comunitario, ACTIVO), JSON Repository Index (repo.ejemplo.org/indice.json), Nido Security Card (Seguridad del Nido) (+3 more)

### Community 40 - "import.ts"
Cohesion: 0.10
Nodes (37): actualizarFavorito(), actualizarLeido(), actualizarPref(), actualizarProgreso(), actualizarSerie(), claveCarpeta(), claveSerie(), Counts (+29 more)

### Community 41 - "fakes.ts"
Cohesion: 0.06
Nodes (33): HomeProgress, MediaKind, buildLibraryQuery(), claveDe(), LibraryEntry, LibraryFilter, LibraryOrder, LibraryPage (+25 more)

### Community 42 - "Mobile App Dependencies"
Cohesion: 0.08
Nodes (26): dependencies, expo, expo-constants, expo-font, expo-linking, expo-local-authentication, @expo/metro-runtime, expo-router (+18 more)

### Community 43 - "ProgressStore.ts"
Cohesion: 0.21
Nodes (8): capituloTerminado(), ChapterReadMarker, ProgressRow, ReadingProgress, SaveProgressInput, toRecord(), validarPagina(), validarTotal()

### Community 44 - "Button.tsx"
Cohesion: 0.33
Nodes (9): ButtonProps, styles, BUTTON_MIN_HEIGHT, buttonColors(), ButtonState, buttonStyle(), ButtonStyleShape, buttonTextColor() (+1 more)

### Community 46 - "home.cjs"
Cohesion: 0.09
Nodes (19): assert, { chromium }, path, assert, { chromium }, { destinationMarker }, fs, output (+11 more)

### Community 47 - "Core Test TypeScript Config"
Cohesion: 0.20
Nodes (9): compilerOptions, noEmit, paths, types, extends, include, ../../tsconfig.base.json, @ryuunest/core (+1 more)

### Community 48 - "Discover Screen Components"
Cohesion: 0.28
Nodes (8): Bottom Navigation Bar (Inicio, Biblioteca, Descubrir, Fuentes, Ajustes), Catalog Grid with Pagination (Anterior / Página 1 / Siguiente), Series Cover Card with Chapter Badge, Genre Filter Chips (Todos, Shonen, Seinen, Fantasía...), Descubrir (Discover) Screen Mockup, Installable Module Selector (Módulo de ejemplo A), Search Works Field (Buscar obras...), Online Connection Status Pill (En línea)

### Community 49 - "Home Screen Sections"
Cohesion: 0.28
Nodes (9): Inicio / Tu Guarida Home Screen Mockup, Bottom Tab Navigation Bar, Continuar la Aventura Resume Section, Novedades de Portales Feed, Lecturas Recientes Carousel, Reading Progress Indicator (Cap. 41, Pág. 12 de 38), Estado del Nido Status Card, Tesores Guardados Collections Grid (+1 more)

### Community 50 - "Module Contract and Templates"
Cohesion: 0.22
Nodes (8): Declarative module format (CSS selectors), Host interface for script modules, ModuleManifest contract type, Web to extension HTTP bridge protocol (SPEC §10), Declarative module template (module-sdk), Script module template (module-sdk), T16 DeclarativeRuntime task, T18 ScriptRuntime task

### Community 51 - "ChapterRow.tsx"
Cohesion: 0.16
Nodes (18): ChapterRow(), ChapterRowProps, styles, CHAPTER_ROW_MIN_HEIGHT, chapterRowColors, chapterRowStyle(), ChapterRowStyleShape, ChapterSignal (+10 more)

### Community 52 - "UI Package Test Config"
Cohesion: 0.20
Nodes (9): compilerOptions, noEmit, paths, types, extends, include, ../../tsconfig.base.json, @ryuunest/core (+1 more)

### Community 53 - "Declarative Module Example"
Cohesion: 0.50
Nodes (8): attrOf(), create(), detailsOf(), getDocument(), listPage(), pagesOf(), SELECTORS, textOf()

### Community 54 - "Reader Screen Controls"
Cohesion: 0.36
Nodes (8): Bottom Reader Controls Bar, Chapter End Card (Fin del Capitulo), Next Chapter Button (Cap. 42), Page Pagination and Progress Controls (Pag. 12/38, 31%), Reader Screen Mockup (pantalla_lector), Reading Mode Selector (Vertical continuo / Paginado), Reader Top Bar (title, chapter, list actions), Vertical Continuous Page Stream

### Community 55 - "UI Tokens TypeScript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, ../../tsconfig.base.json

### Community 56 - "SDK Test TypeScript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, noEmit, paths, extends, include, ../../tsconfig.base.json, @ryuunest/core

### Community 57 - "Mobile App Scripts"
Cohesion: 0.29
Nodes (7): scripts, android, ios, start, test, typecheck, web

### Community 58 - "Mobile TypeScript Paths"
Cohesion: 0.18
Nodes (10): compilerOptions, paths, strict, exclude, extends, @ryuunest/core, @ryuunest/module-sdk, @ryuunest/test-site (+2 more)

### Community 59 - "Core Build Config"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.base.json

### Community 60 - "SDK Build Config"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.base.json

### Community 61 - "UI Tokens Build Config"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.base.json

### Community 62 - "Mobile Test TypeScript Config"
Cohesion: 0.33
Nodes (5): compilerOptions, noEmit, extends, include, ../../tsconfig.base.json

### Community 63 - "ref_node_fs"
Cohesion: 0.08
Nodes (17): blueprint, root, assert, { chromium }, fs, output, path, assert (+9 more)

### Community 64 - "CI Verification Pipeline"
Cohesion: 0.50
Nodes (4): CI pipeline (lint, typecheck, test, build), Verification gate: pnpm lint / typecheck / test / build, P-17: pnpm workspaces monorepo with Vitest, Open question 16: CI runs test before build, likely red on clean checkout

### Community 65 - "Test Dev Dependencies"
Cohesion: 0.40
Nodes (5): devDependencies, @react-native/metro-config, @types/react, typescript, vitest

### Community 66 - "Local Fonts and Icons"
Cohesion: 0.50
Nodes (3): Inter 4.1 font bundle (OFL-1.1), Lucide icon set via single entry apps/mobile/src/icons.ts, Manrope 4.505 font bundle (OFL-1.1)

### Community 69 - "App Icon Brand Mark"
Cohesion: 0.67
Nodes (3): Mobile App Icon (Blue Chevron Mark), RyuuNest App Brand Identity, Icon Construction Grid Guides

### Community 70 - "Splash Screen Icon"
Cohesion: 1.00
Nodes (3): Minimal Concentric Rings Design, Splash Icon PNG, App Launch Screen Branding Asset

### Community 71 - "node.d.ts"
Cohesion: 0.15
Nodes (5): DatabaseSync, node:fs, node:path, node:sqlite, StatementSync

### Community 72 - "GPL-3.0 Asset Licensing"
Cohesion: 0.67
Nodes (3): Third-party asset license registry (GPL-3.0), Register every third-party resource in ASSETS.md, P-4: license GPL-3.0 for the whole project

### Community 73 - "T05 Device Calibration Capture"
Cohesion: 0.67
Nodes (3): Calibración RyuuNest (T05) Screen, T05 Module Load Checks (3/3 passed), Samsung S25 Ultra Screenshot — RyuuNest T05 Calibration

### Community 74 - "ModuleApi Contract Draft"
Cohesion: 0.67
Nodes (3): SourceModule contract draft (IDEA §7), logicTMO.py port mapping (SPEC Appendix A), ModuleApi interface (API v1)

### Community 75 - "Installation Flow Tasks"
Cohesion: 0.67
Nodes (3): Package installation flow (SPEC §7.1), Repository index.json format, T13 PackageInstaller task

### Community 110 - "sites.ts"
Cohesion: 0.16
Nodes (21): StubHttpRequest, HttpRequest, searchFixtureSeries(), apiSummary(), createJsonApiSite(), escapeHtml(), htmlListBody(), imageUrlsFor() (+13 more)

### Community 111 - "renderGallery.ts"
Cohesion: 0.14
Nodes (12): colorNames, COMPONENT_STATES, galleryEntries, GalleryEntry, GalleryKind, radiiNames, spacingNames, typeNames (+4 more)

### Community 112 - "sourcesData.ts"
Cohesion: 0.14
Nodes (15): OFFICIAL_REPO_DISMISSAL_SETTING, OFFICIAL_REPO_URL, REPO_NAME, createSettingsService(), SettingsData, NO_LOCK_SETTINGS_DATA, OFFICIAL_DISMISSED_SETTINGS_DATA, SAMPLE_SETTINGS_DATA (+7 more)

### Community 113 - "ModuleError"
Cohesion: 0.13
Nodes (21): find(), isModuleError(), isModuleErrorCode(), MODULE_ERROR_CODES, ModuleError, ModuleErrorCode, ModuleErrorDetails, describeError() (+13 more)

### Community 115 - "discoverData.ts"
Cohesion: 0.06
Nodes (46): DiscoverRoute(), destinationRoutes, createInstalledDiscoverSource(), mount(), requireUsablePackage(), createSampleDiscoverSource(), DiscoverDataSource, DiscoverLoadOptions (+38 more)

### Community 116 - "Chip.tsx"
Cohesion: 0.21
Nodes (16): LibraryCard(), LibraryCardProps, styles, LIBRARY_CARD_PROGRESS_HEIGHT, LIBRARY_CARD_TITLE_LINES, libraryCardBadgeStyle(), LibraryCardBadgeStyleShape, libraryCardGridColumns() (+8 more)

### Community 117 - "libraryData.ts"
Cohesion: 0.10
Nodes (29): LIBRARY_PAGE_SIZE, loadAllEntries(), loadFolders(), loadLibraryData(), LoadLibraryOptions, resolveLibraryData(), sourcesOf(), toSeries() (+21 more)

### Community 118 - "export.ts"
Cohesion: 0.12
Nodes (22): exportBackup(), FavoriteRow, FolderRow, PrefRow, ProgressRow, readFavorites(), readFolders(), readPrefs() (+14 more)

### Community 119 - "test-site/src/index.ts"
Cohesion: 0.18
Nodes (16): cronicasDeMoonlit, dracoDeJade, dragonDeCeniza, findChapter(), findSeries(), FIXTURE_DEFAULTS, FIXTURE_SERIES, FixtureChapter (+8 more)

### Community 120 - "eslint-plugin-ryuunest/package.json"
Cohesion: 0.11
Nodes (17): description, devDependencies, eslint, typescript-eslint, vitest, exports, eslint, typescript-eslint (+9 more)

### Community 121 - "RowReader"
Cohesion: 0.25
Nodes (7): isRecord(), readSettings(), RowReader, validateBackup(), section(), Task T09: Validadores de manifest e índice de repo (SDK), Task T23: Filtros/orden/búsqueda + carga 3000 series (AC-4)

### Community 122 - "script.contract.test.ts"
Cohesion: 0.15
Nodes (16): StubHttpRoute, CAPABILITIES, fixture(), FIXTURES, HERE, jsonApiRoutes(), makeJsonApi(), CAPABILITIES (+8 more)

### Community 123 - "core/src/index.ts"
Cohesion: 0.16
Nodes (13): ModuleRegistryOptions, UpdateOptions, Storage, Migration, MIGRATIONS, INDICES, KV, MIGRATION_1 (+5 more)

### Community 125 - "SqlValue"
Cohesion: 0.09
Nodes (17): open(), createExpoSqlDriver(), ExpoDatabaseLike, Call, BuiltQuery, Cursor, SqlRow, SqlRunResult (+9 more)

### Community 126 - "runtimeSelection.test.ts"
Cohesion: 0.18
Nodes (7): FakeScriptLoader, ScriptFactory, ModuleRuntime, BUSCAR_HTML, DECLARATIVE_ENTRY, makeHost(), makeHttp()

### Community 127 - "index.js"
Cohesion: 0.12
Nodes (8): ALLOWED_COLOR_KEYWORDS, ALLOWED_NUMBERS, COLOR_KEYS, MEASURE_KEYS, noDesignLiterals, eslint, REPO_ROOT, ruleTester

### Community 128 - "types.ts"
Cohesion: 0.11
Nodes (26): Chapter, ChapterPages, Host, ImageRef, Page, Release, SeriesDetails, SeriesSummary (+18 more)

### Community 130 - "ReaderState"
Cohesion: 0.12
Nodes (14): ajustarPagina(), MODOS, PAGED_PRELOAD_AHEAD, pageTotalOf(), PageWindow, ReaderChapter, ReaderSnapshot, ReaderState (+6 more)

### Community 132 - "fontSources.ts"
Cohesion: 0.18
Nodes (4): galleryFontSources, expo-font, expo-router, expo-status-bar

### Community 133 - "dragonNightColors"
Cohesion: 0.14
Nodes (8): COLOR_ALIASES, designColors, designMd, designRadii, designSpacing, designTypography, FM, TYPE_ALIASES

### Community 135 - "metro.config.js"
Cohesion: 0.29
Nodes (6): config, { getDefaultConfig }, path, WORKSPACE_PACKAGES, workspaceRoot, expo

### Community 136 - "6. Índice de tareas y checkpoints"
Cohesion: 0.10
Nodes (21): 6. Índice de tareas y checkpoints, ✅ Checkpoint A (tras T01–T05), ✅ Checkpoint B (tras T06–T11), ✅ Checkpoint C (tras T12–T15), ✅ Checkpoint E (tras T18–T20), ✅ Checkpoint F (tras T21–T24), ✅ Checkpoint G (tras T25–T27), ✅ Checkpoint H (tras T28–T30) (+13 more)

### Community 137 - "Marcadores temporales (`assets/placeholder/`)"
Cohesion: 0.50
Nodes (3): `dragon.svg` — dragón marcador (estados vacíos, error y carga), Marcadores temporales (`assets/placeholder/`), Reglas de esta carpeta (SPEC §12)

### Community 139 - "sourcesFixtures.ts"
Cohesion: 0.14
Nodes (19): InstallSheetProps, SAMPLE_SHA256, SourceModule, SourcesData, EMPTY_SOURCES_DATA, filterSourceModules(), kindFilterCounts(), SAMPLE_SOURCES_DATA (+11 more)

### Community 140 - "ModuleHost"
Cohesion: 0.09
Nodes (17): HostRequestInit, HostResponse, createMemorySettings(), HOST_DEFAULTS, HostLogger, HostLogLevel, ModuleHost, ModuleHostOptions (+9 more)

### Community 141 - "ModulePicker.tsx"
Cohesion: 0.16
Nodes (13): ModulePicker(), ModulePickerOption, ModulePickerProps, styles, modulePickerRowStyle(), ModulePickerRowStyleShape, modulePickerRowTextStyle(), ModulePickerTextStyleShape (+5 more)

### Community 142 - "onboardingController.ts"
Cohesion: 0.15
Nodes (17): createOnboardingController(), OnboardingController, OnboardingControllerDeps, OnboardingStep, OnboardingScreenProps, OnboardingSession, createSourcesController(), runSheet() (+9 more)

### Community 143 - "P2.5 Índice de tareas y checkpoints (Parte 2)"
Cohesion: 0.18
Nodes (11): ✅ Checkpoint P-A (tras F01–F10), ✅ Checkpoint P-B (tras F11–F21), ✅ Checkpoint P-C (tras F22–F23), ✅ Checkpoint P-D (tras F24–F27), ✅ Checkpoint P-E — Fin de la Parte 2, Fase 6a — Sistema de diseño, Fase 6b — Interfaz móvil, Fase 7 — TV (+3 more)

### Community 144 - "Plan de Implementación: RyuuNest — Parte 1 (Back-end / Núcleo)"
Cohesion: 0.18
Nodes (11): 10. Verificación del propio plan, 1. Resumen, 2. Alcance de la Parte 1, 4. Grafo de dependencias, 5. Estrategia de cortes verticales, 7. Riesgos y mitigaciones, 8. Propuesta para el segundo sitio (respuesta a la pregunta 5), 9. Preguntas abiertas (requieren decisión humana) (+3 more)

### Community 145 - "complexity.md — Complejidad, modelo y límites de sesión (RyuuNest)"
Cohesion: 0.22
Nodes (8): 1. Reglas de sesión (obligatorias), 2. Qué significa cada complejidad, 3. Niveles de modelo (OpenCode Zen), 4. Complejidad por tarea pendiente, 5. Flujos que ahorran tokens, complexity.md — Complejidad, modelo y límites de sesión (RyuuNest), Parte 1 — Núcleo, Parte 2 — Interfaz

### Community 146 - "i18nUsage.test.ts"
Cohesion: 0.15
Nodes (17): catalogKeys(), catalogs, defaultLocale, formatDate(), formatNumber(), getLocale(), LocaleCode, localeTag() (+9 more)

### Community 147 - "ImageCapPanel.tsx"
Cohesion: 0.35
Nodes (9): Calibration Page Gradient Image, Full-Screen Color Gradient Calibration Pattern, capFor(), clampCount(), decodedBytes(), toMB(), ImageCapPanel(), step() (+1 more)

### Community 148 - "sourcesData.test.ts"
Cohesion: 0.14
Nodes (10): createFflateArchive(), createSourcesService(), protectionOn(), requireUnlock(), build(), manifestOf(), Repo, text() (+2 more)

### Community 151 - "SourcesService"
Cohesion: 0.15
Nodes (3): loadSourcesWithOfficialRepo(), SourcesService, InstallConfirmation

### Community 160 - "PARTE 2 — DISEÑO Y FRONT-END (Fases 6a, 6b, 7 y 8 del SPEC)"
Cohesion: 0.25
Nodes (7): P2.1 Resumen y alcance, P2.2 Decisiones, P2.3 Grafo de dependencias, P2.4 Estrategia de cortes verticales, P2.6 Riesgos (Parte 2), P2.7 Preguntas abiertas (Parte 2), PARTE 2 — DISEÑO Y FRONT-END (Fases 6a, 6b, 7 y 8 del SPEC)

### Community 161 - "SqlDriver"
Cohesion: 0.07
Nodes (34): InstalledSourceDeps, SettingsServiceDeps, SourcesServiceDeps, ExportBackupOptions, FavoriteRecord, FavoriteRow, Favorites, toRecord() (+26 more)

### Community 162 - "RepoRegistry.ts"
Cohesion: 0.16
Nodes (12): RepoIndex, RepoModuleEntry, ModuleManifest, httpErrorCode(), httpErrorMessage(), canonicalHttpsUrl(), repoIndexKey(), repoKey() (+4 more)

### Community 163 - "useSourcesData.ts"
Cohesion: 0.22
Nodes (12): SourcesRoute(), openAppDatabase(), isFirstUseData(), ONBOARDING_COMPLETED_SETTING, OnboardingPhase, useOnboardingData(), useOnboardingSession(), clone() (+4 more)

### Community 164 - "SectionHeader.tsx"
Cohesion: 0.27
Nodes (6): SectionHeaderProps, styles, SECTION_HEADER_MIN_HEIGHT, sectionHeaderColors, sectionHeaderStyle(), SectionHeaderStyleShape

### Community 165 - "html.ts"
Cohesion: 0.16
Nodes (6): DocumentView, ElementView, parseHtml(), readText(), css-select, domhandler

### Community 166 - "mobile/tests/fonts.test.ts"
Cohesion: 0.23
Nodes (9): FONTS_DIR, readTtfNames(), TtfNames, weightFrom(), WEIGHTS, FontFile, fontFiles, fontLicenses (+1 more)

### Community 167 - "discover.cjs"
Cohesion: 0.33
Nodes (5): assert, { chromium }, fs, output, path

### Community 169 - "useSettingsData.ts"
Cohesion: 0.12
Nodes (15): SettingsRoute(), createFetchHttp(), FetchInitLike, FetchLike, FetchResponseLike, createAppSecureLock(), createSampleSettingsService(), SettingsService (+7 more)

### Community 170 - "deviceSecureLock.ts"
Cohesion: 0.39
Nodes (4): createDeviceSecureLock(), LocalAuthLike, createAppSecureLock(), expo-local-authentication

### Community 171 - "harness.ts"
Cohesion: 0.35
Nodes (10): ModuleCapability, assertDetails(), assertImageHeaders(), assertImages(), assertPage(), checkListing(), ContractError, ContractHarnessOptions (+2 more)

### Community 172 - "contrast.ts"
Cohesion: 0.29
Nodes (9): contrastRatio(), hexToRgb(), relativeLuminance(), Rgb, toLinear(), WCAG_AA, Foreground, NON_TEXT_PAIRS (+1 more)

### Community 174 - "harness.test.ts"
Cohesion: 0.42
Nodes (8): FixtureSeries, normalizeText(), createEstimatingApi(), createFixtureApi(), fixtureSeries(), slicePage(), toDetails(), toSummary()

### Community 175 - "onboarding.cjs"
Cohesion: 0.29
Nodes (5): assert, { chromium }, fs, output, path

### Community 176 - "serve.cjs"
Cohesion: 0.29
Nodes (5): fs, http, path, root, types

## Ambiguous Edges - Review These
- `Tipo and Portal Advanced Filter Dropdowns` → `SFW Content Safety Toggle Badge`  [AMBIGUOUS]
  design/stitch/biblioteca_tesoros/screen.png · relation: conceptually_related_to
- `Import Sources Backup Button (Importar respaldo de fuentes .json)` → `Nido Security Card (Seguridad del Nido)`  [AMBIGUOUS]
  design/stitch/fuentes_portales/screen.png · relation: conceptually_related_to

## Knowledge Gaps
- **133 isolated node(s):** `@expo/metro-runtime`, `@noble/hashes`, `@ryuunest/module-sdk`, `@ryuunest/test-site`, `@ryuunest/ui-tokens` (+128 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1114 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **62 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ModuleError` connect `ModuleError` to `types.ts`, `ReaderState`, `DeclarativeRuntime`, `.details`, `DeclarativeRuntime.ts`, `sourcesFixtures.ts`, `ModuleHost`, `install.e2e.test.ts`, `PackageInstaller.ts`, `FixedClock`, `Lista de tareas — RyuuNest Parte 1 (Back-end / Núcleo)`, `sourcesData.test.ts`, `discoverInstalled.test.ts`, `SqlDriver`, `RepoRegistry.ts`, `Task T24: Preferencias por serie (modo de lectura, release preferida)`, `useSettingsData.ts`, `fakes.ts`, `ProgressStore.ts`, `sourcesData.ts`, `discoverData.ts`, `RowReader`, `core/src/index.ts`, `runtimeSelection.test.ts`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `ModuleError` (e.g. with `Task T06: Tipos del contrato + ModuleError` and `Task T08: ModuleHost (permisos, tiempo límite, concurrencia, rate-limit)`) actually correct?**
  _`ModuleError` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@expo/metro-runtime`, `@noble/hashes`, `@ryuunest/module-sdk` to the rest of the system?**
  _133 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `GalleryScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08860759493670886 - nodes in this community are weakly interconnected._
- **Why does `Lista de tareas — RyuuNest Parte 1 (Back-end / Núcleo)` connect `Lista de tareas — RyuuNest Parte 1 (Back-end / Núcleo)` to `types.ts`, `BottomNav.tsx`, `.details`, `FixedClock`, `PackageInstaller.ts`, `i18nUsage.test.ts`, `Task T05: Calibración de dispositivos y presupuesto de memoria`, `Task T11: CLI del SDK + plantilla de módulo`, `Task T27: Máquina de estados del lector (headless)`, `ui-tokens/src/index.ts`, `Task T30: E2E de respaldo (AC-7)`, `Task T32: Segundo sitio falso de otra arquitectura + ADR de congelación de API 1.0`, `Task F21: Respaldo (UI)`, `Task F23: Lector para TV (D-pad)`, `Task F27: Puente web ↔ extensión (Host sobre mensajes)`, `Task F28: Playwright por pantalla + `DIFFS.md` + lista de 20 s (AC-12)`, `Task T35: Puertas de CI / contrato / cobertura`, `SqlDriver`, `Task T24: Preferencias por serie (modo de lectura, release preferida)`, `Task T15: E2E de instalación desde fixture (AC-2, AC-8)`, `.release`, `sourcesData.ts`, `ModuleError`, `RowReader`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Tipo and Portal Advanced Filter Dropdowns` and `SFW Content Safety Toggle Badge`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Import Sources Backup Button (Importar respaldo de fuentes .json)` and `Nido Security Card (Seguridad del Nido)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._