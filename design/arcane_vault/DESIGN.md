---
name: Arcane Vault
colors:
  surface: '#12131e'
  surface-dim: '#12131e'
  surface-bright: '#383845'
  surface-container-lowest: '#0c0d18'
  surface-container-low: '#1a1b26'
  surface-container: '#1e1f2a'
  surface-container-high: '#282935'
  surface-container-highest: '#333440'
  on-surface: '#e2e1f1'
  on-surface-variant: '#cac3d6'
  inverse-surface: '#e2e1f1'
  inverse-on-surface: '#2f2f3c'
  outline: '#948e9f'
  outline-variant: '#494553'
  surface-tint: '#cdbdff'
  primary: '#cdbdff'
  on-primary: '#370095'
  primary-container: '#9b7bff'
  on-primary-container: '#300085'
  inverse-primary: '#6745c7'
  secondary: '#42e8b6'
  on-secondary: '#003829'
  secondary-container: '#00cb9c'
  on-secondary-container: '#00503b'
  tertiary: '#c9bffa'
  on-tertiary: '#31295a'
  tertiary-container: '#938ac1'
  on-tertiary-container: '#2b2353'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e8ddff'
  primary-fixed-dim: '#cdbdff'
  on-primary-fixed: '#20005e'
  on-primary-fixed-variant: '#4f28ae'
  secondary-fixed: '#5dfcc9'
  secondary-fixed-dim: '#35dfae'
  on-secondary-fixed: '#002116'
  on-secondary-fixed-variant: '#00513c'
  tertiary-fixed: '#e6deff'
  tertiary-fixed-dim: '#c9bffa'
  on-tertiary-fixed: '#1c1343'
  on-tertiary-fixed-variant: '#484072'
  background: '#12131e'
  on-background: '#e2e1f1'
  surface-variant: '#333440'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Manrope
    fontSize: 30px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Manrope
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
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
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system channels an elevated, modern anime otaku fantasy aesthetic tailored for RyuuNest. It merges mystical arcane sorcery with high-precision digital interfaces. The emotional response evokes secrecy, power, curatorial luxury, and the thrill of cataloging sacred artifacts, lore, and vault-tier collections.

The visual execution pairs a rich, deep-space midnight indigo foundation with high-contrast, luminescent arcane violet and reactive mint accents. Tonal layering and glowing chromatic borders create depth, giving interactive elements the presence of enchanted digital relics without crossing into retro skeuomorphism.

## Colors

The palette operates on pure chromatic resonance within a pitch-dark space. Light is treated as magical luminescence emitting directly from surfaces, runes, and key actions.

### Core Swatches
- **Canvas Base (`#0E0F1A`)**: Absolute backdrop; midnight abyss providing zero-glare contrast.
- **Surface Tier 1 (`#16182B`)**: Base panels, sidebars, and structural groupings.
- **Surface Container Tier 2 (`#1C1F36`)**: Default interactive cards, modules, and list entries.
- **Surface Elevated Tier 3 (`#1F223D`)**: Overlays, contextual menus, tooltips, and floating sheets.
- **Structural Border (`#2E3357`)**: Crisp containment lines preventing color bleed.
- **Primary Violet (`#9B7BFF`)**: Arcane power source. Used for key call-to-actions, active states, active tab strokes, and focused borders.
- **Luminescent Mint (`#38E1B0`)**: Kinetic energy. Used for progress tracks, completed achievements, high-tier rarity flags, and positive status tokens.
- **Badge Container (`#2B2353`)**: Low-luminance tinted substrate for badges, tags, and tertiary highlights.
- **Text High-Contrast (`#F4F3FB`)**: Core editorial reading color, near-white with an ethereal lavender undertone.
- **Text Secondary (`#9DA3CE`)**: Metadata, descriptive copy, unselected states, and subdued values.

## Typography

The design system utilizes **Manrope** across all roles to achieve a balance between geometric digital sharpness and contemporary fantasy character. 

- **Headlines**: Set heavy (700-800 weight) with tight tracking (`-0.02em`) to command attention like ancient grimoire titles formatted for modern high-resolution screens.
- **Body**: Maintained with open tracking and comfortable line heights to ensure long-form lore entries and specs remain fatigue-free against dark substrates.
- **Labels & Badges**: Set with deliberate letter spacing (`0.02em` - `0.06em`) and medium-to-bold weights, transforming short text strings into distinct runic signifiers.

## Layout & Spacing

A disciplined 12-column responsive fluid grid governs desktop and tablet spaces, shifting to an adaptive 4-column flow on mobile viewports.

- **Desktop (1200px+)**: 12 columns, 24px (`1.5rem`) gutters, 32px to 48px outer margins. Content spreads with dedicated breathing room between vault categories and detail cards.
- **Tablet (768px - 1199px)**: 8 columns, 20px (`1.25rem`) gutters, 24px outer margins. Multi-pane panels collapse down into stacked master-detail layouts.
- **Mobile (< 768px)**: 4 columns, 16px (`1rem`) gutters, 16px outer canvas margins. Modals become full-width bottom sheets, and multi-stat grids convert into two-column summary blocks.

## Elevation & Depth

Visual hierarchy does not rely on traditional muddy black shadows; it is established through illuminated tonal planes and arcane glow boundaries:

1. **Base Tier (Ground)**: `#0E0F1A` — Flat, absorbing light, anchor level.
2. **Surface Tier 1**: `#16182B` with a continuous 1px `#2E3357` border framing.
3. **Container Tier 2**: `#1C1F36` with 1px border `#2E3357`.
4. **Elevated Overlays**: `#1F223D` supported by ambient dark shadows: `0 12px 32px -4px rgba(6, 7, 13, 0.7)`.
5. **Aura / Active States**: Elements under active selection or hover introduce an arcane light cast using `0 0 16px -2px rgba(155, 123, 255, 0.35)`. Focused inputs or energized progress indicators introduce a mint aura using `0 0 12px -2px rgba(56, 225, 176, 0.4)`.

## Shapes

The geometric framework centers strictly on the 8px to 12px spectrum (Level 2 Roundedness):
- **Base Components (Inputs, Buttons, Badges)**: 8px border radius (`rounded-md`).
- **Cards, Vault Panels, Modals**: 12px border radius (`rounded-lg`).
- **Pills / Status Dots**: Full radius (`9999px`) reserved exclusively for avatars and micro status indicators.

This balance prevents the interface from feeling bubbly or childlike, keeping the silhouette technical, guarded, and refined.

## Components

### Buttons
- **Primary**: Solid background `#9B7BFF`, text color `#0E0F1A` (heavy weight 700 for maximum contrast), radius 8px. Hover state triggers a luminescent glow: `box-shadow: 0 0 18px rgba(155, 123, 255, 0.45)`.
- **Secondary**: Surface `#1C1F36`, border 1px solid `#2E3357`, text color `#F4F3FB`. Hover state changes border to `#9B7BFF` with text shifting slightly brighter.
- **Ghost / Tertiary**: Transparent background, text `#9DA3CE`, hover triggers text `#F4F3FB` and background `#16182B`.

### Badges & Chips
- **Arcane Tag**: Background `#2B2353`, text `#9B7BFF`, 1px solid border `rgba(155, 123, 255, 0.3)`. Text set in `label-sm`, all-caps.
- **Mint Status Tag**: Background `rgba(56, 225, 176, 0.1)`, text `#38E1B0`, 1px solid border `rgba(56, 225, 176, 0.35)`.

### Cards & Vault Modules
- Base structure in `#1C1F36` with 1px border `#2E3357` and 12px border-radius.
- Internal padding matches `space-lg` (24px).
- Header sections utilize high-contrast title typography in `#F4F3FB` paired with metadata chips on the opposing edge.
- Hover states on interactive cards shift the border to `rgba(155, 123, 255, 0.6)` and elevate background slightly to `#1F223D`.

### Form Inputs & Selectors
- **Input Field**: Height 44px, background `#16182B`, border 1px solid `#2E3357`, text `#F4F3FB`, placeholder `#9DA3CE`. Radius 8px.
- **Focus State**: Border transitions to `#9B7BFF` with an arcane focus ring (`box-shadow: 0 0 0 3px rgba(155, 123, 255, 0.2)`).

### Selection Controls
- **Checkboxes & Radios**: 20px box, background `#16182B`, border 1.5px solid `#2E3357`, radius 4px (checkbox) or circular (radio).
- **Checked State**: Solid `#9B7BFF` fill with midnight-indigo checkmark/dot icon (`#0E0F1A`).

### Progress Trackers & Rarity Bars
- **Track**: Height 6px to 8px, background `#16182B`, 1px border `#2E3357`, radius 9999px.
- **Indicator Fill**: Solid `#38E1B0` with an outer emission glow (`box-shadow: 0 0 8px rgba(56, 225, 176, 0.5)`).

### Vault Artifact Showcase (Custom Component)
- Dedicated frame for high-tier collectibles. Features a dual border layered with an inner inset ring (`box-shadow: inset 0 0 12px rgba(155, 123, 255, 0.15)`), a backdrop of `#16182B`, and an accent corner rune marker in `#38E1B0`.