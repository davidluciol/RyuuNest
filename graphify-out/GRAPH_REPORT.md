# Graph Report - RyuuNest  (2026-10-31)

## Corpus Check
- 483 files · ~589,492 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .ttf 5, (none) 4, .css 1)

## Summary
- 3276 nodes · 8933 edges · 192 communities (129 shown, 63 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 503 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ca1ce8d4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DiscoverScreen.tsx
- logicFoxManga.py
- DeclarativeRuntime
- cli.ts
- calibrationPage.ts
- BottomNav.tsx
- ModuleApi
- fieldStyles.ts
- Lint and Package Config
- DeclarativeRuntime.ts
- Module SDK Package Config
- ModuleRegistry
- ReaderMode
- ModuleError
- Core Parser Dependencies
- Design Rules and Screens
- dragonNightColors
- Base TypeScript Config
- exampleScript.ts
- Lista de tareas — RyuuNest Parte 1 (Back-end / Núcleo)
- Docs, ADRs and Principles
- Core Package Manifest
- Expo App Configuration
- FoxMangas Book Logic
- platformImports.ts
- ui-tokens/src/index.ts
- App Test Dependencies
- GalleryScreen.tsx
- Settings Screen Sections
- Mobile Package Manifest
- sites.ts
- ModuleHost
- Library Screen Components
- TMO Module Port
- Test Site Manifest
- Sample Module Manifest
- SqlDriver.ts
- Detail Screen Components
- MangaIn Scraping Logic
- Sources Screen Elements
- import.ts
- export.ts
- Mobile App Dependencies
- SqlDriver
- sourcesData.ts
- Task T15: E2E de instalación desde fixture (AC-2, AC-8)
- MediaKind
- Core Test TypeScript Config
- Discover Screen Components
- Home Screen Sections
- Module Contract and Templates
- ContinueCard.tsx
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
- harness.ts
- i18n/index.ts
- FixedClock
- runtimeSelection.test.ts
- installer.test.ts
- discoverData.ts
- Chip.tsx
- libraryData.ts
- LibraryScreen.tsx
- renderGallery.ts
- eslint-plugin-ryuunest/package.json
- types.ts
- spacing
- errors.ts
- ref_vitest
- ref_vitest
- fakes.ts
- index.js
- MemoryStorage
- NineManga
- ReaderState
- Luscious
- fontSources.ts
- dragonNightColors
- logicYupmanga
- metro.config.js
- 6. Índice de tareas y checkpoints
- Marcadores temporales (`assets/placeholder/`)
- t
- sourcesFixtures.ts
- ErrorDialog.tsx
- sourcesController.ts
- P2.5 Índice de tareas y checkpoints (Parte 2)
- Plan de Implementación: RyuuNest — Parte 1 (Back-end / Núcleo)
- complexity.md — Complejidad, modelo y límites de sesión (RyuuNest)
- SourcesService
- SourcesController
- Repo
- Task T05: Calibración de dispositivos y presupuesto de memoria
- Task T11: CLI del SDK + plantilla de módulo
- SourcesFlow
- Task T27: Máquina de estados del lector (headless)
- Task T30: E2E de respaldo (AC-7)
- Task T32: Segundo sitio falso de otra arquitectura + ADR de congelación de API 1.0
- Task T35: Puertas de CI / contrato / cobertura
- Task F21: Respaldo (UI)
- Task F23: Lector para TV (D-pad)
- Task F27: Puente web ↔ extensión (Host sobre mensajes)
- Task F28: Playwright por pantalla + `DIFFS.md` + lista de 20 s (AC-12)
- PARTE 2 — DISEÑO Y FRONT-END (Fases 6a, 6b, 7 y 8 del SPEC)
- HoldToConfirm.tsx
- .addRepo
- settingsData.ts
- ModulePicker.tsx
- backupFilesPort.ts
- useDiagnosticsData.ts
- ReaderPageImage.tsx
- settingsData.ts
- deviceSecureLock.ts
- readingSource.ts
- updateFlow.test.ts
- useOnboardingData.ts
- ProgressStore.ts
- DiagnosticsController
- sourcesView.ts
- diagnosticsData.ts
- settingsView.ts
- Task T24: Preferencias por serie (modo de lectura, release preferida)
- useBackupData.ts
- Plano de pantalla (FB1)
- sampleDiagnosticsService.ts
- core/src/index.ts
- DiagnosticsService
- .release
- sanitize.ts
- diagnosticsReport.ts
- diagnosticsController.ts
- ReaderScreen.tsx
- ttfNames.ts
- clipboard.native.ts

## God Nodes (most connected - your core abstractions)
1. `ModuleError` - 121 edges
2. `t()` - 103 edges
3. `Lista de tareas — RyuuNest Parte 1 (Back-end / Núcleo)` - 81 edges
4. `SqlDriver` - 79 edges
5. `spacing` - 70 edges
6. `dragonNightColors` - 69 edges
7. `react-native` - 68 edges
8. `GalleryScreen()` - 54 edges
9. `MediaKind` - 53 edges
10. `Clock` - 50 edges

## Surprising Connections (you probably didn't know these)
- `Task F08: Estados vacíos y de error + dragón marcador` --references--> `detailLines()`  [INFERRED]
  tasks/todo.archive.md → apps/mobile/src/components/stateStyles.ts
- `✅ Checkpoint E (tras T18–T20)` --references--> `ModuleErrorCode`  [INFERRED]
  tasks/plan.archive.md → packages/core/src/contract/errors.ts
- `🚩 Checkpoint E (tras T18–T20)` --references--> `ModuleErrorCode`  [INFERRED]
  tasks/todo.archive.md → packages/core/src/contract/errors.ts
- `Task T23: Filtros/orden/búsqueda + carga 3000 series (AC-4)` --references--> `ModuleError`  [INFERRED]
  tasks/todo.archive.md → packages/core/src/contract/errors.ts
- `Fase 8 — Web + extensión` --references--> `Host`  [INFERRED]
  tasks/plan.archive.md → packages/core/src/contract/types.ts

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

## Communities (192 total, 63 thin omitted)

### Community 0 - "DiscoverScreen.tsx"
Cohesion: 0.12
Nodes (32): SeriesRoute(), styles, DRAGON_VIEWBOX, DragonMarker(), colors, EmptyState(), EmptyStateProps, styles (+24 more)

### Community 2 - "DeclarativeRuntime"
Cohesion: 0.12
Nodes (12): HtmlDocument, HtmlElement, DocumentView, ElementView, parseHtml(), readText(), DeclarativeRuntime, isMediaKind() (+4 more)

### Community 3 - "cli.ts"
Cohesion: 0.06
Nodes (61): R3. Compatibilidad hacia delante ejecutable, esHttps(), RowReader, REPO_INDEX_FORMAT, REPO_INDEX_VERSION, RepoModuleEntry, ValidationIssue, ValidationResult (+53 more)

### Community 4 - "calibrationPage.ts"
Cohesion: 0.26
Nodes (8): output, png, buildCalibrationPng(), chunk(), crc32(), header(), rawPixels(), SIGNATURE

### Community 5 - "BottomNav.tsx"
Cohesion: 0.05
Nodes (45): BottomNav(), BottomNavProps, DESTINATION_ICONS, styles, ButtonProps, BUTTON_MIN_HEIGHT, buttonColors(), ButtonState (+37 more)

### Community 6 - "ModuleApi"
Cohesion: 0.28
Nodes (15): replace(), images(), Anexo B: formato declarativo tal como está construido, Decisión 5: 2.º sitio real, candidatos (sin instalarlos), ModuleApi, trim(), guardApi(), 🚩 Checkpoint D (tras T16–T17) (+7 more)

### Community 7 - "fieldStyles.ts"
Cohesion: 0.22
Nodes (13): Checkbox(), CheckboxProps, styles, CHECKBOX_SIZE, checkboxStyle(), CheckStyleShape, radioStyle(), textFieldColors() (+5 more)

### Community 8 - "Lint and Package Config"
Cohesion: 0.07
Nodes (29): description, devDependencies, eslint, prettier, @ryuunest/eslint-plugin, typescript, typescript-eslint, vitest (+21 more)

### Community 9 - "DeclarativeRuntime.ts"
Cohesion: 0.09
Nodes (34): DeclarativeChaptersSpec, DeclarativeConfig, DeclarativeDetailsMethod, DeclarativeFieldSpec, DeclarativeHasNext, DeclarativeListMethod, DeclarativePagesMethod, DeclarativeRuntimeOptions (+26 more)

### Community 10 - "Module SDK Package Config"
Cohesion: 0.07
Nodes (28): bin, ryuunest-module, dependencies, fflate, @noble/hashes, @ryuunest/core, @ryuunest/test-site, description (+20 more)

### Community 11 - "ModuleRegistry"
Cohesion: 0.11
Nodes (17): createSourcesService(), protectionOn(), requireUnlock(), InstallFlow, InstallFlowOptions, UpdateConfirmation, InstalledPackage, moduleKey() (+9 more)

### Community 12 - "ReaderMode"
Cohesion: 0.07
Nodes (32): Listener, PROGRESS_SAVE_DELAY_MS, ReaderControllerOptions, ReaderOpenTarget, createReadingSource(), createSampleReadingSource(), seedSample(), clock (+24 more)

### Community 13 - "ModuleError"
Cohesion: 0.22
Nodes (12): ModuleError, ManifestValidateOptions, normalizeEntryPath(), PackageFile, PackageInstallerOptions, resolveHttpsUrl(), assertSafeEntryPath(), assertUnpackedLimits() (+4 more)

### Community 14 - "Core Parser Dependencies"
Cohesion: 0.08
Nodes (24): dependencies, css-select, domhandler, htmlparser2, @noble/hashes, description, devDependencies, @types/node (+16 more)

### Community 15 - "Design Rules and Screens"
Cohesion: 0.10
Nodes (13): Dragon Night design system (root DESIGN.md), Ajustes screen mockup, Biblioteca (Tesoros) screen mockup, Descubrir (Aventuras) screen mockup, Serie detail screen mockup, label-sm implemented at 12px (design table says 11px), Registry of accepted differences between Stitch design and implementation, Fuentes (Portales) screen mockup (+5 more)

### Community 16 - "dragonNightColors"
Cohesion: 0.08
Nodes (26): LogEventDetailLine, LogEventRow(), LogEventRowProps, styles, ToneIcon(), LOG_EVENT_ICON_SIZE, LogEventDetailBoxShape, logEventDetailBoxStyle() (+18 more)

### Community 17 - "Base TypeScript Config"
Cohesion: 0.10
Nodes (20): compilerOptions, declaration, declarationMap, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module (+12 more)

### Community 18 - "exampleScript.ts"
Cohesion: 0.13
Nodes (23): StubHttpRoute, CAPABILITIES, fixture(), FIXTURES, HERE, jsonApiRoutes(), attrIn(), attrOf() (+15 more)

### Community 19 - "Lista de tareas — RyuuNest Parte 1 (Back-end / Núcleo)"
Cohesion: 0.04
Nodes (49): Fase 0 — Fundación, Fase 1 — Contrato y arnés, Fase 2 — Corte vertical 1: instalar un módulo desde un repo, Fase 3 — Corte vertical 2: módulo declarativo, Fase 4 — Corte vertical 3: módulo script, Fase 5 — Corte vertical 4: biblioteca local, Fase 6 — Corte vertical 5: progreso y lecturas, Fase 6a — Sistema de diseño (+41 more)

### Community 20 - "Docs, ADRs and Principles"
Cohesion: 0.12
Nodes (11): Inter font SIL OFL 1.1 license, Manrope font SIL OFL 1.1 license, ADR-0001 stack and conventions, ADR-0002 versions and memory budget, Definition of Done, RyuuNest SPEC (legacy version), RyuuNest SPEC (authoritative specification), pnpm workspaces configuration (+3 more)

### Community 21 - "Core Package Manifest"
Cohesion: 0.11
Nodes (17): dependencies, @ryuunest/core, description, exports, files, @ryuunest/core, license, main (+9 more)

### Community 22 - "Expo App Configuration"
Cohesion: 0.11
Nodes (17): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, expo (+9 more)

### Community 24 - "platformImports.ts"
Cohesion: 0.11
Nodes (23): bindingNames(), createAnalysis(), declaredNames(), describePlatformIssue(), dynamicSpecifier(), ExportSet, EXTENSIONS, findPlatformImportIssues() (+15 more)

### Community 25 - "ui-tokens/src/index.ts"
Cohesion: 0.14
Nodes (26): breakpoints, coverAspectRatio, densities, Density, DensityName, FontFile, UI_TOKENS_VERSION, breakpointForWidth() (+18 more)

### Community 26 - "App Test Dependencies"
Cohesion: 0.08
Nodes (25): fflate, htmlparser2, @noble/hashes, @ryuunest/test-site, typescript, vitest, main, name (+17 more)

### Community 27 - "GalleryScreen.tsx"
Cohesion: 0.08
Nodes (32): App(), styles, GalleryRoute(), Header(), HeaderProps, styles, Switch(), SwitchProps (+24 more)

### Community 28 - "Settings Screen Sections"
Cohesion: 0.15
Nodes (14): Backup & Migration Section (Export/Import .json), Bottom Navigation (Portales / Ajustes), About Footer (RyuuNest v1.0.0, GPL-3.0, no telemetry), Module Install Protection (PIN/biometrics), App Language Selector (Idioma), Local Profile Card (Perfil Local), NSFW Content & Privacy Settings (Seguridad y Contenido), Pure OLED Black Mode Toggle (+6 more)

### Community 29 - "Mobile Package Manifest"
Cohesion: 0.13
Nodes (14): description, exports, files, license, main, name, private, scripts (+6 more)

### Community 30 - "sites.ts"
Cohesion: 0.06
Nodes (58): sampleSeriesView(), ADULTO, APAGADO, INSTALADO, seed(), siteHttp(), makeApi(), CAPABILITIES (+50 more)

### Community 31 - "ModuleHost"
Cohesion: 0.06
Nodes (31): ADR-0003: Congelación de la API 1.0 de módulos, Consecuencias, Contexto, Cómo se obtuvo la evidencia, D1. Cómo se ejecutan los módulos `script` (R1), D2. Cabeceras de imagen en el formato declarativo (RF-24, pregunta abierta de `MEMORY.md`), D3. 2.º sitio real, Decisiones del autor (resueltas el 2026-10-29) (+23 more)

### Community 32 - "Library Screen Components"
Cohesion: 0.18
Nodes (13): Tipo and Portal Advanced Filter Dropdowns, Bottom Tab Navigation (Inicio, Biblioteca, Descubrir, Fuentes, Ajustes), Manga Cover Grid Cards with Type Badge and Chapter Info, Library Status Filter Chips (Todo, Leyendo, Carpetas), User Folder Organization Concept (Favoritos, Lectura Nocturna), Carpetas Folder Cards Section with Manage Action, Library Screen Header Bar, Biblioteca Library Screen Mockup (+5 more)

### Community 34 - "Test Site Manifest"
Cohesion: 0.14
Nodes (13): apiVersion, baseUrl, capabilities, entry, id, kinds, lang, name (+5 more)

### Community 35 - "Sample Module Manifest"
Cohesion: 0.14
Nodes (13): apiVersion, baseUrl, capabilities, entry, id, kinds, lang, name (+5 more)

### Community 36 - "SqlDriver.ts"
Cohesion: 0.09
Nodes (25): ChapterReadRow, ChapterRef, Migration, MIGRATIONS, INDICES, KV, MIGRATION_1, MIGRATION_2 (+17 more)

### Community 37 - "Detail Screen Components"
Cohesion: 0.22
Nodes (13): Manga Detail Screen Mockup, Action Buttons Row (Favoritos, Descargar, Vertical), Chapter Row Component with Read/Unread/In-Progress States, Chapter List Toolbar (search, sort, status filter chips), Continuar Leyendo Progress Bar (Cap. 24, 42%), Dark Theme with Green Accent Palette, Genre Filter Chip Row, Load Older Chapters Pagination Button (+5 more)

### Community 39 - "Sources Screen Elements"
Cohesion: 0.18
Nodes (11): Add Repository Button (Añadir repositorio), Content Type Filter Chips (Todos, Manga, Manhwa, Cómic), Top Navigation Header (search, notifications, profile), Import Sources Backup Button (Importar respaldo de fuentes .json), Fuentes (Sources/Portals) Screen Mockup, Community Repository Card (Repositorio Comunitario, ACTIVO), JSON Repository Index (repo.ejemplo.org/indice.json), Nido Security Card (Seguridad del Nido) (+3 more)

### Community 40 - "import.ts"
Cohesion: 0.07
Nodes (43): createBackupService(), ModuleSuggestion, summarizeImport(), build(), actualizarFavorito(), actualizarLeido(), actualizarPref(), actualizarProgreso() (+35 more)

### Community 41 - "export.ts"
Cohesion: 0.06
Nodes (42): exportBackup(), FavoriteRow, FolderRow, PrefRow, ProgressRow, readFavorites(), readFolders(), readPrefs() (+34 more)

### Community 42 - "Mobile App Dependencies"
Cohesion: 0.06
Nodes (32): dependencies, expo, expo-clipboard, expo-constants, expo-document-picker, expo-file-system, expo-font, expo-image (+24 more)

### Community 43 - "SqlDriver"
Cohesion: 0.08
Nodes (26): BackupServiceDeps, ExportBackupOptions, ListOptions, LOG_MAX_ENTRIES, LogRow, LogStoreOptions, normalizeLevel(), toEntry() (+18 more)

### Community 44 - "sourcesData.ts"
Cohesion: 0.12
Nodes (12): createFflateArchive(), OFFICIAL_REPO_DISMISSAL_SETTING, OFFICIAL_REPO_URL, REPO_NAME, createSettingsService(), readReaderMode(), INSTALL_PROTECTION_SETTING, RepoRow (+4 more)

### Community 46 - "MediaKind"
Cohesion: 0.10
Nodes (25): BackupSeries, MediaKind, SeriesStatus, browseLibrary(), buildLibraryQuery(), claveDe(), LibraryEntry, LibraryFilter (+17 more)

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

### Community 51 - "ContinueCard.tsx"
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
Cohesion: 0.07
Nodes (18): blueprint, root, output, output, output, output, destinationMarker(), output (+10 more)

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

### Community 81 - "PNG Module Declarations"
Cohesion: 0.50
Nodes (3): *.png, *.svg, *.ttf

### Community 110 - "harness.ts"
Cohesion: 0.20
Nodes (17): ModuleCapability, assertDetails(), assertImageHeaders(), assertImages(), assertPage(), checkListing(), ContractError, ContractHarnessOptions (+9 more)

### Community 111 - "i18n/index.ts"
Cohesion: 0.15
Nodes (17): catalogKeys(), catalogs, defaultLocale, formatDate(), formatNumber(), getLocale(), LocaleCode, localeTag() (+9 more)

### Community 112 - "FixedClock"
Cohesion: 0.10
Nodes (20): FixedClock, StubHttp, RepoRegistry, aceptarIndice(), Dispositivo, dispositivoLimpio(), acceptIndex(), defaultEntries() (+12 more)

### Community 113 - "runtimeSelection.test.ts"
Cohesion: 0.08
Nodes (33): createInstalledMounter(), requireUsablePackage(), InstalledMounterDeps, MountedModule, R1. Ejecución y empaquetado de módulos `script` (decide el autor: D1), isModuleErrorCode(), Host, FakeScriptLoader (+25 more)

### Community 114 - "installer.test.ts"
Cohesion: 0.11
Nodes (17): packageFor(), fromHex(), toHex(), utf8Decode(), utf8Encode(), InstallRequest, FakeArchive, defaultEntries() (+9 more)

### Community 115 - "discoverData.ts"
Cohesion: 0.07
Nodes (39): DiscoverRoute(), createInstalledDiscoverSource(), createSampleDiscoverSource(), DiscoverDataSource, DiscoverLoadOptions, DiscoverLoadResult, getDiscoverModules(), InstalledSourceDeps (+31 more)

### Community 116 - "Chip.tsx"
Cohesion: 0.06
Nodes (40): Badge(), BadgeProps, styles, BADGE_HEIGHT, badgeColors(), badgeStyle(), BadgeStyleShape, Chip() (+32 more)

### Community 117 - "libraryData.ts"
Cohesion: 0.13
Nodes (23): LIBRARY_PAGE_SIZE, loadAllEntries(), loadFolders(), loadLibraryData(), LoadLibraryOptions, resolveLibraryData(), sourcesOf(), toSeries() (+15 more)

### Community 118 - "LibraryScreen.tsx"
Cohesion: 0.13
Nodes (22): LibraryRoute(), styles, LibraryCard(), LibraryCardProps, styles, LIBRARY_CARD_PROGRESS_HEIGHT, LIBRARY_CARD_TITLE_LINES, libraryCardBadgeStyle() (+14 more)

### Community 119 - "renderGallery.ts"
Cohesion: 0.14
Nodes (12): colorNames, COMPONENT_STATES, galleryEntries, GalleryEntry, GalleryKind, radiiNames, spacingNames, typeNames (+4 more)

### Community 120 - "eslint-plugin-ryuunest/package.json"
Cohesion: 0.11
Nodes (17): description, devDependencies, eslint, typescript-eslint, vitest, exports, eslint, typescript-eslint (+9 more)

### Community 121 - "types.ts"
Cohesion: 0.14
Nodes (24): Anexo A: inventario de la superficie, Decisión 1: qué se puede congelar ya, ModuleErrorDetails, Chapter, ChapterPages, ImageRef, ModuleManifest, Page (+16 more)

### Community 122 - "spacing"
Cohesion: 0.08
Nodes (30): FolderCard(), FolderCardProps, styles, FOLDER_CARD_ICON_SIZE, folderCardColors, folderCardStyle(), FolderCardStyleShape, RecentCard() (+22 more)

### Community 123 - "errors.ts"
Cohesion: 0.14
Nodes (13): isModuleError(), MODULE_ERROR_CODES, ModuleErrorCode, RepoIndex, httpErrorCode(), httpErrorMessage(), RepoIndexValidator, describeIssues() (+5 more)

### Community 124 - "ref_vitest"
Cohesion: 0.15
Nodes (4): galleryStyleLiterals(), StyleLiterals, DESTINATIONS, SRC

### Community 125 - "ref_vitest"
Cohesion: 0.09
Nodes (17): open(), createExpoSqlDriver(), ExpoDatabaseLike, createSessionSqlDriver(), upsertPref(), key(), NO_CHANGES, ONE_CHANGE (+9 more)

### Community 126 - "fakes.ts"
Cohesion: 0.10
Nodes (18): SettingsServiceDeps, SourcesServiceDeps, ModuleHostOptions, Archive, ArchiveEntry, StubHttpRequest, Http, HttpRequest (+10 more)

### Community 127 - "index.js"
Cohesion: 0.12
Nodes (8): ALLOWED_COLOR_KEYWORDS, ALLOWED_NUMBERS, COLOR_KEYS, MEASURE_KEYS, noDesignLiterals, eslint, REPO_ROOT, ruleTester

### Community 128 - "MemoryStorage"
Cohesion: 0.14
Nodes (11): ModuleRegistryOptions, UpdateOptions, NoopSecureLock, Storage, MemoryStorage, BajoPrueba, claves(), suiteDeConformidad() (+3 more)

### Community 130 - "ReaderState"
Cohesion: 0.12
Nodes (8): ReaderController, controller(), toRecord(), ajustarPagina(), pageTotalOf(), ReaderState, validarCapitulo(), ventana()

### Community 133 - "dragonNightColors"
Cohesion: 0.14
Nodes (8): COLOR_ALIASES, designColors, designMd, designRadii, designSpacing, designTypography, FM, TYPE_ALIASES

### Community 135 - "metro.config.js"
Cohesion: 0.40
Nodes (4): config, WORKSPACE_PACKAGES, workspaceRoot, expo

### Community 136 - "6. Índice de tareas y checkpoints"
Cohesion: 0.09
Nodes (22): 6. Índice de tareas y checkpoints, ✅ Checkpoint A (tras T01–T05), ✅ Checkpoint B (tras T06–T11), ✅ Checkpoint C (tras T12–T15), ✅ Checkpoint D (tras T16–T17), ✅ Checkpoint E (tras T18–T20), ✅ Checkpoint F (tras T21–T24), ✅ Checkpoint G (tras T25–T27) (+14 more)

### Community 137 - "Marcadores temporales (`assets/placeholder/`)"
Cohesion: 0.40
Nodes (4): `dragon.svg` — dragón marcador (estados vacíos, error y carga), Marcadores temporales (`assets/placeholder/`), `page-1.svg`, `page-2.svg`, `page-3.svg` — páginas de ejemplo del lector (F18), Reglas de esta carpeta (SPEC §12)

### Community 139 - "t"
Cohesion: 0.10
Nodes (52): ReaderRoute(), styles, Button(), styles, KIND_KEYS, kindLabel(), ModuleRow(), ModuleRowProps (+44 more)

### Community 140 - "sourcesFixtures.ts"
Cohesion: 0.18
Nodes (13): clone(), createSampleSourcesService(), find(), SAMPLE_SHA256, SourcesData, SourcesUpdateResult, EMPTY_SOURCES_DATA, filterSourceModules() (+5 more)

### Community 141 - "ErrorDialog.tsx"
Cohesion: 0.14
Nodes (33): ErrorBanner(), ErrorBannerProps, styles, ErrorDialog(), ErrorDialogProps, styles, bannerActionMinHeight(), bannerCodeStyle() (+25 more)

### Community 142 - "sourcesController.ts"
Cohesion: 0.18
Nodes (17): createOnboardingController(), OnboardingControllerDeps, useOnboardingSession(), createSourcesController(), runSheet(), messageOf(), SourcesControllerDeps, URL_ERROR_KEYS (+9 more)

### Community 143 - "P2.5 Índice de tareas y checkpoints (Parte 2)"
Cohesion: 0.18
Nodes (11): ✅ Checkpoint P-A (tras F01–F10), ✅ Checkpoint P-B (tras F11–F21), ✅ Checkpoint P-C (tras F22–F23), ✅ Checkpoint P-D (tras F24–F27), ✅ Checkpoint P-E — Fin de la Parte 2, Fase 6a — Sistema de diseño, Fase 6b — Interfaz móvil, Fase 7 — TV (+3 more)

### Community 144 - "Plan de Implementación: RyuuNest — Parte 1 (Back-end / Núcleo)"
Cohesion: 0.18
Nodes (11): 10. Verificación del propio plan, 1. Resumen, 2. Alcance de la Parte 1, 4. Grafo de dependencias, 5. Estrategia de cortes verticales, 7. Riesgos y mitigaciones, 8. Propuesta para el segundo sitio (respuesta a la pregunta 5), 9. Preguntas abiertas (requieren decisión humana) (+3 more)

### Community 145 - "complexity.md — Complejidad, modelo y límites de sesión (RyuuNest)"
Cohesion: 0.22
Nodes (8): 1. Reglas de sesión (obligatorias), 2. Qué significa cada complejidad, 3. Niveles de modelo (OpenCode Zen), 4. Complejidad por tarea pendiente, 5. Flujos que ahorran tokens, complexity.md — Complejidad, modelo y límites de sesión (RyuuNest), Parte 1 — Núcleo, Parte 2 — Interfaz

### Community 146 - "SourcesService"
Cohesion: 0.12
Nodes (5): InstallSheetProps, loadSourcesWithOfficialRepo(), SourcesService, InstallConfirmation, InstallPreview

### Community 148 - "Repo"
Cohesion: 0.31
Nodes (4): manifestOf(), Repo, text(), zipOf()

### Community 151 - "SourcesFlow"
Cohesion: 0.17
Nodes (8): OnboardingController, OnboardingStep, OnboardingScreenProps, OnboardingSession, SourcesView, SourcesFlow, SourcesScreenProps, SourcesState

### Community 160 - "PARTE 2 — DISEÑO Y FRONT-END (Fases 6a, 6b, 7 y 8 del SPEC)"
Cohesion: 0.25
Nodes (7): P2.1 Resumen y alcance, P2.2 Decisiones, P2.3 Grafo de dependencias, P2.4 Estrategia de cortes verticales, P2.6 Riesgos (Parte 2), P2.7 Preguntas abiertas (Parte 2), PARTE 2 — DISEÑO Y FRONT-END (Fases 6a, 6b, 7 y 8 del SPEC)

### Community 161 - "HoldToConfirm.tsx"
Cohesion: 0.25
Nodes (10): HoldToConfirm(), HoldToConfirmProps, styles, HOLD_DURATION_MS, holdFillScale(), holdToConfirmStyle(), HoldToConfirmStyleShape, holdToConfirmTextColor() (+2 more)

### Community 162 - ".addRepo"
Cohesion: 0.20
Nodes (6): readModules(), readRepos(), canonicalHttpsUrl(), repoIndexKey(), repoKey(), seedRepo()

### Community 163 - "settingsData.ts"
Cohesion: 0.22
Nodes (11): CONTENT_VISIBLE_SETTING, DEFAULT_LANGUAGE, DEFAULT_READER_MODE, DEFAULT_READER_MODE_SETTING, LANGUAGE_SETTING, READER_MODES, SettingsData, SettingsListener (+3 more)

### Community 164 - "ModulePicker.tsx"
Cohesion: 0.14
Nodes (16): ModulePicker(), ModulePickerOption, ModulePickerProps, styles, modulePickerRowStyle(), ModulePickerRowStyleShape, modulePickerRowTextStyle(), ModulePickerTextStyleShape (+8 more)

### Community 165 - "backupFilesPort.ts"
Cohesion: 0.20
Nodes (9): createBackupFiles(), backupFileName(), BackupFiles, PickResult, ShareResult, FakeFiles, expo-document-picker, expo-file-system (+1 more)

### Community 166 - "useDiagnosticsData.ts"
Cohesion: 0.26
Nodes (8): DiagnosticsRoute(), copyText(), createDiagnosticsService(), DiagnosticsView, createSampleDiagnosticsService(), DiagnosticsState, resolveDiagnosticsService(), useDiagnosticsData()

### Community 168 - "ReaderPageImage.tsx"
Cohesion: 0.17
Nodes (17): resolveErrorLog(), resolveErrorReporter(), createErrorReporter(), INITIAL_PAGE_LOAD, PageImageRef, pageImageSource, PageLoad, PageLoadEvent (+9 more)

### Community 169 - "settingsData.ts"
Cohesion: 0.10
Nodes (21): SourcesRoute(), openAppDatabase(), createFetchHttp(), FetchInitLike, FetchLike, FetchResponseLike, clearImageCache(), createAppSecureLock() (+13 more)

### Community 170 - "deviceSecureLock.ts"
Cohesion: 0.39
Nodes (4): createDeviceSecureLock(), LocalAuthLike, createAppSecureLock(), expo-local-authentication

### Community 171 - "readingSource.ts"
Cohesion: 0.10
Nodes (21): ModuleMounter, readerChapters(), readingOrder(), createSampleMounter(), toDiscoverError(), DiscoverError, ReaderPages, ReadingSource (+13 more)

### Community 172 - "updateFlow.test.ts"
Cohesion: 0.23
Nodes (11): ManifestValidator, acceptIndex(), acceptManifest(), entriesFor(), indexWith(), manifest(), setup(), publish() (+3 more)

### Community 173 - "useOnboardingData.ts"
Cohesion: 0.32
Nodes (8): FirstUseRoute(), HomeRoute(), isTvLike(), isNativePlatform(), isFirstUseData(), ONBOARDING_COMPLETED_SETTING, OnboardingPhase, useOnboardingData()

### Community 174 - "ProgressStore.ts"
Cohesion: 0.27
Nodes (7): capituloTerminado(), ChapterReadMarker, ProgressRow, ReadingProgress, SaveProgressInput, validarPagina(), validarTotal()

### Community 176 - "sourcesView.ts"
Cohesion: 0.32
Nodes (5): SourceModule, SourcesSheetsProps, MAX_ROW_BADGES, ModuleBadge, RepoUrlCheck

### Community 178 - "settingsView.ts"
Cohesion: 0.60
Nodes (3): INSTALL_PROTECTION_HINT_KEYS, installProtectionHintKey(), READER_MODE_OPTIONS

### Community 182 - "useBackupData.ts"
Cohesion: 0.07
Nodes (29): SettingsRoute(), createBackupFiles(), BackupController, BackupControllerDeps, createBackupController(), BackupImportSummary, BackupService, BackupSuggestions (+21 more)

### Community 183 - "Plano de pantalla (FB1)"
Cohesion: 0.33
Nodes (5): Estructura de una pantalla, Patrón, Plano de pantalla (FB1), Textos y tokens, Verificación con Playwright

### Community 197 - "sampleDiagnosticsService.ts"
Cohesion: 0.25
Nodes (7): at(), NO_FILES, SampleDiagnosticsOptions, sampleEvents(), formatLogEntries(), isoDate(), LogEntry

### Community 202 - "core/src/index.ts"
Cohesion: 0.14
Nodes (13): ErrorReporter, reportDiscoverError(), messageOf(), ReaderErrorAction, reportReaderError(), BackupErrorAction, messageOf(), reportBackupError() (+5 more)

### Community 241 - "sanitize.ts"
Cohesion: 0.43
Nodes (6): MAX_CONTEXT_CHARS, MAX_MESSAGE_LENGTH, redact(), sanitizeContext(), sanitizeContextValue(), sanitizeText()

### Community 251 - "diagnosticsReport.ts"
Cohesion: 0.23
Nodes (11): createDiagnosticsFiles(), createDiagnosticsFiles(), diagnosticsFileName(), DiagnosticsFiles, diagnosticsMimeType(), EXTENSIONS, MIME_TYPES, ReportShareResult (+3 more)

### Community 253 - "diagnosticsController.ts"
Cohesion: 0.36
Nodes (9): createDiagnosticsController(), DiagnosticsControllerDeps, DiagnosticsFlow, DiagnosticsFlowAction, diagnosticsFlowReducer(), DiagnosticsNotice, INITIAL_DIAGNOSTICS_FLOW, DiagnosticsScreenProps (+1 more)

### Community 263 - "ReaderScreen.tsx"
Cohesion: 0.05
Nodes (69): Calibration Page Gradient Image, Full-Screen Color Gradient Calibration Pattern, capFor(), clampCount(), decodedBytes(), toMB(), ImageCapPanel(), step() (+61 more)

### Community 290 - "ttfNames.ts"
Cohesion: 0.32
Nodes (6): FONTS_DIR, readTtfNames(), TtfNames, weightFrom(), WEIGHTS, fontLicenses

## Ambiguous Edges - Review These
- `Tipo and Portal Advanced Filter Dropdowns` → `SFW Content Safety Toggle Badge`  [AMBIGUOUS]
  design/stitch/biblioteca_tesoros/screen.png · relation: conceptually_related_to
- `Import Sources Backup Button (Importar respaldo de fuentes .json)` → `Nido Security Card (Seguridad del Nido)`  [AMBIGUOUS]
  design/stitch/fuentes_portales/screen.png · relation: conceptually_related_to

## Knowledge Gaps
- **132 isolated node(s):** `@expo/metro-runtime`, `@noble/hashes`, `@ryuunest/module-sdk`, `@ryuunest/test-site`, `@ryuunest/ui-tokens` (+127 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1239 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **63 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ModuleError` connect `ModuleError` to `MemoryStorage`, `ReaderState`, `DeclarativeRuntime`, `ModuleApi`, `DeclarativeRuntime.ts`, `ModuleRegistry`, `sourcesFixtures.ts`, `ReaderMode`, `sourcesController.ts`, `Lista de tareas — RyuuNest Parte 1 (Back-end / Núcleo)`, `sites.ts`, `ModuleHost`, `.addRepo`, `settingsData.ts`, `SqlDriver.ts`, `readingSource.ts`, `sourcesData.ts`, `SqlDriver`, `MediaKind`, `ProgressStore.ts`, `updateFlow.test.ts`, `Task T24: Preferencias por serie (modo de lectura, release preferida)`, `useBackupData.ts`, `core/src/index.ts`, `FixedClock`, `runtimeSelection.test.ts`, `installer.test.ts`, `discoverData.ts`, `types.ts`, `errors.ts`, `fakes.ts`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `ModuleError` (e.g. with `Anexo A: inventario de la superficie` and `Decisión 1: qué se puede congelar ya`) actually correct?**
  _`ModuleError` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@expo/metro-runtime`, `@noble/hashes`, `@ryuunest/module-sdk` to the rest of the system?**
  _132 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `DiscoverScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12179487179487179 - nodes in this community are weakly interconnected._
- **Why does `Lista de tareas — RyuuNest Parte 1 (Back-end / Núcleo)` connect `Lista de tareas — RyuuNest Parte 1 (Back-end / Núcleo)` to `MemoryStorage`, `BottomNav.tsx`, `ModuleApi`, `Task T05: Calibración de dispositivos y presupuesto de memoria`, `Task T11: CLI del SDK + plantilla de módulo`, `Task T27: Máquina de estados del lector (headless)`, `ui-tokens/src/index.ts`, `Task T30: E2E de respaldo (AC-7)`, `Task T32: Segundo sitio falso de otra arquitectura + ADR de congelación de API 1.0`, `Task F21: Respaldo (UI)`, `Task F23: Lector para TV (D-pad)`, `Task F27: Puente web ↔ extensión (Host sobre mensajes)`, `Task F28: Playwright por pantalla + `DIFFS.md` + lista de 20 s (AC-12)`, `Task T35: Puertas de CI / contrato / cobertura`, `SqlDriver`, `updateFlow.test.ts`, `Task T15: E2E de instalación desde fixture (AC-2, AC-8)`, `Task T24: Preferencias por serie (modo de lectura, release preferida)`, `.release`, `i18n/index.ts`, `FixedClock`, `runtimeSelection.test.ts`, `types.ts`, `fakes.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Tipo and Portal Advanced Filter Dropdowns` and `SFW Content Safety Toggle Badge`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Import Sources Backup Button (Importar respaldo de fuentes .json)` and `Nido Security Card (Seguridad del Nido)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._