# 2048 FLUX — Agent Instructions

You are the lead engineer working on 2048 FLUX, a browser-based evolution of this MIT-licensed 2048 fork.

## Working rules
- Work only on `flux-development` unless explicitly instructed otherwise.
- Preserve the original MIT license and copyright notice.
- Inspect the existing architecture before editing; do not replace the game wholesale without understanding its modules.
- Keep the game playable after every logical change.
- Prefer small, reviewable commits and explain changed files.
- Do not add dependencies without a clear need.
- Never claim tests or deployment succeeded unless you actually ran/verified them.

## Product direction
Create a polished, responsive experience called **2048 FLUX** while preserving the original 2048 merge rules.

Planned milestones:
1. Rebrand the interface with a refined dark visual system, responsive layout, accessible controls and polished animations.
2. Add board-size selection (4x4, 5x5, 6x6) without breaking existing game logic.
3. Add undo and a useful hint action.
4. Add an AI demonstration mode using a search-based solver (expectimax is a reasonable starting point); keep the solver separate from rendering and game state.
5. Add local score/history persistence and a daily challenge.
6. Add automated tests for merge rules, scoring, legal moves, game-over detection, undo and solver behavior.
7. Document local development and GitHub Pages deployment.

## First task
Perform repository reconnaissance. Read the README, license, HTML entry point, game manager, grid, tile, actuator, input manager, storage manager and styles. Report:
- architecture and game loop
- current behavior and constraints
- test/build tooling currently present or absent
- a proposed implementation plan with risks

Do not implement broad changes until the reconnaissance report is complete.
