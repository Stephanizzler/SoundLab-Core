# Starting a new SoundLab app

Paste or link this file at the start of a new app's chat. It keeps every SoundLab Pro app consistent.

## 1. Name and identity

- The app is called **SoundLab + what it does** (SoundLab Stems, SoundLab Restore).
- Pick its app id from [`docs/APPS.md`](docs/APPS.md), e.g. `soundlab.stems`. Add the app there if it's new.
- One GitHub repository per app, named `SoundLab-<Name>`, kept **private** if it will be sold.

## 2. Use the shared foundation

- Read [`SPEC.md`](SPEC.md) before designing how the app saves its work.
- Use `@soundlab/project` (see the README) rather than writing your own project, loudness or file code.
- Measure audio with `measureLoudness`, so every app shows the same LUFS and true-peak numbers.
- Use `@soundlab/design` for colours, spacing and type, so the apps look like one family.

## 3. Rules every app follows

1. **Open and save `.soundlab` projects.** An app that processes audio opens a version from a project and saves its result back as a **new version** with `source.app` set to its app id and `source.basedOn` set to the version it started from. It never overwrites a version.
2. **Keep the settings that made the result** in `source.settings` (`{ app, schema, data }`) so it can be redone or adjusted later.
3. **Keep original quality.** Read files at their own sample rate and bit depth. Show any conversion to the user.
4. **Validate what you load** with `problems(project)`. Never trust a file from elsewhere.
5. **Be honest about results.** Say what a process does and does not do. AI results are suggestions the user can compare (A/B, level-matched) and undo.

## 4. Decide early (and record the decision in the app's README)

- **Where the processing runs.** Choose between running in the browser or on the device (private, works offline, limited by the device) and running on a server (heavier models, ongoing cost, needs upload consent). AI-heavy apps (stems, transcription, restoration) should settle this first.
- **Model licences.** Check that any AI model or dataset can be used in a paid product before building on it.
- **Platform.** Web first, like the other Pro apps, unless the app needs native audio, as plug-ins (AUv3/VST) do.

## 5. Quality bar

- Automated tests for the audio maths, run with `npm test`.
- Check the app at phone width and on a desktop.
- A short "What works / Not yet" list in the README, kept up to date.
- Have the SoundLab name and each product name checked for trademarks before launch.
