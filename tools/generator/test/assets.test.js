const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  buildAssetLibrary,
  mergeScannedAssets,
  scanPhotoLibrary,
  updateAssetMetadata
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
    share: {
      image: "remote_stream"
    },
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
    ],
    pages: {
      home: {
        hero: { image: "remote_stream" },
        sections: [
          {
            id: "stream",
            slots: { cover: "remote_stream" }
          },
          {
            id: "room",
            slots: { cover: "existing_room" }
          }
        ]
      },
      rooms: [
        {
          id: "guest_room",
          cover: "existing_room",
          images: ["remote_stream"]
        }
      ]
    }
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

test("buildAssetLibrary reports where each asset is used", () => {
  const library = buildAssetLibrary(baseSite());
  const byId = Object.fromEntries(library.map((asset) => [asset.id, asset]));

  assert.strictEqual(byId.remote_stream.used, true);
  assert(byId.remote_stream.usage.includes("分享图"));
  assert(byId.remote_stream.usage.includes("首页首屏"));
  assert(byId.remote_stream.usage.includes("首页区块 stream / cover"));
  assert(byId.remote_stream.usage.includes("房间 guest_room / 图集"));
  assert.strictEqual(byId.existing_room.used, true);
  assert(byId.existing_room.usage.includes("房间 guest_room / 封面"));
});

test("updateAssetMetadata changes only alt and tags", () => {
  const next = updateAssetMetadata(baseSite(), [
    { id: "remote_stream", alt: "天然溪流", tags: "溪流，避暑, 安静" },
    { id: "missing", alt: "ignored", tags: ["x"] }
  ]);
  const asset = next.assets.find((item) => item.id === "remote_stream");

  assert.strictEqual(asset.alt, "天然溪流");
  assert.deepStrictEqual(asset.tags, ["溪流", "避暑", "安静"]);
  assert.strictEqual(asset.src, "https://example.com/stream.jpg");
  assert.strictEqual(asset.orientation, "landscape");
  assert.strictEqual(next.assets.length, baseSite().assets.length);
});
