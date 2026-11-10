let n = 0, t = Date.parse("2026-11-10T00:00:00Z");
export const clock = { id: () => `id-${++n}`, now: () => new Date((t += 1000)).toISOString() };
export const audio = (seconds = 120) => ({ sampleRate: 48000, channels: 2, durationSeconds: seconds });
