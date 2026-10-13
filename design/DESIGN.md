---
name: Dragon Night
colors:
  surface: '#141923'
  surface-dim: '#10131a'
  surface-bright: '#363940'
  surface-container-lowest: '#0b0e14'
  surface-container-low: '#191c22'
  surface-container: '#1d2026'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e1e2eb'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#e1e2eb'
  inverse-on-surface: '#2e3037'
  outline: '#86948a'
  outline-variant: '#3d4a41'
  surface-tint: '#51de9d'
  primary: '#35C98A'
  on-primary: '#003822'
  primary-container: '#35c98a'
  on-primary-container: '#004f32'
  inverse-primary: '#006c46'
  secondary: '#FF9F43'
  on-secondary: '#4c2700'
  secondary-container: '#d37b20'
  on-secondary-container: '#432100'
  tertiary: '#9B7BFF'
  on-tertiary: '#370095'
  tertiary-container: '#baa4ff'
  on-tertiary-container: '#4c25ab'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#71fcb8'
  primary-fixed-dim: '#51de9d'
  on-primary-fixed: '#002112'
  on-primary-fixed-variant: '#005234'
  secondary-fixed: '#ffdcc2'
  secondary-fixed-dim: '#ffb77a'
  on-secondary-fixed: '#2e1500'
  on-secondary-fixed-variant: '#6d3a00'
  tertiary-fixed: '#e8ddff'
  tertiary-fixed-dim: '#cdbdff'
  on-tertiary-fixed: '#20005e'
  on-tertiary-fixed-variant: '#4f28ae'
  background: '#10131a'
  on-background: '#e1e2eb'
  surface-variant: '#32353c'
  surface-elevated: '#1B2230'
  border: '#263147'
  text-primary: '#F2F0EA'
  text-secondary: '#9BA5B5'
  badge-bg: '#1C2E29'
  status-positive: '#4DD599'
  status-warning: '#F5C451'
  status-error: '#F06A6A'
  accent: '#35C98A'
  progress: '#FF9F43'
  accent-alt: '#9B7BFF'
  bg: '#0B0E14'
  elevated: '#1B2230'
  positive: '#4DD599'
  warning: '#F5C451'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Manrope
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-mobile: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xxs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

### Visual Narrative & Atmospheric Purpose
This design system crafts an immersive personal sanctuary—a digital lair for reading manga, manhua, webtoons, and graphic novels. It reconciles two essential states: an atmospheric, mysterious browsing hub ("The Lair") and a completely invisible, utilitarian reader canvas ("The Sanctum"). 

The tone balances otaku fantasy sensibilities with restrained, architectural minimalism. It deliberately avoids noisy MMORPG tropes, skeuomorphic parchment textures, and gamified clutter. Instead, it projects the quiet precision of an OLED-optimized night library: deep blue-carbon voids, crisp typography, and purposeful luminescence that guides visual flow without visual fatigue.

### Core Principles
1. **Special to Explore, Invisible to Read:** During navigation, atmospheric dark layering and deliberate accent fires create an engaging collector's vault. Once a chapter opens, the UI recedes completely, leaving zero decorative borders, ambient animations, or mascot intrusions.
2. **True OLED Performance:** Surfaces rely on dark blue-blacks rather than flat neutral greys, preserving battery life and minimizing screen glare in pitch-black reading sessions.
3. **Ergonomic Tactility & Fluid Legibility:** Hit targets maintain generous mobile scale with clear visual boundaries, prioritizing quick thumb reach and clean spatial focus for remote controls.

## Colors

### Chromatic Architecture
The primary palette anchors to dark depths, illuminated by sharp functional highlights:
- **Primary (`#35C98A` Emerald Dragon):** High-priority interactive elements, "Continuar" triggers, active focus indicators, and confirmation touchpoints.
- **Secondary (`#FF9F43` Dragon Flame Amber):** Real-time progress indicators, chapters currently in progress, and unread chapter tallies.
- **Tertiary (`#9B7BFF` Arcane Violet):** Reserved for alternate catalog taxonomy, discovery features, and mystical vault indicators.
- **Neutral Canvas (`#0B0E14` OLED Abyss):** Deep, blued midnight base that serves as root canvas and the designated high-contrast ink color over saturated buttons.

### Critical Accessibility & Inversion Rule (WCAG AA Compliance)
Due to the high relative luminance of both `#35C98A` (Emerald) and `#FF9F43` (Amber), light typography fails baseline legibility:
- **Mandatory Button Text Inversion:** Any button, badge, or chip filled with `#35C98A` or `#FF9F43` **must** render text and icons in `#0B0E14` (Deep Blue-Black), yielding contrast ratios well above 9:1.
- **Secondary Metadata Legibility:** `--text-secondary` (`#9BA5B5`) meets WCAG AA exclusively when layered over `#0B0E14`, `#141923`, or `#1B2230`. It must never be applied directly over tinted badges or translucent overlays without explicit verification.
- **Non-Color Dependent Indicators:** All status signals (completed, in-progress, failed chapters) must pair semantic colors with SVG iconography and clear typographic text.

## Typography

### Hierarchy & Type Pairing
- **Headlines & Display (`Manrope`):** Modern geometric sans-serif featuring structural balance and open counters. Manrope delivers brand authority across library hubs, empty-state declarations, and modal headers.
- **Body, Navigation, & Controls (`Inter`):** Selected for uncompromised legibility at compact sizes, high x-height, and neutral character. Inter governs chapter numbers, sync logs, reading settings, and tag taxonomy.

### Platform Scaling Rules
- **Mobile Foundation:** The body base size is strictly clamped at a minimum of `16px` for touch targets and critical lists to prevent reader squinting during midnight sessions.
- **10-Foot UI (Android TV):** Headings, chapter labels, and reading controls increase by a multiplier of 1.25x across all standard tokens to ensure comfortable viewing from couch distance.
- **Thematic Microcopy Pairing:** Primary structural titles are paired with thematic metadata anchors in uppercase `label-sm` tracking (e.g., "BIBLIOTECA" paired with "Tesoros", "FUENTES" paired with "Portales").

## Layout & Spacing

### Layout Structure & Fluid Rhythm
The system operates on an uncompromising 4px metric grid (`0.25rem` intervals). All layout distance, internal component padding, and inter-item gaps are whole multiples of this increment.

- **Mobile Viewport (< 600px):** Single-column content or 2-to-3-column manga cover poster grids (`aspect-ratio: 2/3`). Outer margins default to `1rem` (16px) with a vertical comfortable density rhythm.
- **Tablet & Compact Web (600px - 1024px):** 4-to-6-column poster grids with a responsive lateral reading drawer and `1.5rem` section buffers.
- **Desktop (> 1024px):** Fixed-width side rail navigation (240px) paired with an 8-column auto-fill media grid with fluid wrapping (`margin-desktop: 2rem`).
- **Touch Target Integrity:** Every interactive zone—including icon buttons, dropdown arrows, chapter list rows, and scrubber controls—must guarantee a minimum bounding area of `48px × 48px` (`3rem × 3rem`).

## Elevation & Depth

### Chromatic Layering (Zero-Drop-Shadow Model)
Depth is established primarily through physical surface luminance shifts rather than fuzzy, light-polluting blur shadows. Drop shadows are strictly omitted in favor of structural background stepping:

- **Elevation Level 0 (Abyss / Root Canvas):** `#0B0E14` — Foundation canvas, full-screen manga reader viewport, and full bleed backgrounds.
- **Elevation Level 1 (Surface / Containers):** `#141923` — Manga cover cards, chapter list items, search inputs, and nested setting panels.
- **Elevation Level 2 (Elevated / Floating Sheets):** `#1B2230` — Bottom sheets, dialogs, quick-menu flyouts, and floating bottom navigation bars.

### Boundary Framing & Focus Rings
- **Ghost Outlines:** Elevated containers and cards utilize low-contrast outlines defined by `--border` (`#263147`, 1px solid) to clarify edges against true black.
- **High-Visibility Spatial Focus (TV D-Pad & Keyboard):** Active focus elements feature a non-diffuse, 2px structural outline in `--accent-primary` (`#35C98A`) with an offset of 2px, providing immediate visual confirmation from distant sightlines.
- **NSFW Content Blur Filter:** Sensitive covers dynamically apply a hardware-accelerated CSS `backdrop-filter: blur(16px)` layer beneath a discreet age tag.

## Shapes

### Corner Radii Guidelines
The shape language uses balanced curvature (`roundedness: 2`) to balance modern software efficiency with approachable, organic softness:

- **Small Components (`0.5rem` / 8px):** Form inputs, tooltips, chapter list rows, and inline badges.
- **Standard Cards (`0.75rem` - `1rem` / 12px - 16px):** Manga cover preview posters, reading stat tiles, and alert callouts.
- **Modals & Drawers (`1rem` - `1.5rem` / 16px - 24px):** Top corners of sliding bottom navigation sheets and centered dialog overlays.
- **Pill Shape (`9999px`):** Filter tags (`Todo`, `Leyendo`, `Completado`), quick-jump page pills, and status chips.

## Components

### Buttons
- **Primary CTA ("Continuar Lectura"):** Filled with `--accent-primary` (`#35C98A`). Text and Lucide iconography strictly set in `#0B0E14` (Deep Blue-Black), bold 14px/16px. Height `48px`. Corner radius `8px` (`0.5rem`).
- **Secondary / Action Ghost:** Surface fill `#1B2230`, subtle 1px border `#263147`, text in `--text-primary` (`#F2F0EA`). Active touch state triggers a 10% opacity overlay of emerald.
- **Destructive:** Bordered with `#F06A6A`, transparent fill, text `#F06A6A`.

### Chips & Filter Pills
- **Filter Chip:** Pill-shaped (`9999px`), height `36px`, padding `0 1rem`. 
  - *Inactive:* Surface `#141923`, border `1px solid #263147`, text `#9BA5B5`.
  - *Selected:* Fill `--badge-bg` (`#1C2E29`), border `1px solid #35C98A`, text `#35C98A`.
- **Status Badges (e.g., "Manhwa", "Scan"):** Compact pill, height `24px`, background `#1C2E29`, text `#35C98A`, font size `11px`.

### Manga Cover Cards
- **Structure:** 2:3 vertical aspect ratio, `12px` corner radius, hairline border `#263147`.
- **Progress Track:** When a chapter is in progress, a 3px linear track spans the bottom edge of the card, filled with `--accent-progress` (`#FF9F43`).
- **Unread Counter:** Anchored top-right corner. Background `#FF9F43`, text `#0B0E14`, font weight bold, font size `12px`.

### Chapter List Rows
- **Layout:** Min-height `56px`, horizontal padding `1rem`, flex distribution with chapter title, upload date, and read state.
- **States:**
  - *Unread:* Text `#F2F0EA`, regular weight.
  - *In Progress:* Accent marker `●` in `#FF9F43`, subtitle displaying reading percentage in `#FF9F43`.
  - *Completed:* Muted text `#9BA5B5`, checkmark `✓` icon in `#4DD599`.

### Input Fields & Search Bars
- **Container:** Background `#141923`, 1px border `#263147`, height `48px`, corner radius `8px`.
- **Typographic Scale:** Body text `#F2F0EA`, placeholder `#9BA5B5`. Left-aligned 20px Lucide search icon in `#9BA5B5`.
- **Active Focus:** Border transitions to `#35C98A` with no offset glow.

### Checkboxes & Radios
- **Geometry:** 20px × 20px, 4px corner radius for checkboxes, full circle for radios.
- **States:** Border 1.5px `#263147`. Checked state fills with `#35C98A`, displaying `#0B0E14` glyph icons.

### Reader View Overlays (HUD)
- **Top / Bottom Reading Bars:** Background `#1B2230` with 95% opacity. Border lines `#263147`. Completely absent of decorative branding, shadows, or mascot illustrations to keep the canvas clean.