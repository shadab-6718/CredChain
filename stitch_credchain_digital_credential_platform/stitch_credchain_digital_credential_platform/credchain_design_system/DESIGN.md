---
name: CredChain Design System
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#3f4949'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#6f7979'
  outline-variant: '#bec8c9'
  surface-tint: '#14696d'
  primary: '#00464a'
  on-primary: '#ffffff'
  primary-container: '#006064'
  on-primary-container: '#8fd8dc'
  inverse-primary: '#8ad3d7'
  secondary: '#0061a6'
  on-secondary: '#ffffff'
  secondary-container: '#6eb2fe'
  on-secondary-container: '#004376'
  tertiary: '#62330f'
  on-tertiary: '#ffffff'
  tertiary-container: '#7e4924'
  on-tertiary-container: '#ffbe95'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a6eff3'
  primary-fixed-dim: '#8ad3d7'
  on-primary-fixed: '#002021'
  on-primary-fixed-variant: '#004f53'
  secondary-fixed: '#d2e4ff'
  secondary-fixed-dim: '#a0caff'
  on-secondary-fixed: '#001c37'
  on-secondary-fixed-variant: '#00497e'
  tertiary-fixed: '#ffdbc7'
  tertiary-fixed-dim: '#ffb688'
  on-tertiary-fixed: '#311300'
  on-tertiary-fixed-variant: '#6b3a16'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
  status-valid: '#00703C'
  status-revoked: '#D4351C'
  status-pending: '#F47738'
  border-subtle: '#D1D5DB'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
  code-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system is engineered for a blockchain-based credentialing platform where trust, clarity, and permanence are paramount. The aesthetic is strictly functional, drawing inspiration from the utilitarian clarity of gov.uk and the information density of GitHub. 

The brand personality is authoritative yet transparent. It avoids decorative trends in favor of high legibility and systematic precision. By utilizing a "Flat Functionalist" approach, the interface communicates reliability through structure rather than embellishment. There are no gradients, shadows, or rounded corners that might suggest softness; instead, the design uses a rigid grid and a limited color palette to evoke the feeling of a secure, official ledger.

## Colors
The color strategy prioritizes accessibility and clear status signaling. 

- **Primary Teal:** Used for core branding and primary actions. It provides a professional, institutional feel.
- **Surface & Background:** The background is a very light neutral to reduce eye strain, while white (#FFFFFF) is reserved for card surfaces and input areas to create distinct content zones.
- **Typography:** Near-black (#1A1A1A) is used for all primary text to ensure maximum contrast ratios.
- **Semantic Status:** These are reserved strictly for badges and status indicators. Do not use status colors for large surfaces or decorative elements.

## Typography
This design system utilizes a single sans-serif family, **Inter**, to maintain a systematic and technical appearance. 

- **Hierarchy:** Use weight (Medium to Bold) rather than size to denote hierarchy where possible to keep the layout compact.
- **Scale:** The type scale is intentionally restrained. Large headlines are used sparingly for page titles, while most data-heavy views utilize `body-sm` and `label-md`.
- **Monospaced Utility:** While Inter is the primary family, use tabular numbers for data tables and blockchain hashes to ensure vertical alignment in lists.

## Layout & Spacing
The system is built on a strict 8px square grid. All components, padding, and margins must be multiples of 8 (8, 16, 24, 32, etc.).

- **Grid System:** A 12-column fixed grid is used for desktop layouts, centered on the screen. For data-heavy dashboards, a fluid layout may be used within a max-width container.
- **Density:** Information density should be high. Use generous whitespace between logical sections, but keep internal component spacing tight (e.g., 8px between a label and an input field).
- **Responsive Behavior:** On mobile, margins reduce to 16px and columns collapse to a single stack. Use vertical spacing of 24px-32px between sections on mobile to maintain clarity.

## Elevation & Depth
In alignment with the "Flat Functional" aesthetic, elevation is communicated through **tonal layers** and **borders** rather than shadows.

- **Flat Surfaces:** Use a 1px solid border (`#D1D5DB`) to define cards and containers.
- **Stacking:** Higher-priority elements (like modals or dropdowns) should use a slightly thicker border or a high-contrast background rather than a shadow. 
- **Interaction:** Hover states should be indicated by subtle background color shifts (e.g., primary color becoming 10% darker) rather than an increase in elevation or "lift."

## Shapes
The shape language is strictly **Sharp (0px)**. 

Every UI element—including buttons, input fields, badges, and cards—must use square corners. This reinforces the institutional and "blockchain-rigid" nature of the product. Circular shapes are only permitted for status indicators (dots) or user avatars when necessary for differentiation.

## Components
- **Buttons:** Strictly flat. Primary buttons use the Deep Teal background with White text. Secondary buttons use a 1px border with Teal text. No rounded corners.
- **Status Badges:** Small, rectangular tags with a background color and high-contrast text. Use `label-md` for badge text.
- **Data Tables:** High-density tables with subtle horizontal dividers only. Header cells should have a light gray background (`#F3F2F1`) and bold text.
- **Input Fields:** 1px solid border with sharp corners. Focus states use a 2px high-contrast teal outline.
- **Vertical Timelines:** Used for credential history. Use a solid 2px vertical line with square markers for each event, mimicking a ledger.
- **Cards:** White background, 1px border, no shadow. Content should be padded by 24px (3 units).