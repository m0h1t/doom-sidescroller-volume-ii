# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server (localhost:5173)
npm run build        # tsc + vite build → dist/
npm run preview      # Serve dist/ locally
npm run type-check   # tsc --noEmit (no emit)
```

No test runner configured yet. Add Vitest if needed.

## Architecture

**DOOM Sidescroller Volume II** — a retro side-scroller shooter with procedurally generated levels. Built on Vite + TypeScript (no framework), PixiJS v8 (WebGPU/WebGL2), Rapier2D WASM physics, and shipped as a PWA.

### Entry

- `index.html` → `src/main.ts` → instantiates `Game` and calls `game.start()`
- `src/game/Game.ts` — top-level orchestrator: initialises renderer, physics, input, and runs the ticker

### Engine (`src/engine/`)

| Module | File | Responsibility |
|--------|------|----------------|
| Renderer | `renderer/Renderer.ts` | PixiJS `Application` wrapper; prefers WebGPU, falls back to WebGL2 automatically |
| Physics | `physics/Physics.ts` | Rapier2D `World` wrapper; gravity 2600 px/s² (matches Vol. I feel) |
| Input | `input/InputManager.ts` | Keyboard state (`Keys` record) + jump callback hook |
| Audio | `audio/AudioManager.ts` | Web Audio API singleton; synthesised SFX only; must be unlocked on first user gesture |

### Game (`src/game/`)

| Directory | Purpose |
|-----------|---------|
| `entities/` | Player, Enemy, Projectile, HealthPack class definitions |
| `levels/` | Procedural level assembler — room templates stitched with Simplex noise |
| `systems/` | Per-frame update systems: movement, collision, spawning, scoring |

### Key Design Decisions

**Renderer** — `preference: 'webgpu'` in PixiJS options; library handles the WebGL2 fallback transparently. Do not try to detect/branch manually.

**Physics** — Rapier2D replaces the hand-rolled AABB from Vol. I. All collidable objects get a `RigidBody` + `Collider`. Timestep is capped at 0.1 s to prevent spiral-of-death on tab restore.

**Audio** — `audioManager` is a module singleton. Call `audioManager.unlock()` inside the first `pointerdown` handler (already wired in `Game.ts`). Never construct `AudioContext` at module load time — it will be suspended on mobile.

**PWA** — `vite-plugin-pwa` with `display: fullscreen` and `orientation: landscape`. Icons go in `public/icons/`. Service worker auto-updates.

**Mobile** — `100dvh` in CSS (`index.html`) handles iOS Safari bottom bar. Touch controls (nipplejs) go in `src/ui/TouchControls.ts`. Quality tier detection should branch on `navigator.userAgent` or `navigator.hardwareConcurrency`.

**State** — no global store yet. All game state lives in plain objects inside `Game`. Add Zustand only if cross-module state sharing becomes unwieldy.

### Path Aliases

| Alias | Resolves to |
|-------|-------------|
| `@engine/*` | `src/engine/*` |
| `@game/*` | `src/game/*` |
| `@ui/*` | `src/ui/*` |

### Predecessor

Vol. I lives at `/Users/mohit.d/code/side-scroller-shooter` (Next.js + Canvas 2D). Porting reference: enemy types (Grunt/Fast/Heavy/Sniper), coyote time (0.08 s), jump buffer (0.12 s), gravity (2600 px/s²), chunk-based platform generation.
