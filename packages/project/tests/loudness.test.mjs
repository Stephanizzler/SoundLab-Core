import assert from "node:assert/strict";
import { measureLoudness, gainToTarget, waveformPeaks } from "../src/index.ts";

const sine = (rate, seconds, dbfs, hz = 1000, phase = 0) =>
  Float32Array.from({ length: Math.round(rate * seconds) }, (_, i) => 10 ** (dbfs / 20) * Math.sin(2 * Math.PI * hz * (i / rate) + phase));
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

// EBU Tech 3341 case 1 and 2: stereo 1 kHz sine at -23 / -33 dBFS reads -23 / -33 LUFS.
for (const rate of [48000, 44100]) {
  for (const level of [-23, -33]) {
    const s = sine(rate, 20, level);
    const m = measureLoudness([s, s], rate);
    near(m.integratedLufs, level, 0.1, `${level} dBFS stereo at ${rate}`);
    near(m.samplePeakDbfs, level, 0.05, "sample peak");
  }
}
// A mono file counts as playing from both speakers.
const mono = sine(48000, 10, -23);
near(measureLoudness([mono], 48000).integratedLufs, -23, 0.1, "dual mono");

// EBU Tech 3341 case 3: -36 / -23 / -36 dBFS segments gate to -23 LUFS.
const seg = (sec, db) => sine(48000, sec, db);
const gatedSig = Float32Array.from([...seg(10, -36), ...seg(60, -23), ...seg(10, -36)]);
near(measureLoudness([gatedSig, gatedSig], 48000).integratedLufs, -23, 0.1, "relative gate");

// EBU Tech 3342 case 1: 20 s at -20 then 20 s at -30 LUFS gives LRA 10 LU.
const lra = Float32Array.from([...seg(20, -20), ...seg(20, -30)]);
near(measureLoudness([lra, lra], 48000).loudnessRange, 10, 1, "loudness range");

// True peak finds the peak between samples: a quarter-rate sine sampled 45° off its crest.
const tp = sine(48000, 1, 0, 12000, Math.PI / 4);
const t = measureLoudness([tp, tp], 48000);
near(t.samplePeakDbfs, -3.0, 0.1, "sample peak misses the crest");
near(t.truePeakDbtp, 0, 0.5, "true peak finds it");

// Silence has no integrated loudness.
const silent = measureLoudness([new Float32Array(48000)], 48000);
assert.equal(silent.integratedLufs, null);
assert.equal(silent.samplePeakDbfs, -120);

assert.ok(Math.abs(gainToTarget(-8, -14) - 0.501) < 0.001, "6 dB down");
assert.equal(gainToTarget(null, -14), 1);
const peaks = waveformPeaks([Float32Array.from([0, 0.5, -1, 0.25])], 2);
assert.deepEqual([...peaks], [0, 0.5, -1, 0.25]);
console.log("loudness checks passed");

{
  const { deliveryCheck, DELIVERY_TARGETS } = await import("../src/index.ts");
  const streaming = DELIVERY_TARGETS[0];
  assert.deepEqual(deliveryCheck({ integratedLufs: -14.2, truePeakDbtp: -1.2, samplePeakDbfs: -1.5, loudnessRange: 5 }, streaming), [], "on target");
  const loud = deliveryCheck({ integratedLufs: -9.9, truePeakDbtp: -0.2, samplePeakDbfs: -0.2, loudnessRange: 1 }, streaming);
  assert.equal(loud.length, 2);
  assert.match(loud[0].text, /True peak -0\.2/);
  assert.match(loud[1].text, /turned down about 4\.1 dB/);
  assert.equal(deliveryCheck({ integratedLufs: -30, truePeakDbtp: -10, samplePeakDbfs: -10, loudnessRange: 5 }, DELIVERY_TARGETS[2])[0].level, "problem");
  console.log("delivery checks passed");
}
