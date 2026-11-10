import assert from "node:assert/strict";
import * as P from "../src/index.ts";
import { clock, audio } from "./helpers.mjs";

let p = P.createProject(clock, "  Night Drive EP ", { name: "Steph" }, "Neon Coast");
assert.equal(p.title, "Night Drive EP");
assert.ok(P.isProject(p), P.problems(p).join("; "));
const me = P.owner(p).id;
assert.throws(() => P.createProject(clock, " ", { name: "x" }), /name/);

// Songs, assets and versions.
let r = P.addSong(p, clock, "Night Drive"); p = r.project; const song = r.song;
let a = P.addAsset(p, clock, { kind: "audio", name: "Night Drive mix1.wav", mime: "audio/wav", bytes: 10, audio: audio(), createdBy: me }); p = a.project;
let v = P.addVersion(p, clock, song.id, { stage: "mix", assetId: a.asset.id, createdBy: me, description: "First full mix" }); p = v.project;
const mix1 = v.version;
assert.equal(mix1.label, "Mix 1");
assert.equal(mix1.status, "in-review");
assert.equal(mix1.source.app, "soundlab.colab");
a = P.addAsset(p, clock, { kind: "audio", name: "mix2.wav", mime: "audio/wav", bytes: 10, audio: audio(), createdBy: me }); p = a.project;
v = P.addVersion(p, clock, song.id, { stage: "mix", assetId: a.asset.id, createdBy: me, source: { app: "soundlab.colab", basedOn: mix1.id } }); p = v.project;
const mix2 = v.version;
assert.equal(mix2.label, "Mix 2");
a = P.addAsset(p, clock, { kind: "audio", name: "master.wav", mime: "audio/wav", bytes: 10, audio: audio(), createdBy: me }); p = a.project;
v = P.addVersion(p, clock, song.id, { stage: "master", assetId: a.asset.id, createdBy: me, source: { app: "soundlab.mastering", basedOn: mix2.id, settings: { app: "soundlab.mastering", schema: 1, data: { target: -14 } } } }); p = v.project;
assert.equal(v.version.label, "Master 1", "labels count per stage");
assert.ok(P.isProject(p), P.problems(p).join("; "));
// A version needs real audio from the project.
const doc = P.addAsset(p, clock, { kind: "document", name: "notes.txt", mime: "text/plain", bytes: 3, createdBy: me });
assert.throws(() => P.addVersion(doc.project, clock, song.id, { stage: "mix", assetId: doc.asset.id, createdBy: me }), /audio/);
assert.throws(() => P.addVersion(p, clock, song.id, { stage: "mix", assetId: "nope", createdBy: me }), /audio/);

// Members, comments, replies and resolving.
let m = P.addMember(p, clock, "Jordan", "artist"); p = m.project; const artist = m.member.id;
m = P.addMember(p, clock, "Label A&R", "client"); p = m.project; const client = m.member.id;
assert.throws(() => P.addMember(p, clock, "Two", "owner"), /one owner/);
let c = P.addComment(p, clock, { versionId: mix1.id, at: 92, text: "Vocal too bright here", authorId: artist }); p = c.project;
assert.throws(() => P.addComment(p, clock, { versionId: mix1.id, at: 500, text: "x", authorId: artist }), /time/, "comments stay inside the audio");
assert.throws(() => P.addComment(p, clock, { versionId: mix1.id, at: 3, text: " ", authorId: artist }), /comment/);
assert.throws(() => P.addComment(p, clock, { versionId: mix1.id, at: 3, text: "hi", authorId: "stranger" }), /members/);
p = P.reply(p, clock, c.comment.id, { authorId: me, text: "Pulled 2 dB at 6k in Mix 2" });
p = P.resolve(p, clock, c.comment.id, me, mix2.id);
let s = P.findSong(p, song.id);
assert.equal(s.comments[0].replies.length, 1);
assert.equal(s.comments[0].resolved.inVersionId, mix2.id);
p = P.reopen(p, clock, c.comment.id);
assert.equal(P.findSong(p, song.id).comments[0].resolved, undefined);

// Approvals: every artist and client, or the owner.
p = P.approve(p, clock, mix2.id, artist);
assert.equal(P.findVersion(p, mix2.id).version.status, "in-review");
p = P.approve(p, clock, mix2.id, artist);
assert.equal(P.findVersion(p, mix2.id).version.approvals.length, 1, "approving twice counts once");
p = P.approve(p, clock, mix2.id, client);
assert.equal(P.findVersion(p, mix2.id).version.status, "approved");
p = P.setStatus(p, clock, mix2.id, "changes-requested");
assert.equal(P.findVersion(p, mix2.id).version.approvals.length, 0, "requesting changes clears approvals");
p = P.approve(p, clock, mix2.id, me);
assert.equal(P.findVersion(p, mix2.id).version.status, "approved", "the owner can sign off alone");

// Sessions and app settings.
const sess = P.addAsset(p, clock, { kind: "session", name: "Night Drive.zip", mime: "application/zip", bytes: 100, session: { daw: "Logic Pro", dawVersion: "11.1" }, createdBy: me }); p = sess.project;
p = P.attachSession(p, clock, song.id, sess.asset.id);
assert.throws(() => P.attachSession(p, clock, song.id, mix1.assetId), /session/);
p = P.setAppSettings(p, clock, { app: "soundlab.vocalizer", schema: 2, data: { key: "C minor" } });
assert.throws(() => P.setAppSettings(p, clock, { app: "Vocalizer", schema: 1, data: {} }), /App ids/);
assert.deepEqual(P.unusedAssets(p), [], "every file is in use");
const extra = P.addAsset(p, clock, { kind: "stem", name: "drums.wav", mime: "audio/wav", bytes: 5, audio: audio(), createdBy: me });
assert.deepEqual(P.unusedAssets(extra.project).map((x) => x.name), ["drums.wav"]);
assert.ok(P.isProject(p), P.problems(p).join("; "));

// Validation catches damaged or hostile data.
const broken = structuredClone(p);
broken.songs[0].versions[0].assetId = "missing";
assert.match(P.problems(broken).join(), /no audio/);
const noOwner = { ...structuredClone(p), members: p.members.filter((x) => x.role !== "owner") };
assert.match(P.problems(noOwner).join(), /owner/);
assert.match(P.problems({ ...p, version: 2 }).join(), /format version 2/);
assert.deepEqual(P.problems(null), ["Not a SoundLab project."]);
const fake = structuredClone(p);
fake.songs[0].comments[0].authorId = "intruder";
assert.ok(!P.isProject(fake));
console.log("project format checks passed");
