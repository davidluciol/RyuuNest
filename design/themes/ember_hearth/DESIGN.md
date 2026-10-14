---
name: Ember Hearth
colors:
  surface: '#17120d'
  surface-dim: '#17120d'
  surface-bright: '#3f3832'
  surface-container-lowest: '#120d09'
  surface-container-low: '#201b15'
  surface-container: '#241f19'
  surface-container-high: '#2f2923'
  surface-container-highest: '#3a342e'
  on-surface: '#ece0d8'
  on-surface-variant: '#d9c2b2'
  inverse-surface: '#ece0d8'
  inverse-on-surface: '#362f29'
  outline: '#a18d7e'
  outline-variant: '#544437'
  surface-tint: '#ffb77b'
  primary: '#ffb77b'
  on-primary: '#4d2700'
  primary-container: '#e58e3c'
  on-primary-container: '#592e00'
  inverse-primary: '#8f4e00'
  secondary: '#ffb690'
  on-secondary: '#552100'
  secondary-container: '#ad4b00'
  on-secondary-container: '#ffe2d5'
  tertiary: '#dfc1ac'
  on-tertiary: '#3f2c1e'
  tertiary-container: '#b99d89'
  on-tertiary-container: '#483526'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdcc2'
  primary-fixed-dim: '#ffb77b'
  on-primary-fixed: '#2e1500'
  on-primary-fixed-variant: '#6d3a00'
  secondary-fixed: '#ffdbcb'
  secondary-fixed-dim: '#ffb690'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#783100'
  tertiary-fixed: '#fcdcc7'
  tertiary-fixed-dim: '#dfc1ac'
  on-tertiary-fixed: '#28180b'
  on-tertiary-fixed-variant: '#574233'
  background: '#17120d'
  on-background: '#ece0d8'
  surface-variant: '#3a342e'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 3.5rem
    fontWeight: '700'
    lineHeight: 4.25rem
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Manrope
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 1.625rem
    fontWeight: '700'
    lineHeight: 2.125rem
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Manrope
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Manrope
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
  body-reading:
    fontFamily: Manrope
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.875rem
    letterSpacing: 0.01em
  body-md:
    fontFamily: Manrope
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.625rem
  body-sm:
    fontFamily: Manrope
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
  label-lg:
    fontFamily: Manrope
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: 0.02em
  label-md:
    fontFamily: Manrope
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Manrope
    fontSize: 0.6875rem
    fontWeight: '500'
    lineHeight: 0.875rem
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-desktop: 2rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system is tailored for immersive, long-duration reading experiences in dimly lit and late-night environments. It evokes the sensory intimacy of an ember-lit hearth: organic warmth, soothing sepia undertones, gentle tactile resonance, and absolute visual relief for tired eyes. 

The aesthetic synthesizes warm minimalism with cozy, tactile undertones. Rather than harsh contrasts or clinical grays, the UI lives within an analog palette of charred woods, deep espresso bases, raw parchment, and glowing amber accents. It rejects hyper-glossy or stark clinical metaphors in favor of soft, pillowed depths, diffused warm glows, and tranquil typography designed to minimize ocular strain while preserving clear legibility.

## Colors

The palette is tuned specifically for low blue-light emission and gentle reading transitions. Surface tiers create clear structure without relying on high-contrast dividers:

- **Canvas Background (`#18130E`)**: Deep charred coffee ground tone. Provides an ultra-low glare foundation for nocturnal sessions.
- **Surface (`#241D16`)**: Ground-level card and section background.
- **Surface Container (`#2A221A`)**: Mid-tier surface for grouped content, input troughs, and nested panels.
- **Surface Elevated (`#32271E`)**: Top-level elevation tier for floating toolbars, popovers, and contextual reading controls.
- **Border / Subtle Divider (`#453528`)**: Soft wooden outline providing boundary definition at minimal luminance contrast.
- **Text Primary (`#F5EBDD`)**: Warm, unbleached parchment tone. High legibility against dark surfaces without the blinding glare of pure white.
- **Text Secondary (`#B5A391`)**: Toasted oat tone for metadata, chapter timestamps, and peripheral navigation.
- **Primary / Accent (`#E58E3C`)**: Warm campfire amber. Used for primary interactive triggers, active reading markers, and critical affordances.
- **Progress / Secondary Accent (`#D96B27`)**: Terracotta orange for chapter reading progress, scrobblers, and heatmaps.
- **Badge / Interactive Container (`#382618`)**: Deep ember glow tone for tag backgrounds, badges, and toggle tracks.

## Typography

Manrope delivers geometric balance tempered with open counters and soft joins, making it fatigue-free during extended nighttime reading sessions.

- **Reading Flow**: `body-reading` features a generous line-height multiplier (~1.66) to eliminate visual crowding. Maximum content line length for text viewports must adhere strictly to 65–75 characters.
- **Headlines**: Semi-bold to bold weights maintain presence on warm dark grounds without needing intense white glow. Letter-spacing tightens slightly on larger displays to retain optical cohesion.
- **Labels & Microcopy**: Formatted with slightly increased tracking to ensure rapid legibility at low-contrast thresholds.

## Layout & Spacing

The layout philosophy centers on a fluid, adaptive column structure with generous margins that frame the reading viewport like a physical book block.

- **Desktop (>= 1024px)**: 12-column grid. Max reading column width locked to `720px` to maintain optimal line length. Tooling, chapter navigation, and library shelves sit in flanking collateral rails.
- **Tablet (768px - 1023px)**: 8-column layout. Toolbars condense into dismissible floating panels or drawer overlays.
- **Mobile (< 768px)**: 4-column system. Edge margins shift to `1rem` to maximize horizontal reading area while preserving thumb-comfort zones.

Spacing cadence follows a base-8 rhythmic step, creating predictable breathing room between reader headers, page contents, and auxiliary UI.

## Elevation & Depth

Visual hierarchy is constructed through **tonal layering** and **diffused amber-tinted ambient glow**, avoiding clinical cold dropshadows entirely.

- **Level 0 (Base Canvas)**: `#18130E`. Flat ground for full-bleed reading modes.
- **Level 1 (Docked Surfaces / Panels)**: `#241D16` paired with a 1px border of `#453528`.
- **Level 2 (Containers / Cards)**: `#2A221A` layered over `#241D16`. Supported by subtle, deep shadow: `0 4px 16px -2px rgba(8, 6, 4, 0.45)`.
- **Level 3 (Floating Controls / Overlays)**: `#32271E` with a 1px border of `#453528` and an ambient warm glow shadow: `0 8px 24px -4px rgba(12, 9, 6, 0.65), 0 0 12px 0 rgba(229, 142, 60, 0.06)`.

Surfaces never feel disconnected from the canvas; they visually nest as physical sheets of dark leather, clay, and wood.

## Shapes

The shape system commits to an organic radius profile spanning **8px to 12px** (`roundedness: 2`), reflecting soft book corners and handcrafted stationery:

- **Standard Elements (8px / `0.5rem`)**: Input boxes, list items, small buttons, badges, and toggle chips.
- **Container Elements (12px / `0.75rem`)**: Shelf cards, reading modal overlays, reading setting sheets, and navigation sheets.
- **Reading Progress & Continuous Sliders**: Fully rounded ends (pill bounds) to evoke fluid candle wax or molten warmth.

## Components

### Buttons
- **Primary**: Solid background `#E58E3C` with text `#18130E` (bold weight). Hover: lighten to `#EDA35C`. Active: compress slightly (0.98 scale) with background `#D96B27`. Radius: `8px`.
- **Secondary / Surface**: Background `#2A221A`, border 1px `#453528`, text `#F5EBDD`. Hover: background `#32271E`, border `#E58E3C`.
- **Ghost**: Background transparent, text `#B5A391`. Hover: text `#F5EBDD`, background `#241D16`.

### Chips & Badges
- **Status / Category Badges**: Background `#382618`, border 1px `#453528`, text `#E58E3C`, typography `label-sm`.
- **Filter Chips**: Inactive: `#241D16` border `#453528` with `#B5A391`. Active: `#382618` border `#E58E3C` with text `#F5EBDD`.

### Reading Progress Indicator
- Track: `#2A221A`, height `6px`, radius pill.
- Filled Progress: `#D96B27` transitioning to `#E58E3C` gradient. Subtle trailing glow overlay for the active reading head.

### Cards & Book Items
- Background `#241D16`, border 1px `#453528`, radius `12px`, padding `space-md`.
- Hover state raises container subtly to `#2A221A` accompanied by an expanded warm ambient shadow.

### Input Fields & Search Bars
- Background `#2A221A`, border 1px `#453528`, radius `8px`, text `#F5EBDD`, placeholder `#B5A391`.
- Focus state: border `#E58E3C`, subtle outer ring `0 0 0 2px rgba(229, 142, 60, 0.25)`.

### Checkboxes & Radios
- Box/Frame: Background `#241D16`, border 1.5px `#453528`, radius `4px` (checkbox) or circle (radio).
- Checked: Background `#E58E3C`, icon / inner glyph `#18130E`.

### Night Session Floating Reader Controls
- Docked pill/sheet floating over page content: background `#32271E` (elevation tier 3) with border 1px `#453528`, containing font size, column width, and chapter scrubbing tools with icons tinted in `#B5A391`, switching to `#E58E3C` upon activation.