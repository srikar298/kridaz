---
sidebar_position: 4
title: Design System Rules
---

# design.md — Kridaz AI Design System (Agent-First)

**Purpose:**
This document defines strict rules and decision logic for AI agents and human developers to design or redesign any Kridaz page consistently.

## 1. Core Objective (DO NOT VIOLATE)

Every design must:

- Maintain high focus hierarchy
- Use dark + neon minimal aesthetic
- Prioritize usability over visual noise
- Ensure one primary action per section

## 2. Design Identity Rules

**Style Definition:**

- Dark UI
- Cyan and Lime gradient accent
- Sports + SaaS hybrid

**Emotional Tone:**

- Fast
- Premium
- Competitive
- Clean

## 3. Color Tokens (STRICT)

- **PRI** = `#55DEE8` (Cyan Accent ONLY)
- **GRAD** = `linear-gradient(90deg, #55DEE8 0%, #BFF367 100%)` (Primary Brand Gradient)
- **BG** = `#000000` (Base background)
- **S1** = `#111111` (Section background)
- **S2** = `#1A1A1A` (Cards)
- **BDR** = `#2A2A2A` (Borders)
- **TXT_PRIMARY** = `#FFFFFF`
- **TXT_SECONDARY** = `#9CA3AF`

**Rules:**

- NEVER introduce new colors
- **PRI** is ONLY for:
  - Buttons
  - Active states
  - Highlights

## 4. Typography Rules

**Fonts:**

- **Display** → Headings (Bebas Neue)
- **Body** → Content (Inter)
- **Mono** → Labels / metadata (Space Mono)

**Behavior:**

- Headings = uppercase, bold
- Body = clean, readable
- Labels = small, muted

**Restrictions:**

- NO decorative fonts
- NO excessive uppercase in body text

## 5. Layout Generation Logic

When creating a page, it MUST follow this structure:

1. [Hero / Header]
2. [Primary Action Section]
3. [Content Rows (Cards)]
4. [Secondary Features]
5. [Social / Discovery]
6. [Utility Section (pricing / system / info)]
7. [Footer CTA]

## 6. Section Rules

Each section MUST include:

- Title (clear)
- Purpose (obvious)
- ONE primary CTA

**Forbidden:**

- Multiple competing CTAs
- Sections without hierarchy

## 7. Card System Logic

**Card Types:**

- **TYPE_A: Feature / Category Card**
  - Large
  - Image background
  - Gradient overlay
  - Bold label
- **TYPE_B: Content Card**
  - Medium
  - Image + metadata
  - CTA button
- **TYPE_C: Compact Card**
  - Minimal
  - Data-focused

**Mandatory Card Rules:**

- Always use dark gradient over images
- Text must always be readable
- Use consistent border radius
- No visual clutter inside cards

## 8. Carousel Logic (CRITICAL)

If a horizontal scroll is used:
**Behavior:**

- Infinite loop
- Smooth motion

**Focus Rule:**

- Center card:
  - Scale up
  - Increase brightness
- Side cards:
  - Scale down
  - Reduce opacity

**Purpose:**

- Guide user attention automatically

## 9. Interaction Rules

**Allowed:**

- Hover scale
- Soft shadow
- Smooth transitions

**Forbidden:**

- Jitter animations
- Sudden jumps
- Over-glow effects

## 10. Button System

**Types:**

- **PRIMARY:**
  - Background: PRI
  - Text: Black
  - Use: Main action
- **SECONDARY:**
  - Background: S2
  - Border: BDR
- **GHOST:**
  - Transparent
  - Minimal emphasis

**Rule:**

- Only ONE primary button per section

## 11. Spacing System

Use consistent spacing scale:

- 8 / 12 / 16 / 24 / 32 / 48 / 64

**Rules:**

- Maintain vertical rhythm
- Avoid tight stacking
- Ensure breathing space

## 12. Background Rules

**Allowed:**

- Dark gradients
- Subtle lighting

**Forbidden:**

- Noisy textures
- Bright backgrounds

## 13. Content Density Rules

Ensure:

- No overcrowding
- Clear grouping
- Visual hierarchy

## 14. Decision Logic (VERY IMPORTANT)

When designing a component, follow this logic:

- **Step 1:** Is this a primary action area? → Use strong contrast + PRI
- **Step 2:** Is this supporting content? → Use S1/S2 + low emphasis
- **Step 3:** Is this interactive? → Add hover + feedback
- **Step 4:** Is this visual-heavy? → Add gradient overlay

## 15. Redesign Rules (When Improving Existing UI)

- Preserve structure if usable
- Improve clarity, not complexity
- Remove unnecessary elements
- Strengthen focus hierarchy

## 16. Hard Constraints (NON-NEGOTIABLE)

NEVER:

- Introduce new colors
- Break spacing system
- Add multiple primary CTAs
- Change card behavior randomly
- Use inconsistent animation styles

## 17. Output Requirements

Every generated design must:

- Follow section structure
- Use correct card types
- Maintain consistent spacing
- Apply focus hierarchy
- Keep UI clean and readable

## 18. Failure Conditions (REJECT DESIGN IF)

- UI feels cluttered
- No clear focus
- Too many colors
- Inconsistent spacing
- Weak hierarchy

## Final Reality Check

If your design:

- Makes things “look cool” but harder to use → **FAIL**
- Adds unnecessary elements → **FAIL**
- Breaks consistency → **FAIL**

👉 The goal is NOT creativity.
👉 The goal is controlled, scalable design.
