"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
// These Git blobs were identical to the original rushhiii/portfolio assets at
// commit d61515104310150c523ba7d50094f80b62a18de2.
const removedLegacyAssets = [
  "assets/ele/card_banner.png",
  "assets/ele/card_banner_1.png",
  "assets/ele/card_banner_2.JPG",
  "assets/ele/card_banner_2.png",
  "assets/ele/card_profile_pic.jpg",
  "assets/ele/letter_logo_gl.png",
  "assets/ele/linktrsvg.svg",
  "assets/ele/logo_variations/bg_gradi.png",
  "assets/ele/logo_variations/fav_icon.png",
  "assets/ele/logo_variations/tb_black.png",
  "assets/ele/logo_variations/tb_gradi.png.png",
  "assets/ele/logo_variations/tb_theme.png",
  "assets/ele/logo_variations/tb_white.png",
  "assets/ele/logo_variations/web_icon.png",
  "assets/ele/logo_variations/web_icon_2.png",
  "assets/ele/preview.png",
  "assets/ele/profile2.jpg",
  "assets/ele/profile_garba_outline.png",
  "assets/ele/profile_git.jpg",
  "assets/ele/profile_graba.jpg",
  "assets/ele/profile_graba1.jpg",
  "assets/ele/profile_pic.png",
  "assets/ele/profile_pic_outline.png",
  "assets/ele/repo_banner.png",
  "assets/fonts/themify.woff2",
  "assets/projects/bashfolio.png",
  "assets/projects/githubstats.png",
  "assets/projects/scriptable.png",
  "assets/rushi_tech_resume.pdf"
];
const preservedFiles = [
  "assets/ele/favicon.svg",
  "assets/projects/thunder-v2/launch-event-team.jpg",
  "assets/projects/thunder-v2/thunder-v2-nose-cone.jpg",
  "tests/screenshots/desktop-dark.png",
  "tests/screenshots/desktop-light.png",
  "tests/screenshots/mobile-dark.png",
  "tests/screenshots/mobile-light.png",
  "LICENSE",
  "index.html",
  "assets/js/script.js",
  "assets/nexus-card/index.html"
];
const liveSources = [
  "index.html",
  "projects/_template/index.html",
  "projects/v4-flight-computer/index.html",
  "projects/thunder-v2-hpr-flight/index.html",
  "projects/thunder-v2-flight-evidence/index.html",
  "assets/nexus-card/index.html",
  "assets/js/script.js",
  "assets/css/awards-recognition.css",
  "assets/css/case-study.css",
  "assets/css/engineering-timeline.css",
  "assets/css/flight-data-presentation.css",
  "assets/css/hpr-flight-case-study.css",
  "assets/css/style.css",
  "assets/css/v4-case-study.css"
];

assert.equal(removedLegacyAssets.length, 29, "Legacy cleanup manifest must remain explicit");
for (const relative of removedLegacyAssets) {
  assert.ok(!fs.existsSync(path.join(root, relative)), "Old template asset remains: " + relative);
}
for (const relative of preservedFiles) {
  assert.ok(fs.existsSync(path.join(root, relative)), "Approved or functional file missing: " + relative);
}
for (const relative of liveSources) {
  const content = fs.readFileSync(path.join(root, relative), "utf8");
  for (const legacy of removedLegacyAssets) {
    assert.ok(!content.includes(path.basename(legacy)), "Active source still references legacy asset: " + relative + " -> " + legacy);
  }
}
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
assert.match(readme, /not a Git-history purge/);
console.log("PASS: R2-B removed 29 unchanged template assets, preserved approved files, and verified no active source references");
