# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-21

### Fixed

- `checkBounds` now treats any DOM descendant of the tracked element as "inside", even one rendered outside the element's own `getBoundingClientRect()` box (e.g. via `position: absolute`/`fixed` or a transform). Previously, moving the pointer onto such a child immediately set `mouseLeft` to `true`, diverging from the browser's own `mouseenter`/`mouseleave`, which have always treated it as still inside.

### Added

- A local `demo/` folder (Vite-based, dev-only) reproducing the parent/overflowing-child scenario from the CodeSandbox demo, with a live native `onMouseEnter`/`onMouseLeave` readout next to the hook's own `mouseLeft` for direct comparison. Run with `npm run demo`.

## [1.0.1] - 2026-08-21

### Changed

- Modernized the hook implementation: `useRef(fn).current` factories replaced with `useCallback`/`useState` lazy initializers, `{ passive: true }` on the `mousemove` listener, optional chaining, explicit return types, and added `eslint-plugin-react-hooks`.
- Full dependency and tooling renovation: React 19 support, ESLint 10 (flat config) with `typescript-eslint` 8, TypeScript 5.9 with a stricter `tsconfig.json`, husky v9, lint-staged, and Prettier all brought current.

### Fixed

- `elementRef.current` now correctly becomes `null` after unmount or a ref swap, instead of pointing at a stale, detached DOM node.
- A pending trailing throttle call is now cancelled when the ref is reassigned to a different element or on unmount, so it can no longer fire against the wrong node using stale coordinates.

## [1.0.0] and earlier

No changelog was kept for this and prior releases. See the [commit history](https://github.com/mjsarfatti/use-mouse-leave/commits/master) for details.
