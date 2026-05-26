const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  mergeScannedAssets,
  scanPhotoLibrary
} = require("../lib/assets");

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

function makeRepo(files) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "shancong-assets-"));
  for (const file of files) {
    const filePath = path.join(repoRoot, file);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "image");
  }
  return repoRoot;
}

function baseSite() {
  return {
    assets: [
      {
        id: "existing_room",
        src: "/assets/photos/portrait/existing-room.jpg",
        localTarget: "/assets/photos/portrait/existing-room.jpg",
        orientation: "portrait",
        alt: "Existing room",
        tags: ["房间"]
      },
      {
        id: "remote_stream",
        src: "https://example.com/stream.jpg",
        localTarget: "/assets/photos/landscape/scene-stream-01.jpg",
        orientation: "landscape",
        alt: "Remote stream",
        tags: ["溪流"]
      }
    ]
  };
}

test("scanPhotoLibrary finds supported local photos by orientation", () => {
  const repoRoot = makeRepo([
    "assets/photos/landscape/hero-mountain-01.jpg",
    "assets/photos/portrait/room-window-01.webp",
    "assets/photos/portrait/notes.txt"
  ]);
  const scan = scanPhotoLibrary(repoRoot, { assets: [] });

  assert.strictEqual(scan.files.length, 2);
  assert.deepStrictEqual(scan.files.map((file) => file.orientation).sort(), ["landscape", "portrait"]);
  assert(scan.files.some((file) => file.src === "/assets/photos/landscape/hero-mountain-01.jpg"));
  assert(scan.files.some((file) => file.id === "room_window_01"));
});

test("scanPhotoLibrary separates existing and new local photos", () => {
  const repoRoot = makeRepo([
    "assets/photos/landscape/scene-stream-01.jpg",
    "assets/photos/portrait/existing-room.jpg",
    "assets/photos/portrait/new-room-angle.jpg"
  ]);
  const scan = scanPhotoLibrary(repoRoot, baseSite());

  assert.deepStrictEqual(scan.existingAssets.map((asset) => asset.id).sort(), ["existing_room", "remote_stream"]);
  assert.strictEqual(scan.newAssets.length, 1);
  assert.strictEqual(scan.newAssets[0].id, "new_room_angle");
  assert.strictEqual(scan.newAssets[0].orientation, "portrait");
  assert.strictEqual(scan.newAssets[0].alt, "New room angle");
  assert.deepStrictEqual(scan.newAssets[0].tags, ["new", "room", "angle"]);
});

test("mergeScannedAssets appends new assets without duplicating existing ids", () => {
  const site = baseSite();
  const next = mergeScannedAssets(site, [
    {
      id: "existing_room",
      src: "/assets/photos/portrait/existing-room.jpg",
      orientation: "portrait",
      alt: "Duplicate",
      tags: []
    },
    {
      id: "new_room_angle",
      src: "/assets/photos/portrait/new-room-angle.jpg",
      orientation: "portrait",
      alt: "New room angle",
      tags: ["room"]
    }
  ]);

  assert.strictEqual(next.assets.length, 3);
  assert.strictEqual(next.assets.find((asset) => asset.id === "existing_room").alt, "Existing room");
  assert(next.assets.some((asset) => asset.id === "new_room_angle"));
});
