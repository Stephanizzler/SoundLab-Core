# From browser to native apps and plug-ins

The SoundLab Pro apps are built and finished in the browser first. This page is the plan for turning each finished app into native apps and plug-ins, so the work is done once for the whole family (Ultimate Synth, Mastering, Vocalizer and the apps after them).

## Targets

| Platform | What ships |
|---|---|
| iPhone and iPad | A standalone app, plus an **AUv3** extension so it runs inside GarageBand, Logic Pro for iPad, AUM, Cubasis and other hosts |
| Android phones and tablets | A standalone app. Android has no widely adopted plug-in format, so there is no plug-in build |
| macOS | **AU** (Logic, GarageBand, MainStage), **VST3** and a standalone app |
| Windows | **VST3** and a standalone app |
| Pro Tools (macOS and Windows) | **AAX** |

Two formats are deliberately not on the list:
- **RTAS** was retired by Avid and replaced by **AAX**. Current Pro Tools versions only load AAX.
- **VST2** is no longer licensed to new developers. "VSTi" means a **VST3** instrument today.

## Architecture: one audio core everywhere

```
            ┌──────────────── one C++ audio core ────────────────┐
            │ DSP (oscillators, filters, voices, effects)         │
            │ sequencer, patch bay, parameter model               │
            └──────────────┬───────────────────────┬──────────────┘
                 compiled to WebAssembly     compiled natively
                           │                       │
              browser app (AudioWorklet)   JUCE or iPlug2 shell
                                            ├─ VST3 · AU · AAX (desktop)
                                            ├─ AUv3 + app (iOS / iPadOS)
                                            └─ standalone (macOS, Windows, Android)
            the same HTML/CSS interface runs in the browser and in a web view inside each plug-in
```

1. **Port the audio engine to C++ once.** Plug-ins run inside a host's real-time audio thread, which a JavaScript engine can't do. Keep the engine free of platform APIs (no browser, no UI, no file I/O, no allocation in the audio path), as the browser engines already are.
2. **Compile the same C++ to WebAssembly for the browser app.** The browser keeps working on the same code the plug-ins use, so a fix lands everywhere and the browser remains the quickest place to test. Port one module at a time behind the existing TypeScript interfaces, and prove each port with a parity test: render the same notes and settings through both engines and require the output to match.
3. **Wrap it with a framework that builds every format.**
   - **JUCE** (C++): one project builds VST3, AU, AUv3, AAX and standalone apps for macOS, Windows, iOS and Android. It is the industry standard. Its licence is free below a revenue threshold and paid above it; check the current terms before committing.
   - **iPlug2** (C++): permissively licensed, with the same formats and a smaller ecosystem.
4. **Reuse the web interface.** JUCE 8 can show a web page as a plug-in's interface and pass parameter changes both ways. The faceplates, sequencer and patch bay can then stay HTML/CSS, and the TypeScript in `@soundlab/project` can keep reading and writing `.soundlab` files in that layer. A fully native interface remains an option later for apps that need it.

## What changes in a plug-in

- **Host tempo and transport.** Sequencers, arpeggiators and tempo-synced effects follow the host's play position and tempo instead of their own clock.
- **Fixed, stable parameters for automation.** Hosts expect the same parameter list, with the same IDs, every time a plug-in loads. Where an app's controls change (a synth slot changing machine), expose a fixed bank of parameters per slot mapped to the loaded machine, plus macros. **Parameter IDs must never change after release**, or saved sessions break.
- **State in the host session.** The plug-in saves the same JSON the app already stores in `source.settings`, so a `.soundlab` project, a browser session and a DAW session describe a sound the same way.
- **Multiple outputs.** A multitimbral instrument (Ultimate Synth) offers one stereo output per slot, so each part arrives on its own DAW track.
- **Latency.** Processors with look-ahead (limiters, linear-phase EQ) report it to the host, which compensates.
- **No allocation, locks or file access on the audio thread.**

## What changes on phones and tablets

- **Latency varies by device**, most of all on Android. Test on real phones and tablets, low-end ones included. Use AAudio on Android (through the framework or Oboe).
- **Background audio and interruptions.** Phone calls, alarms and other apps take the audio session; the app has to stop and resume cleanly.
- **Touch first.** Controls the browser drags with a mouse need finger-sized targets and must work on a phone held upright.
- **Files.** `.soundlab` projects move through the iOS Files app and the Android share sheet, and through SoundLab CoLab.

## Accounts, signing and certification

| Need | Notes |
|---|---|
| Apple Developer Program | Yearly fee. Required for the App Store, for AUv3, and for **notarising** macOS plug-ins and apps (unsigned plug-ins are blocked by macOS). |
| Google Play developer account | One-time fee. Android App Bundles, store review. |
| Avid developer programme | Required to build **AAX**. AAX plug-ins must also be signed with PACE / iLok tools; allow lead time for the agreements. |
| Steinberg VST3 SDK | Check the current licence terms when you start. |
| Windows code signing | A code-signing certificate avoids SmartScreen warnings on installers. |
| Plug-in validation | Run `pluginval` and test in Logic, Ableton Live, Pro Tools, Cubase, FL Studio, Reaper and GarageBand/AUM on iPad. |
| Trademarks | Clear every product and module name (and faceplate styling) before store listings: stores act on trademark complaints. |

## Order of work

1. Finish each app's features in the browser.
2. Port its audio engine to C++, module by module, with a WebAssembly build and parity tests against the TypeScript. The browser app switches to the C++ engine as modules are proven.
3. Desktop plug-ins: VST3 and AU, then AAX.
4. iOS and iPadOS: the app and its AUv3 extension.
5. Android: the app.

Steps 3-5 share one framework project per app, and the shell (web-view interface, parameter mapping, state, transport) is written once and reused across the family.

## Where each app stands

| App | Audio engine | C++ port |
|---|---|---|
| Ultimate Synth | TypeScript, browser-free, tested | Started: the MiniMood machine runs in C++ / WebAssembly with output matching the TypeScript ([SoundLab-Ultimate-Synth](https://github.com/Stephanizzler/SoundLab-Ultimate-Synth) `native/`) |
| Mastering | Web Audio nodes | Needs its processors written as DSP code (they use the browser's built-in filters and compressors, which don't exist in a plug-in) |
| Vocalizer | JavaScript DSP | Not started |
