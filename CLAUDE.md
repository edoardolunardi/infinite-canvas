# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (Vite, serves on all interfaces via `--host`)
- **Build:** `npm run build` (runs `tsc -b` then `vite build`)
- **Type check:** `npm run check:types` (uses `tsconfig.app.json`)
- **Lint:** `npm run check:biome` (Biome, errors only)
- **Both checks:** `npm run check`
- **Format:** `npm run format` (Biome check --write --unsafe)
- **Preview prod build:** `npm run preview`

No test framework is configured.

## Path Aliases

`~/` maps to the project root (configured in both `vite.config.ts` and `tsconfig.app.json`). All imports use this alias, e.g. `import { clamp } from "~/src/utils"`.

## Code Style

- **React imports:** Must use `import * as React from "react"` — named/default imports from "react" are a Biome lint error.
- **Formatter:** Biome with 130-char line width, 2-space indent, double quotes, semicolons, ES5 trailing commas.
- **React Compiler** is enabled via `babel-plugin-react-compiler` in the Vite config.
- **Strict TypeScript** with `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly`.
- **npm config:** `save-exact=true` and `engine-strict=true` (pinned deps). Node 22.14.0 (`.nvmrc`).

## Key Patterns

- **Ref-heavy animation state** — All mutable per-frame state lives in `React.useRef` (velocities, positions, drag state, opacity), not `useState`. React state is only used for things that trigger re-renders (chunk list, texture readiness).
- **Seeded determinism** — Chunk plane positions are derived from `hashString(chunkCoords)` + `seededRandom`, so the same chunk coordinates always produce the same layout.
- **LRU plane cache** — Generated chunk planes are cached (256 entries max) in a `Map` using delete-and-reinsert for LRU ordering.
- **Texture callback coalescence** — Multiple planes requesting the same image share one load. Callbacks are collected in a `Set` and fired when the texture loads.
- **Throttled chunk updates** — Chunk recalculation is throttled based on zoom speed (100ms normal, 400–500ms while zooming fast) to avoid thrashing during rapid camera movement.
- **Lazy loading** — `InfiniteCanvas` wraps the heavy R3F scene in `React.lazy` + `Suspense` so the main bundle stays small.

## Architecture

This is an infinite 3D canvas for exploring artwork images, built with React 19 + Three.js + React Three Fiber + Vite.

### Core rendering pipeline

**Chunk-based infinite grid** (`src/infinite-canvas/`): The 3D space is divided into chunks of `CHUNK_SIZE` (110 units). As the camera moves, `SceneController` computes which chunk the camera is in and generates surrounding chunks within `RENDER_DISTANCE + CHUNK_FADE_MARGIN`. Each `Chunk` generates 5 randomly-placed planes using seeded randomness (`hashString` + `seededRandom` in `src/utils.ts`) for deterministic layout. Plane generation is cached with an LRU cache (256 entries) in `utils.ts`.

**Texture management** (`texture-manager.ts`): Global singleton `TextureLoader` with a `Map`-based cache. Textures load on-demand with callback coalescence — multiple planes requesting the same texture share one load operation.

**Fade system** (`MediaPlane` in `scene.tsx`): Each plane computes opacity per-frame based on two factors: grid distance fade (chunk distance from camera) and depth fade (Z-distance from camera). Planes below `INVIS_THRESHOLD` (0.01) are hidden entirely. Every other frame is skipped for invisible planes as an optimization.

### Input handling

All in `SceneController`: mouse drag pans X/Y, scroll wheel zooms Z-axis, touch drag/pinch supported, WASD + QE keyboard navigation. Physics uses velocity with lerp smoothing and decay. Mouse position creates a subtle parallax drift effect (disabled on touch). Chunk updates are throttled based on zoom speed.

### Data flow

`App` loads artwork metadata from `src/artworks/manifest.json` (static JSON array of `{url, width, height}`). Images are in `public/artworks/`. The `PageLoader` shows a progress bar driven by R3F's `useProgress` hook with lerped visual animation.

### Component hierarchy

`App` → `Frame` (header/nav overlay) + `PageLoader` (loading screen) + `InfiniteCanvas` (lazy-loaded via `React.lazy`) → `InfiniteCanvasScene` (R3F `Canvas` + fog + keyboard controls) → `SceneController` (camera/input/chunk management) → `Chunk[]` → `MediaPlane[]`
