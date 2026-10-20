# Graph Report - RyuuNest  (2026-10-17)

## Corpus Check
- 177 files · ~254,944 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .ttf 5, (none) 4)

## Summary
- 1263 nodes · 2496 edges · 110 communities (70 shown, 40 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 121 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Clock and Declarative Contract Tests
- FoxMangas and Luscious Scrapers
- HTML Parsing Helpers
- Repository Index Format
- Calibration PNG Generator
- Module Host Runtime
- Host and Manifest Types
- Manifest Validator Test Doubles
- Lint and Package Config
- Hex and Archive Utilities
- Module SDK Package Config
- Module Registry
- Host HTTP Layer
- Package Installer
- Core Parser Dependencies
- Design Rules and Screens
- Module Error Mapping
- Base TypeScript Config
- Declarative Runtime Types
- Declarative Field Transforms
- Docs, ADRs and Principles
- Core Package Manifest
- Expo App Configuration
- FoxMangas Book Logic
- Memory Settings and Domain Guard
- Density and Breakpoint Tokens
- App Test Dependencies
- Asset Generation Scripts
- Settings Screen Sections
- Mobile Package Manifest
- Image Budget Panel
- Font Loading and Typography
- Library Screen Components
- TMO Module Port
- Test Site Manifest
- Sample Module Manifest
- Design Token Test
- Detail Screen Components
- MangaIn Scraping Logic
- Sources Screen Elements
- Contrast Ratio Utilities
- Calibration App Checks
- Mobile App Dependencies
- Runtime Selection Tests
- Dragon Night Theme
- Core Error Codes
- Install Flow Orchestration
- Core Test TypeScript Config
- Discover Screen Components
- Home Screen Sections
- Module Contract and Templates
- Module API Surface
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
- TTF Name Reader
- CI Verification Pipeline
- Test Dev Dependencies
- Local Fonts and Icons
- TDD Contribution Workflow
- Monochrome Android Icon
- App Icon Brand Mark
- Splash Screen Icon
- Node Type Definitions
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

## God Nodes (most connected - your core abstractions)
1. `ModuleError` - 58 edges
2. `DeclarativeRuntime` - 28 edges
3. `ModuleHost` - 25 edges
4. `FixedClock` - 25 edges
5. `ModuleApi` - 20 edges
6. `PackageInstaller` - 20 edges
7. `Storage` - 20 edges
8. `RepoRegistry` - 20 edges
9. `MemoryStorage` - 19 edges
10. `compilerOptions` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Dragon Night theme (design/themes)` --semantically_similar_to--> `Dragon Night design system (root DESIGN.md)`  [INFERRED] [semantically similar]
  design/themes/dragon_night/DESIGN.md → DESIGN.md
- `Ajustes screen mockup` --implements--> `Dragon Night design system (root DESIGN.md)`  [INFERRED]
  design/stitch/ajustes_pantalla/code.html → DESIGN.md
- `Biblioteca (Tesoros) screen mockup` --implements--> `Dragon Night design system (root DESIGN.md)`  [INFERRED]
  design/stitch/biblioteca_tesoros/code.html → DESIGN.md
- `Descubrir (Aventuras) screen mockup` --implements--> `Dragon Night design system (root DESIGN.md)`  [INFERRED]
  design/stitch/descubrir_aventuras/code.html → DESIGN.md
- `Serie detail screen mockup` --implements--> `Dragon Night design system (root DESIGN.md)`  [INFERRED]
  design/stitch/detalle_pantalla/code.html → DESIGN.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **7 Dragon Night captures reviewed under DESIGN_RULES** — design_stitch_inicio_guarida_code_screen, design_stitch_biblioteca_tesoros_code_screen, design_stitch_descubrir_aventuras_code_screen, design_stitch_fuentes_portales_code_screen, design_stitch_pantalla_lector_code_screen, design_stitch_detalle_pantalla_code_screen, design_stitch_ajustes_pantalla_code_screen, design_rules_anti_ai_slop [EXTRACTED 1.00]
- **RyuuNest theme variants under one token architecture (v1 ships Dragon Night only)** — design_themes_dragon_night_design_theme, design_themes_arcane_vault_design_theme, design_themes_ember_hearth_design_theme, design_themes_moonlit_frost_design_theme [INFERRED 0.75]
- **Module contract API v1 (SPEC §6)** — docs_spec_md_module_manifest, docs_spec_md_module_api, docs_spec_md_module_error, docs_spec_md_host_interface, docs_spec_md_declarative_module_format, docs_spec_md_repo_index_format [EXTRACTED 1.00]
- **Secure module installation path (SPEC §7 + T13)** — docs_spec_md_installation_flow, docs_spec_md_threat_model, tasks_todo_md_t13_package_installer, docs_spec_md_repo_index_format [INFERRED 0.80]
- **Design and documentation authority chain (SPEC §11.1)** — docs_spec_md_ryuunest_spec, docs_spec_md_visual_authority_order, docs_idea_md_ryuunest_vision, docs_spec_md_design_tokens_dragon_night [INFERRED 0.80]
- **Ajustes screen grouped into vertical card sections** — design_stitch_ajustes_pantalla_screen_settings_screen, design_stitch_ajustes_pantalla_screen_local_profile, design_stitch_ajustes_pantalla_screen_language_setting, design_stitch_ajustes_pantalla_screen_reading_preferences, design_stitch_ajustes_pantalla_screen_nsfw_settings, design_stitch_ajustes_pantalla_screen_theme_picker, design_stitch_ajustes_pantalla_screen_backup_migration, design_stitch_ajustes_pantalla_screen_storage_cache, design_stitch_ajustes_pantalla_screen_footer_about [EXTRACTED 1.00]
- **Boolean settings rendered as switch toggles with explanatory subtitles** — design_stitch_ajustes_pantalla_screen_reader_toggles, design_stitch_ajustes_pantalla_screen_nsfw_settings, design_stitch_ajustes_pantalla_screen_install_protection, design_stitch_ajustes_pantalla_screen_oled_mode [EXTRACTED 1.00]
- **Privacy-first stance: no telemetry, local-only data, user-controlled content visibility and install gating** — design_stitch_ajustes_pantalla_screen_footer_about, design_stitch_ajustes_pantalla_screen_nsfw_settings, design_stitch_ajustes_pantalla_screen_install_protection [INFERRED 0.75]
- **design_stitch_biblioteca_tesoros_screen_hyper_filtering** — design_stitch_biblioteca_tesoros_screen_image, design_stitch_biblioteca_tesoros_screen_filter_chips, design_stitch_biblioteca_tesoros_screen_advanced_filters, design_stitch_biblioteca_tesoros_screen_sfw_toggle, design_stitch_biblioteca_tesoros_screen_reading_status [EXTRACTED 1.00]
- **design_stitch_biblioteca_tesoros_screen_hyper_progress_tracking** — design_stitch_biblioteca_tesoros_screen_image, design_stitch_biblioteca_tesoros_screen_cover_grid, design_stitch_biblioteca_tesoros_screen_progress_indicator, design_stitch_biblioteca_tesoros_screen_reading_status [EXTRACTED 1.00]
- **Discover screen composes search + module source + filters + curated sections + catalog grid** — design_stitch_descubrir_aventuras_screen_mockup, design_stitch_descubrir_aventuras_screen_search_field, design_stitch_descubrir_aventuras_screen_module_selector, design_stitch_descubrir_aventuras_screen_filter_chips, design_stitch_descubrir_aventuras_screen_cover_card, design_stitch_descubrir_aventuras_screen_catalog_pagination [EXTRACTED 1.00]
- **Reading resume and chapter navigation flow** — design_stitch_detalle_pantalla_screen_continue_bar, design_stitch_detalle_pantalla_screen_chapter_rows, design_stitch_detalle_pantalla_screen_chapter_toolbar [INFERRED 0.85]
- **Content provenance and extraction source disclosure** — design_stitch_detalle_pantalla_screen_origin_footer, design_stitch_detalle_pantalla_screen_source_badge, design_stitch_detalle_pantalla_screen_action_row [INFERRED 0.75]
- **Sources screen composes repository management, filtering and sync visibility** — design_stitch_fuentes_portales_screen_mockup, design_stitch_fuentes_portales_screen_add_repository, design_stitch_fuentes_portales_screen_repository_card, design_stitch_fuentes_portales_screen_category_filters, design_stitch_fuentes_portales_screen_sync_indicator [EXTRACTED 1.00]
- **Repository trust model: sandboxing, index, backup import and security card** — design_stitch_fuentes_portales_screen_security_card, design_stitch_fuentes_portales_screen_sandboxing, design_stitch_fuentes_portales_screen_repository_index, design_stitch_fuentes_portales_screen_import_backup [INFERRED 0.75]
- **Home screen vertical stack: greeting header, nido status, continue-reading hero, recent reads carousel** — design_stitch_inicio_guarida_screen, design_stitch_inicio_guarida_screen_status_card, design_stitch_inicio_guarida_screen_continue_section, design_stitch_inicio_guarida_screen_recent_reads [EXTRACTED 1.00]
- **Library organization and discovery: saved collections, portal update feed, and total work counter** — design_stitch_inicio_guarida_screen_treasures, design_stitch_inicio_guarida_screen_portal_updates, design_stitch_inicio_guarida_screen_work_count [INFERRED 0.85]
- **Navigation and resume flow: bottom tabs with primary CTA continuing the last read chapter** — design_stitch_inicio_guarida_screen_bottom_nav, design_stitch_inicio_guarida_screen_continue_section, design_stitch_inicio_guarida_screen_resume_progress [INFERRED 0.75]
- **hyper_design_stitch_pantalla_lector_screen_reader_chrome** — design_stitch_pantalla_lector_screen_top_bar, design_stitch_pantalla_lector_screen_bottom_controls, design_stitch_pantalla_lector_screen_vertical_page_stream [EXTRACTED 1.00]
- **T05 verification evidence: module load calibration on Samsung S25 Ultra** — docs_capturast05_samsung_s25ultra_screenshot, docs_capturast05_samsung_s25ultra_calibration_screen, docs_capturast05_samsung_s25ultra_module_checks [INFERRED]

## Communities (110 total, 40 thin omitted)

### Community 0 - "Clock and Declarative Contract Tests"
Cohesion: 0.06
Nodes (64): FixedClock, makeApi(), EXAMPLE_DECLARATIVE, listFields, cronicasDeMoonlit, dracoDeJade, dragonDeCeniza, findChapter() (+56 more)

### Community 1 - "FoxMangas and Luscious Scrapers"
Cohesion: 0.05
Nodes (4): Luscious, NineManga, logicTmoHentai, logicYupmanga

### Community 2 - "HTML Parsing Helpers"
Cohesion: 0.09
Nodes (16): HtmlDocument, HtmlElement, DocumentView, ElementView, parseHtml(), readText(), DeclarativeRuntime, findJoin() (+8 more)

### Community 3 - "Repository Index Format"
Cohesion: 0.12
Nodes (37): REPO_INDEX_FORMAT, REPO_INDEX_VERSION, RepoIndex, RepoModuleEntry, ValidationIssue, ValidationResult, MODULE_SDK_VERSION, MEDIA_KINDS (+29 more)

### Community 4 - "Calibration PNG Generator"
Cohesion: 0.10
Nodes (28): buildCalibrationPng(), chunk(), crc32(), header(), rawPixels(), SIGNATURE, applyPlaceholders(), BOOLEAN_FLAGS (+20 more)

### Community 5 - "Module Host Runtime"
Cohesion: 0.10
Nodes (17): HOST_DEFAULTS, HostLogger, HostLogLevel, ModuleHostOptions, sleep(), Clock, NoopSecureLock, StubHttpRequest (+9 more)

### Community 6 - "Host and Manifest Types"
Cohesion: 0.10
Nodes (25): Chapter, ChapterPages, Host, ModuleManifest, Page, Release, SeriesDetails, SeriesSummary (+17 more)

### Community 7 - "Manifest Validator Test Doubles"
Cohesion: 0.09
Nodes (18): ManifestValidator, MemoryStorage, StubHttp, RepoIndexValidator, acceptIndex(), defaultEntries(), INDEX, makeApp() (+10 more)

### Community 8 - "Lint and Package Config"
Cohesion: 0.07
Nodes (27): description, devDependencies, eslint, prettier, typescript, typescript-eslint, vitest, engines (+19 more)

### Community 9 - "Hex and Archive Utilities"
Cohesion: 0.11
Nodes (16): fromHex(), toHex(), utf8Decode(), utf8Encode(), InstallRequest, FakeArchive, defaultEntries(), FailingStorage (+8 more)

### Community 10 - "Module SDK Package Config"
Cohesion: 0.07
Nodes (28): bin, ryuunest-module, dependencies, fflate, @noble/hashes, @ryuunest/core, @ryuunest/test-site, description (+20 more)

### Community 11 - "Module Registry"
Cohesion: 0.18
Nodes (11): InstalledPackage, moduleKey(), confirmationReasons(), ModuleRegistry, ModuleRegistryOptions, UpdateOptions, UpdateResult, Storage (+3 more)

### Community 12 - "Host HTTP Layer"
Cohesion: 0.16
Nodes (8): httpErrorCode(), httpErrorMessage(), canonicalHttpsUrl(), repoIndexKey(), repoKey(), RepoRecord, RepoRegistry, describeIssues()

### Community 13 - "Package Installer"
Cohesion: 0.19
Nodes (15): InstallFlowOptions, ManifestValidateOptions, normalizeEntryPath(), PackageFile, PackageInstaller, PackageInstallerOptions, resolveHttpsUrl(), assertSafeEntryPath() (+7 more)

### Community 14 - "Core Parser Dependencies"
Cohesion: 0.09
Nodes (21): dependencies, css-select, domhandler, htmlparser2, @noble/hashes, description, exports, files (+13 more)

### Community 15 - "Design Rules and Screens"
Cohesion: 0.10
Nodes (13): Dragon Night design system (root DESIGN.md), Ajustes screen mockup, Biblioteca (Tesoros) screen mockup, Descubrir (Aventuras) screen mockup, Serie detail screen mockup, label-sm implemented at 12px (design table says 11px), Registry of accepted differences between Stitch design and implementation, Fuentes (Portales) screen mockup (+5 more)

### Community 16 - "Module Error Mapping"
Cohesion: 0.22
Nodes (10): ModuleError, describeError(), moduleErrorFromStatus(), toModuleError(), createModuleApi(), createModuleRuntime(), ModuleApiHandle, parseDeclarativeConfig() (+2 more)

### Community 17 - "Base TypeScript Config"
Cohesion: 0.10
Nodes (20): compilerOptions, declaration, declarationMap, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module (+12 more)

### Community 18 - "Declarative Runtime Types"
Cohesion: 0.15
Nodes (15): ImageRef, SeriesStatus, DeclarativeChaptersSpec, DeclarativeConfig, DeclarativeDetailsMethod, DeclarativeHasNext, DeclarativeListMethod, DeclarativePagesMethod (+7 more)

### Community 19 - "Declarative Field Transforms"
Cohesion: 0.19
Nodes (17): DeclarativeFieldSpec, applyOne(), applyTransforms(), compile(), firstNumber(), isTransformName(), joinValues(), lastSegment() (+9 more)

### Community 20 - "Docs, ADRs and Principles"
Cohesion: 0.12
Nodes (11): Inter font SIL OFL 1.1 license, Manrope font SIL OFL 1.1 license, ADR-0001 stack and conventions, ADR-0002 versions and memory budget, Definition of Done, RyuuNest SPEC (legacy version), RyuuNest SPEC (authoritative specification), pnpm workspaces configuration (+3 more)

### Community 21 - "Core Package Manifest"
Cohesion: 0.11
Nodes (17): dependencies, @ryuunest/core, description, exports, files, @ryuunest/core, license, main (+9 more)

### Community 22 - "Expo App Configuration"
Cohesion: 0.12
Nodes (16): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, expo (+8 more)

### Community 24 - "Memory Settings and Domain Guard"
Cohesion: 0.16
Nodes (7): HostRequestInit, HostResponse, createMemorySettings(), ModuleHost, ModuleSettings, makeHost(), makeHost()

### Community 25 - "Density and Breakpoint Tokens"
Cohesion: 0.28
Nodes (11): breakpoints, coverAspectRatio, densities, Density, DensityName, touchTarget, UI_TOKENS_VERSION, radii (+3 more)

### Community 26 - "App Test Dependencies"
Cohesion: 0.13
Nodes (13): fflate, htmlparser2, @noble/hashes, typescript, vitest, main, name, private (+5 more)

### Community 27 - "Asset Generation Scripts"
Cohesion: 0.18
Nodes (3): output, png, SRC_DIR

### Community 28 - "Settings Screen Sections"
Cohesion: 0.15
Nodes (14): Backup & Migration Section (Export/Import .json), Bottom Navigation (Portales / Ajustes), About Footer (RyuuNest v1.0.0, GPL-3.0, no telemetry), Module Install Protection (PIN/biometrics), App Language Selector (Idioma), Local Profile Card (Perfil Local), NSFW Content & Privacy Settings (Seguridad y Contenido), Pure OLED Black Mode Toggle (+6 more)

### Community 29 - "Mobile Package Manifest"
Cohesion: 0.13
Nodes (14): description, exports, files, license, main, name, private, scripts (+6 more)

### Community 30 - "Image Budget Panel"
Cohesion: 0.27
Nodes (11): Calibration Page Gradient Image, Full-Screen Color Gradient Calibration Pattern, capFor(), clampCount(), decodedBytes(), toMB(), ImageCapPanel(), step() (+3 more)

### Community 31 - "Font Loading and Typography"
Cohesion: 0.24
Nodes (9): FONTS_DIR, FontFile, fontFiles, fontLicenses, FontFamily, fonts, TypeStyle, TypeToken (+1 more)

### Community 32 - "Library Screen Components"
Cohesion: 0.18
Nodes (13): Tipo and Portal Advanced Filter Dropdowns, Bottom Tab Navigation (Inicio, Biblioteca, Descubrir, Fuentes, Ajustes), Manga Cover Grid Cards with Type Badge and Chapter Info, Library Status Filter Chips (Todo, Leyendo, Carpetas), User Folder Organization Concept (Favoritos, Lectura Nocturna), Carpetas Folder Cards Section with Manage Action, Library Screen Header Bar, Biblioteca Library Screen Mockup (+5 more)

### Community 34 - "Test Site Manifest"
Cohesion: 0.14
Nodes (13): apiVersion, baseUrl, capabilities, entry, id, kinds, lang, name (+5 more)

### Community 35 - "Sample Module Manifest"
Cohesion: 0.14
Nodes (13): apiVersion, baseUrl, capabilities, entry, id, kinds, lang, name (+5 more)

### Community 36 - "Design Token Test"
Cohesion: 0.14
Nodes (8): COLOR_ALIASES, designColors, designMd, designRadii, designSpacing, designTypography, FM, TYPE_ALIASES

### Community 37 - "Detail Screen Components"
Cohesion: 0.22
Nodes (13): Manga Detail Screen Mockup, Action Buttons Row (Favoritos, Descargar, Vertical), Chapter Row Component with Read/Unread/In-Progress States, Chapter List Toolbar (search, sort, status filter chips), Continuar Leyendo Progress Bar (Cap. 24, 42%), Dark Theme with Green Accent Palette, Genre Filter Chip Row, Load Older Chapters Pagination Button (+5 more)

### Community 39 - "Sources Screen Elements"
Cohesion: 0.18
Nodes (11): Add Repository Button (Añadir repositorio), Content Type Filter Chips (Todos, Manga, Manhwa, Cómic), Top Navigation Header (search, notifications, profile), Import Sources Backup Button (Importar respaldo de fuentes .json), Fuentes (Sources/Portals) Screen Mockup, Community Repository Card (Repositorio Comunitario, ACTIVO), JSON Repository Index (repo.ejemplo.org/indice.json), Nido Security Card (Seguridad del Nido) (+3 more)

### Community 40 - "Contrast Ratio Utilities"
Cohesion: 0.29
Nodes (9): contrastRatio(), hexToRgb(), relativeLuminance(), Rgb, toLinear(), WCAG_AA, Foreground, NON_TEXT_PAIRS (+1 more)

### Community 41 - "Calibration App Checks"
Cohesion: 0.24
Nodes (8): App(), check(), CheckResult, moduleLoadAt, runChecks(), styles, expo, expo-status-bar

### Community 42 - "Mobile App Dependencies"
Cohesion: 0.18
Nodes (11): dependencies, expo, expo-status-bar, fflate, htmlparser2, lucide-react-native, @noble/hashes, react (+3 more)

### Community 43 - "Runtime Selection Tests"
Cohesion: 0.24
Nodes (4): FakeScriptLoader, ScriptFactory, BUSCAR_HTML, DECLARATIVE_ENTRY

### Community 44 - "Dragon Night Theme"
Cohesion: 0.33
Nodes (7): dragonNightColors, ThemeColors, defaultTheme, dragonNight, getTheme(), Theme, themes

### Community 45 - "Core Error Codes"
Cohesion: 0.29
Nodes (6): isModuleError(), isModuleErrorCode(), MODULE_ERROR_CODES, ModuleErrorCode, ModuleErrorDetails, CORE_VERSION

### Community 46 - "Install Flow Orchestration"
Cohesion: 0.31
Nodes (5): MediaKind, InstallConfirmation, InstallFlow, InstallPreview, RepoModuleSummary

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

### Community 51 - "Module API Surface"
Cohesion: 0.33
Nodes (3): ModuleApi, guardApi(), ModuleRuntime

### Community 52 - "UI Package Test Config"
Cohesion: 0.22
Nodes (8): compilerOptions, noEmit, paths, extends, include, ../../tsconfig.base.json, @ryuunest/core, @ryuunest/test-site

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
Cohesion: 0.29
Nodes (6): compilerOptions, paths, strict, extends, @ryuunest/ui-tokens, expo/tsconfig.base

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

### Community 63 - "TTF Name Reader"
Cohesion: 0.50
Nodes (4): readTtfNames(), TtfNames, weightFrom(), WEIGHTS

### Community 64 - "CI Verification Pipeline"
Cohesion: 0.50
Nodes (4): CI pipeline (lint, typecheck, test, build), Verification gate: pnpm lint / typecheck / test / build, P-17: pnpm workspaces monorepo with Vitest, Open question 16: CI runs test before build, likely red on clean checkout

### Community 65 - "Test Dev Dependencies"
Cohesion: 0.50
Nodes (4): devDependencies, @types/react, typescript, vitest

### Community 66 - "Local Fonts and Icons"
Cohesion: 0.50
Nodes (3): Inter 4.1 font bundle (OFL-1.1), Lucide icon set via single entry apps/mobile/src/icons.ts, Manrope 4.505 font bundle (OFL-1.1)

### Community 69 - "App Icon Brand Mark"
Cohesion: 0.67
Nodes (3): Mobile App Icon (Blue Chevron Mark), RyuuNest App Brand Identity, Icon Construction Grid Guides

### Community 70 - "Splash Screen Icon"
Cohesion: 1.00
Nodes (3): Minimal Concentric Rings Design, Splash Icon PNG, App Launch Screen Branding Asset

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

## Ambiguous Edges - Review These
- `Tipo and Portal Advanced Filter Dropdowns` → `SFW Content Safety Toggle Badge`  [AMBIGUOUS]
  design/stitch/biblioteca_tesoros/screen.png · relation: conceptually_related_to
- `Import Sources Backup Button (Importar respaldo de fuentes .json)` → `Nido Security Card (Seguridad del Nido)`  [AMBIGUOUS]
  design/stitch/fuentes_portales/screen.png · relation: conceptually_related_to

## Knowledge Gaps
- **117 isolated node(s):** `@noble/hashes`, `@ryuunest/ui-tokens`, `fflate`, `htmlparser2`, `react-native-svg` (+112 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 546 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **40 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ModuleError` connect `Module Error Mapping` to `Clock and Declarative Contract Tests`, `HTML Parsing Helpers`, `Module Host Runtime`, `Host and Manifest Types`, `Manifest Validator Test Doubles`, `Hex and Archive Utilities`, `Module Registry`, `Host HTTP Layer`, `Package Installer`, `Core Error Codes`, `Install Flow Orchestration`, `Runtime Selection Tests`, `Declarative Runtime Types`, `Declarative Field Transforms`, `Memory Settings and Domain Guard`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `@noble/hashes`, `@ryuunest/ui-tokens`, `fflate` to the rest of the system?**
  _117 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Clock and Declarative Contract Tests` be split into smaller, more focused modules?**
  _Cohesion score 0.056790123456790124 - nodes in this community are weakly interconnected._
- **Why does `ModuleHost` connect `Memory Settings and Domain Guard` to `Clock and Declarative Contract Tests`, `HTML Parsing Helpers`, `Calibration PNG Generator`, `Module Host Runtime`, `Host and Manifest Types`, `Manifest Validator Test Doubles`, `Runtime Selection Tests`, `Declarative Runtime Types`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Should `FoxMangas and Luscious Scrapers` be split into smaller, more focused modules?**
  _Cohesion score 0.05310734463276836 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Tipo and Portal Advanced Filter Dropdowns` and `SFW Content Safety Toggle Badge`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Import Sources Backup Button (Importar respaldo de fuentes .json)` and `Nido Security Card (Seguridad del Nido)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._