---
id: prompts
title: Developer Instructions & Prompts
sidebar_label: Developer Instructions
---

# Developer Implementation Guides & AI Prompts

Use the prompts and instructions below when asking code generation models or developers to implement the Frontend components and Backend API services for the Kridaz Tournament Stage Builder.

---

## 1. What to Build & How to Build

### A. Frontend: Expandable Checklist UI Component

- **Technology**: React, Tailwind CSS, Lucide icons.
- **Component Path**: `client/user/src/features/tournament/components/StageBuilder.jsx`
- **Features**:
  - Interactive sections for "Standard Stages", "Position Playoff Matches", and "Special Rules".
  - Clean checklists inside collapsible/expandable `<details>` or custom state-driven toggle cards.
  - Form validation: team counts must align with selected knockout stages (e.g., selecting Quarter Finals requires at least 8 remaining teams).

### B. Backend: Relational Postgres API Endpoints

- **Technology**: Node.js, Express, Prisma ORM, PostgreSQL.
- **Controller Path**: `server/modules/tournament/tournament.controller.js`
- **Core APIs**:
  1. `POST /api/tournament/create` - Instantiates the `Tournament` record along with default `Stage` records depending on the selected tournament type.
  2. `PUT /api/tournament/:id/stages` - Saves the customized stages, playoff positions, and rules by writing to `Stage`, `PlayoffConfig`, and `TournamentRule` tables within a single database transaction.
  3. `POST /api/tournament/:id/fixtures` - Automatically generates the schedules for matches across all stages and playoffs.

---

## 2. System Prompts for AI Coding Assistants

Copy-paste these system prompts directly into your AI workspace to generate code files matching this architectural blueprint.

### Prompt: Generate the Prisma Schema Relationships

```text
Write a Prisma schema for a PostgreSQL database modeling a sports tournament system.
Do NOT use JSON or JSONB types. The schema must be fully normalized and relational.

Define the following models:
1. Tournament: fields (id, name, sport, mode [MATCH/TOURNAMENT], type, teamCount, createdAt, updatedAt)
2. Stage: representing a progression step. Fields (id, tournamentId, name, type [KNOCKOUT/ROUND_ROBIN/LEAGUE], sequence [Int], isFinal [Boolean], matchCount). Include index on [tournamentId, sequence].
3. PlayoffConfig: representing position playoff matches. Fields (id, tournamentId, position [Int], name, enabled). Include unique constraint on [tournamentId, position].
4. TournamentRule: representing generic key-value rules. Fields (id, tournamentId, ruleKey, ruleValue). Include unique constraint on [tournamentId, ruleKey].

Set up cascade deletions so that deleting a Tournament deletes all its related Stages, PlayoffConfigs, and TournamentRules.
```

### Prompt: Generate the React Stage Builder Component

```text
Create a React component named StageBuilder for Kridaz using Tailwind CSS and Lucide React.
The UI must strictly follow our brand guidelines:
- Background color: `#000` (pitch black).
- Border color: `#1A1A1A` or `#2A2A2A`.
- Accents & primary active states: `#84CC16` (Lime Green).
- Typography: Inter (sans) and Outfit (display).

Instead of a standard dropdown, design an Expandable Checklist UI using state-driven cards. Let the organizer toggle standard stages (Quarter Final, Semi Final, Final), position matches (3rd place playoff, 5th place playoff, nth place playoff), and rules (Super Over).
Whenever a checklist item is updated, dispatch the configuration array to the parent component. Make it premium with subtle scale hovers (e.g., hover:scale-[1.02]), neon green button glows (shadow-[0_0_20px_rgba(132,204,22,0.4)]), and smooth transitions.
```

---

## 3. UI/UX Consistency Rule

> [!WARNING]
> **Design Uniformity Mandatory**: Any frontend implementation of the stage builder must match the existing visual theme found in `client/user/src/pages/Home.jsx`.
> Do not introduce generic blues, purples, or default gray buttons. Use `#84CC16` (Lime Green) as the primary brand color, dark panels (`#0E0E0E` / `#121212`), and clean typography rules (Open Sans/Outfit for uppercase display headers, Inter for list elements).
