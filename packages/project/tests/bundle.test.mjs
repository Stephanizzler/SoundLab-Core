import assert from "node:assert/strict";
import zlib from "node:zlib";
import * as P from "../src/index.ts";
import { clock, audio } from "./helpers.mjs";

let p = P.createProject(clock, "Bundle test", { name: "Steph" });
const me = P.owner(p).id;
const { project: withSong, song } = P.addSong(p, clock, "Song");
const wav = new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4]);
const a = P.addAsset(withSong, clock, { kind: "audio", name: "mix.wav", mime: "audio/wav", bytes: wav.length, audio: audio(3), createdBy: me });
p = P.addVersion(a.project, clock, song.id, { stage: "mix", assetId: a.asset.id, createdBy: me }).project;

const bytes = P.writeBundle(p, new Map([[a.asset.id, wav]]));
const back = await P.readBundle(bytes);
assert.deepEqual(back.project, p, "project round-trips exactly");
assert.deepEqual([...back.files.get(a.asset.id)], [...wav], "audio round-trips exactly");

// Missing files and tampered data are refused.
assert.throws(() => P.writeBundle(p, new Map()), /missing/);
const flipped = bytes.slice();
flipped[bytes.indexOf(82, 100)] ^= 1; // corrupt the stored audio
await assert.rejects(P.readBundle(flipped), /damaged|size/);
await assert.rejects(P.readBundle(new Uint8Array([1, 2, 3])), /not a SoundLab/);

// A file made by another tool with deflate compression still opens.
const crc = (b) => { let c = 0xffffffff; for (const x of b) { c ^= x; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0); } return (c ^ 0xffffffff) >>> 0; };
function deflatedZip(entries) {
  const parts = [], dir = []; let offset = 0;
  for (const [name, data] of entries) {
    const n = Buffer.from(name), z = zlib.deflateRawSync(data);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(8, 8); h.writeUInt32LE(crc(data), 14); h.writeUInt32LE(z.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(n.length, 26);
    const d = Buffer.alloc(46); d.writeUInt32LE(0x02014b50, 0); d.writeUInt16LE(8, 10); d.writeUInt32LE(crc(data), 16); d.writeUInt32LE(z.length, 20); d.writeUInt32LE(data.length, 24); d.writeUInt16LE(n.length, 28); d.writeUInt32LE(offset, 42);
    parts.push(h, n, z); dir.push(d, n); offset += 30 + n.length + z.length;
  }
  const size = dir.reduce((s, b) => s + b.length, 0), e = Buffer.alloc(22);
  e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(entries.length, 8); e.writeUInt16LE(entries.length, 10); e.writeUInt32LE(size, 12); e.writeUInt32LE(offset, 16);
  return new Uint8Array(Buffer.concat([...parts, ...dir, e]));
}
const other = deflatedZip([["project.json", Buffer.from(JSON.stringify(p))], [`assets/${a.asset.id}`, Buffer.from(wav)]]);
assert.deepEqual((await P.readBundle(other)).project, p);
// Unsafe asset ids never become file paths.
const evil = structuredClone(p); evil.assets[0].id = "../../etc"; evil.songs[0].versions[0].assetId = "../../etc";
await assert.rejects(P.readBundle(deflatedZip([["project.json", Buffer.from(JSON.stringify(evil))], ["assets/../../etc", Buffer.from(wav)]])), /not allowed/);
console.log("bundle checks passed");
