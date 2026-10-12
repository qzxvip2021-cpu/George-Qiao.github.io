"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const page = path.join(root, "projects", "v4-flight-computer", "index.html");
const html = fs.readFileSync(page, "utf8");
const css = fs.readFileSync(path.join(root, "assets", "css", "v4-case-study.css"), "utf8");

function all(pattern) {
  return [...html.matchAll(pattern)].map((match) => match[1]);
}

const ids = all(/\bid="([^"]+)"/g);
assert.equal(new Set(ids).size, ids.length, "Duplicate element IDs");
assert.equal((html.match(/<h1\b/g) || []).length, 1, "Exactly one H1");
assert.equal((html.match(/<main\b/g) || []).length, 1, "Exactly one main");
assert.match(html, /name="robots" content="noindex, nofollow"/);

const expectedSections = [
  ["overview", "Project Overview"],
  ["objectives", "Design Objectives &amp; Constraints"],
  ["architecture", "System Architecture"],
  ["pcb-design", "PCB Design &amp; Engineering Decisions"],
  ["manufacturing", "Design Iterations &amp; Manufacturing Preparation"],
  ["verification", "Verification Status &amp; Known Limitations"],
  ["lessons", "Challenges &amp; Lessons Learned"],
  ["next-steps-references", "Next Steps &amp; References"],
];
for (const [id, title] of expectedSections) {
  assert.ok(ids.includes(id), `Missing section: ${id}`);
  assert.ok(html.includes(title), `Missing section heading: ${title}`);
  assert.match(html, new RegExp(`href="#${id}"`), `TOC link missing: ${id}`);
}

for (const target of all(/\bhref="#([^"]+)"/g)) {
  assert.ok(ids.includes(target), `Missing in-page anchor: #${target}`);
}

for (const hook of ["main-content", "themeToggle", "menuToggle", "navMenu", "currentYear"]) {
  assert.ok(ids.includes(hook), `Shared JS hook missing: ${hook}`);
}

const refs = all(/\b(?:href|src)="([^"]+)"/g);
let localFiles = 0;
for (const ref of refs) {
  if (/^(#|https?:|mailto:)/.test(ref)) continue;
  const local = ref.split("#")[0].split("?")[0];
  const full = path.resolve(path.dirname(page), local);
  assert.ok(full.startsWith(root + path.sep), `File escapes repository: ${ref}`);
  assert.ok(fs.existsSync(full), `Missing local file: ${ref}`);
  localFiles++;
}

assert.match(html, /Fabrication and bench validation not verified; V4 has not flown/);
assert.match(html, /My Role &amp; Contributions/);
assert.match(html, /independent engineering project developed with AI/);
assert.match(html, /AI-assisted work across\s+schematic design/);
assert.match(html, /PCB layout and routing, firmware development/);
assert.match(html, /completed firmware\s+testing and operation on hardware are not verified/);
assert.match(html, /Confirmed design change/);
assert.match(html, /Earlier source and\s+documentation used Display-interface descriptions/);
assert.match(html, /3\.3 V AUX GPIO on GP23 and\s+GP24, not I2C\/display/);
assert.match(html, /Legacy source and documentation remnants/);
assert.match(html, /Historical material referenced a 50 × 180 mm board/);
assert.match(html, /current Edge\.Cuts and fabrication profile centerline are 50 × 160 mm/);
assert.match(html, /Unresolved review findings/);
assert.match(html, /procurement-field differences for J_RF1, J_SD1, J_USB1,\s+and U2/);
assert.match(html, /does not establish all rendered copper or aperture extents or\s+resolve CAM\/electrical equivalence/);
assert.match(html, /V4 has not flown/);
assert.match(html, /DRC is not clean/);
assert.match(html, /13 findings/);
assert.match(html, /50 × 180 mm/);
assert.match(html, /does not establish all rendered copper or aperture extents/);
assert.match(html, /USB4105-GF-A-120/);
assert.match(html, /USB4940-00-A/);
assert.match(html, /CONCEPTUAL SYSTEM DIAGRAM/);
assert.match(html, /PROJECT IMAGE PENDING REVIEW/);
assert.ok(!html.includes("flight-proven"), "Unsupported flight-proven claim");
assert.ok(!html.includes("fully verified"), "Unsupported fully verified claim");
assert.ok(!html.includes("manufacturing ready"), "Unsupported manufacturing-ready claim");
assert.equal((html.match(/<section class="case-section"/g) || []).length, 8);
assert.match(css, /\.architecture-diagram/);
assert.match(css, /max-width:\s*760px/);

console.log(
  `PASS: V4 case study, ${expectedSections.length} sections, ${ids.length} unique IDs, ` +
    `${localFiles} relative files, evidence boundaries, noindex`,
);
