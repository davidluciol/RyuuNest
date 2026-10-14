---
name: Moonlit Frost
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353943'
  surface-container-lowest: '#0a0e17'
  surface-container-low: '#181b25'
  surface-container: '#1c1f29'
  surface-container-high: '#262a34'
  surface-container-highest: '#31353f'
  on-surface: '#dfe2ef'
  on-surface-variant: '#c0c7d4'
  inverse-surface: '#dfe2ef'
  inverse-on-surface: '#2c303a'
  outline: '#8b919d'
  outline-variant: '#414752'
  surface-tint: '#a2c9ff'
  primary: '#a2c9ff'
  on-primary: '#00315c'
  primary-container: '#58a6ff'
  on-primary-container: '#003a6b'
  inverse-primary: '#0060aa'
  secondary: '#ddb8ff'
  on-secondary: '#490081'
  secondary-container: '#62259b'
  on-secondary-container: '#d1a1ff'
  tertiary: '#b6c7e6'
  on-tertiary: '#20314a'
  tertiary-container: '#92a4c2'
  on-tertiary-container: '#293a53'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d3e4ff'
  primary-fixed-dim: '#a2c9ff'
  on-primary-fixed: '#001c38'
  on-primary-fixed-variant: '#004882'
  secondary-fixed: '#f0dbff'
  secondary-fixed-dim: '#ddb8ff'
  on-secondary-fixed: '#2c0051'
  on-secondary-fixed-variant: '#62259b'
  tertiary-fixed: '#d4e3ff'
  tertiary-fixed-dim: '#b6c7e6'
  on-tertiary-fixed: '#081c33'
  on-tertiary-fixed-variant: '#364861'
  background: '#0f131c'
  on-background: '#dfe2ef'
  surface-variant: '#31353f'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Manrope
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Manrope
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.03em
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
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

The design system evokes an atmospheric, serene arctic nocturnal environment engineered for focused manga, comic, and visual reading. It channels the crystalline quietude of a sub-zero polar night: deep polar oceanic depths paired with crisp, luminescence-driven highlights reminiscent of moonlight cascading across glazed permafrost.

The design movement combines **Tonal Elevation** with **Atmospheric Glacial Minimalism**. Heavy flat black voids are replaced by deep navy and slate-ice strata, preventing optical fatigue during prolonged dark-room reading sessions. Crisp borders, glacial highlights, and soft lunar glows introduce tactical hierarchy without visual clutter or distraction from comic and manga artwork.

## Colors

The color palette centers around deep arctic undertones, high-contrast moonlit accents, and ethereal lavender markers. All pairings strictly conform to WCAG 2.1 AA accessibility ratios.

### Color Tiers & Roles
- **Base Canvas (`#0A0E17`)**: Deep arctic midnight navy. Serves as the primary immersion layer and full-bleed reading ground.
- **Base Surface (`#131A29`)**: Glazed slate ice. Used for structural panels, navigation rails, and bottom sheets.
- **Surface Elevated / Containers (`#1A2438`)**: Elevated midnight frost for cards, interactive sheets, and dialog surfaces.
- **Structural Outlines / Borders (`#25354F`)**: Glacial steel blue. Provides low-opacity structure for dividers, containers, and borders.
- **Primary Accent (`#58A6FF`)**: Luminous moonlit sky blue. Drives primary interaction states, call-to-actions, selections, and high-visibility 10-foot TV navigation focus rings.
- **Secondary Accent (`#C084FC`)**: Celestial lavender. Dedicated to reading states, chapter progress bars, bookmarks, and subtle completion indicators.
- **Badge Background (`#162840`)**: Submerged ice navy for contextual tag containers and metadata chips.
- **Text Primary (`#EDF2F7`)**: High-contrast frost pearl white with a contrast ratio exceeding 12:1 against the canvas.
- **Text Secondary (`#8CA0BA`)**: Subdued glacial slate for auxiliary metadata, timestamps, and placeholder states.
- **On-Accent Text**: Deep contrast ink (`#060C17`) when sitting on bright primary `#58A6FF` buttons to guarantee maximum legibility.

## Typography

The typography uses **Manrope** across all roles, offering geometric purity and open apertures that maintain high optical fidelity under dark ambient lighting conditions.

- **Display & Headline Levels**: Tight tracking (`-0.02em` to `-0.01em`) provides structured presence for titles and shelf headings.
- **Body Text**: Optical line-heights of 1.4x–1.5x provide ample breathing room for synopses and metadata summaries.
- **Labels & Overlines**: Elevated letter-spacing maintains legibility at small scale within dense comic directory filters and badge indicators.

## Layout & Spacing

The layout is built upon an 8pt rhythmic base grid optimized for responsive media browsers, reader overlays, and grid-based manga galleries.

### Breakpoints & Adaptive Grids
- **Mobile (<640px)**: 4 columns, `margin-mobile` (1rem), `gutter-mobile` (0.75rem). Reading canvas defaults to full-bleed edge-to-edge.
- **Tablet (640px - 1024px)**: 8 columns, `margin-tablet` (2rem), `gutter` (1rem). Manga covers adapt to 3-column or 4-column cards.
- **Desktop & TV (>1024px)**: 12 columns, `margin-desktop` (3rem), `gutter-desktop` (1.5rem). Max container constraint of `1440px` centered for reader dashboards and catalog views.

Spacing tokens (`space-xs` to `space-2xl`) dictate internal component layouts, badge offsets, and list item spacing.

## Elevation & Depth

Visual depth is achieved through **Tonal Stacking** reinforced with **Glacial Steel Blue outlines** rather than heavy muddy drop shadows.

1. **Ground Tier (Canvas)**: `#0A0E17`. Zero elevation.
2. **Resting Tier (Surfaces)**: `#131A29` with a subtle 1px border of `#25354F`.
3. **Elevated Tier (Cards, Popovers, Modals)**: `#1A2438` paired with a soft ambient moonlight reflection:
   `box-shadow: 0 8px 24px -4px rgba(6, 12, 23, 0.65), 0 0 0 1px #25354F`.
4. **Focused / Active Glow**: 
   Elements in high-focus states (such as D-pad/TV navigation and active manga reader panels) exhibit a crystalline lunar ring:
   `box-shadow: 0 0 0 2px #58A6FF, 0 0 16px 2px rgba(88, 166, 255, 0.35)`.

## Shapes

The design system standardizes on an 8px (`ROUND_EIGHT`) corner geometry (`0.5rem`).

- **Containers, Cards & Modals**: 8px (`0.5rem`). Balances modern softness with architectural precision.
- **Interactive Inputs & Buttons**: 8px (`0.5rem`). Consistent tactile shape.
- **Pills / Status Chips**: Contextually allowed 9999px for reading status pills, volume badges, and floating scrubber pills.
- **Active Focus Rings**: Outline radius matches the child shape + 2px offset.

## Components

### Buttons
- **Primary**: Background `#58A6FF`, text `#060C17` (bold `label-lg`), border none. On hover: opacity 92% with subtle blue ambient bloom.
- **Secondary / Ghost**: Background `#162840`, text `#EDF2F7`, border `1px solid #25354F`. On hover: border-color `#58A6FF`, background `#1A2438`.
- **TV / Keyboard Focus State**: High-visibility 2px solid `#58A6FF` outline with `2px` offset and soft `rgba(88, 166, 255, 0.4)` aura.

### Chips & Badges
- **Category & Genre Badges**: Background `#162840`, text `#8CA0BA`, border `1px solid #25354F`, radius 8px.
- **Progress Chips**: Background `rgba(192, 132, 252, 0.12)`, text `#C084FC`, border `1px solid rgba(192, 132, 252, 0.3)`.

### Cards (Manga & Series Cover)
- Background `#131A29`, border `1px solid #25354F`, radius 8px, overflow hidden.
- Cover art uses a 2:3 aspect ratio with an inner gradient overlay transitioning to `#131A29` at the base.
- Title rendered in `#EDF2F7` (`body-md`, bold). Chapter/status metadata in `#8CA0BA` (`body-sm`).

### Reading Progress & Scrubber
- Track background: `#162840`.
- Active fill: Celestial lavender `#C084FC`.
- Current page / bookmark icon: `#C084FC` with subtle glow.

### Form Inputs & Search
- Container background: `#131A29`, border `1px solid #25354F`, text `#EDF2F7`, placeholder `#8CA0BA`.
- Focus state: Border color `#58A6FF`, box-shadow `0 0 0 1px #58A6FF`.

### Checkboxes & Switches
- Checked state: Fill `#58A6FF` with `#060C17` tick mark.
- Unchecked state: Background `#131A29`, border `1px solid #25354F`.