# SoundLab Core

The shared foundation of the SoundLab Pro apps. Every Pro app uses this so that projects, measurements and the look are the same everywhere, and work can move between apps through SoundLab CoLab.

| Folder | What it is |
|---|---|
| [`SPEC.md`](SPEC.md) | The SoundLab project format: the rules every app follows. |
| [`START_HERE.md`](START_HERE.md) | Read first when starting a new SoundLab app. |
| [`docs/APPS.md`](docs/APPS.md) | Every SoundLab app, its app id, status and how it connects to the others. |
| `packages/project` | `@soundlab/project`: the format in TypeScript (projects, songs, versions, files, comments, approvals), EBU R128 loudness and delivery checks, and `.soundlab` files. No dependencies. |
| `packages/design` | `@soundlab/design`: colours, spacing and type for the Pro look. |

## Using it in an app

The packages are plain TypeScript source; any bundler that handles TypeScript (Vite, Metro/Expo, esbuild) can use them directly.

```sh
# pnpm, pinned to a commit so an app only changes when you choose to update
pnpm add "github:Stephanizzler/SoundLab-Core#<commit>&path:/packages/project"
pnpm add "github:Stephanizzler/SoundLab-Core#<commit>&path:/packages/design"
```

```ts
import { createProject, measureLoudness, writeBundle } from "@soundlab/project";
import { color } from "@soundlab/design";
```

A single-file web app can copy `packages/project/src` into its own source instead. Note which commit it came from, and copy again to update.

## Tests

```sh
npm test   # Node 22.6 or newer runs the TypeScript directly
```

The loudness tests use the EBU Tech 3341 and 3342 reference signals, so any change to the meter must still pass them.

## Changing the shared code

Changes here affect every app. Keep version 1 of the format additive (new optional fields only), add tests with every change, and record format changes in `SPEC.md`. A change that breaks old projects needs format version 2 and a migration.
