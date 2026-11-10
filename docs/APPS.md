# SoundLab apps

Two families with completely different users. Only the **Pro** family uses this repository's project format and CoLab.

## SoundLab Pro (production and post-production)

| App | App id | Status | What it does | Hands work to |
|---|---|---|---|---|
| SoundLab CoLab | `soundlab.colab` | Building (0.1) | The hub: projects, versions, timed feedback, A/B, approvals | Every Pro app |
| SoundLab Vocalizer | `soundlab.vocalizer` | Building | Pitch correction, vocal chains | CoLab, Mastering |
| SoundLab Mastering | `soundlab.mastering` | Building | Mastering rack and assistant | CoLab |
| SoundLab Stems | `soundlab.stems` | Planned (1st) | Split a mix into vocals, drums, bass and other stems | Vocalizer, Mix Assist, Transcribe, CoLab |
| SoundLab Restore | `soundlab.restore` | Planned (2nd) | Noise, hum, click and clipping repair, de-reverb | Podcast, Mastering, CoLab |
| SoundLab Podcast | `soundlab.podcast` | Planned (3rd) | Automated podcast post-production: cleanup, levelling, loudness, chapters | CoLab |
| SoundLab Transcribe | `soundlab.transcribe` | Planned (4th) | Audio to MIDI | CoLab, Ultimate Synth |
| SoundLab Mix Assist | `soundlab.mix-assist` | Planned (5th) | AI mixing suggestions across stems | Mastering, CoLab |
| SoundLab Spatial | `soundlab.spatial` | Planned (6th) | Spatial and immersive mixes | Mastering, CoLab |
| SoundLab Ultimate Synth | `soundlab.synth` | Building (0.1) | Rack of 16 classic synth and drum-machine models, step sequencer with a patch bay; renders with stems and MIDI | CoLab, Mastering, Mix Assist |
| Natural language control | `soundlab.command` | Planned (across apps) | "Make the vocal brighter": a layer added to each app rather than a separate app | All Pro apps |

The names after "SoundLab" are working names; final names are yours to choose.

### Shared engines (build once, reuse)

- **Restore** provides the cleanup that **Podcast** automates.
- **Stems** feeds **Mix Assist**, **Transcribe** and Vocalizer (isolating a vocal).
- **Mix Assist** and the **Mastering** assistant share the analysis that decides what to change.
- **Natural language control** turns words into the same settings each app already stores in `source.settings`.

## SoundLab Jr (learning and play)

| App | Status | Notes |
|---|---|---|
| SoundLab Jr Studio | Built (0.4) | Song maker for ages 8–18. Child-safe; does not use CoLab or the Pro format. |
| SoundLab DJ | Building | Learn to DJ and scratch. |

Jr apps follow children's privacy rules (no public sharing, parent or teacher control), so they stay separate from Pro accounts and projects.
