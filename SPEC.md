# SoundLab project format, version 1

One shared description of a piece of work, so SoundLab Pro apps (CoLab, Vocalizer, Mastering, and future apps such as synths) can hand work to each other. The TypeScript in `src/` is the reference implementation; this page states the rules.

## The pieces

| Thing | What it is |
|---|---|
| **Project** | A body of work (an EP, a single, a session). Has members, songs, files and per-app settings. |
| **Member** | A person on the project with one role: `owner` (exactly one), `engineer`, `producer`, `artist` or `client`. |
| **Song** | One title within the project. Holds its versions, comments and attached DAW sessions. |
| **Version** | One listenable state of a song: `Mix 2`, `Master 1`. Points at one audio file, optional stems, says which app made it and what it was based on. |
| **Asset** | A file: `audio`, `stem`, `session` (a DAW project ZIP), `midi` or `document`. Audio assets carry sample rate, channels, length and loudness. |
| **Comment** | A note at a time (and optionally a range) on one version, with replies (text and/or an audio file) and a resolved state that can point at the version that fixed it. |

## Rules every app follows

1. **Never edit someone else's version.** Processing makes a *new* version with `source.basedOn` set to the version you started from. Versions are a history, not a working copy.
2. **Say who made it.** `source.app` is your app id (`soundlab.vocalizer`, `soundlab.mastering`, `soundlab.colab`, `soundlab.<name>`). Put the settings that produced the version in `source.settings` as `{ app, schema, data }`, so the result can be reproduced or tweaked later. Only your app needs to understand `data`.
3. **Project-wide settings** go in `project.apps["soundlab.<name>"]`, same shape. Leave other apps' entries untouched.
4. **Measure audio the same way.** Fill `asset.audio.loudness` with `measureLoudness` (ITU-R BS.1770-4 / EBU R128: integrated LUFS, true peak in dBTP, sample peak, loudness range). `null` integrated loudness means silence.
5. **Validate before use.** Run `problems(project)` on anything read from storage, a file or another person. Load nothing that has problems.
6. **Ids are opaque** strings of letters, digits, `-` and `_` (UUIDs in practice). Times are ISO 8601 strings.

## Labels and status

- Stages: `demo`, `vocal`, `mix`, `master`, `stems`. Labels count per stage (`Mix 1`, `Mix 2`, `Master 1`).
- Status: `in-review` → `changes-requested` or `approved`. Requesting changes clears approvals.
- Approval: the owner can sign off alone; otherwise a version is approved once every artist and client has approved it.

## The `.soundlab` file

A ZIP containing `project.json` and each asset at `assets/<asset id>`. Use `writeBundle` / `readBundle`. Reading checks the format, every file's presence, size and checksum, and refuses unsafe names. Files are stored uncompressed when written; deflate-compressed files from other tools are read too. MIME type `application/vnd.soundlab.project+zip`.

## Changing the format

Additive, optional fields can be added within version 1. Anything that changes meaning (renaming, removing, new required fields) needs version 2 and a migration in this package. Apps refuse versions newer than they understand and say so.
