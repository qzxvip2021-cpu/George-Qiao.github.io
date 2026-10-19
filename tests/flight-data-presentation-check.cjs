"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const page = path.join(root, "projects", "thunder-v2-flight-evidence", "index.html");
const html = fs.readFileSync(page, "utf8");
const css = fs.readFileSync(path.join(root, "assets", "css", "flight-data-presentation.css"), "utf8");
const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
const hprPage = fs.readFileSync(path.join(root, "projects", "thunder-v2-hpr-flight", "index.html"), "utf8");

function all(pattern) {
  return [...html.matchAll(pattern)].map((match) => match[1]);
}

function card(name) {
  const pattern = new RegExp(`<div class="readout-card panel(?: is-anomalous)?" data-readout="${name}">([\\s\\S]*?)</div>`);
  const match = html.match(pattern);
  assert.ok(match, `Missing readout card: ${name}`);
  return match[1];
}

const ids = all(/\bid="([^"]+)"/g);
assert.equal(new Set(ids).size, ids.length, "Duplicate element IDs");
assert.equal((html.match(/<h1\b/g) || []).length, 1, "Exactly one H1");
assert.equal((html.match(/<main\b/g) || []).length, 1, "Exactly one main");
assert.match(html, /name="robots" content="noindex, nofollow"/);
assert.match(html, /Linked from Thunder V2 case study · noindex/);
assert.match(html, /href="\.\.\/thunder-v2-hpr-flight\/index\.html"/);
assert.match(html, /Thunder V2 — Flight Evidence &amp; Simulation Snapshots/);
assert.match(html, /class="flight-featured-readout panel" href="#instrument-readout"/);
assert.ok(
  html.indexOf('class="flight-featured-readout panel"') < html.indexOf('id="evidence-overview"'),
  "Direct readout link must precede the evidence overview",
);
assert.match(html, /Instrument accuracy and specific launch linkage remain unverified/);
assert.equal((html.match(/class="evidence-key-item" role="listitem"/g) || []).length, 4,
  "Four compact evidence-class entries required");

const sections = [
  ["evidence-overview", "Evidence Overview"],
  ["instrument-readout", "AltimeterTwo Instrument Readout"],
  ["simulation-snapshots", "Saved OpenRocket Simulation Snapshots"],
  ["configuration-context", "User-Reported Configuration Context"],
  ["evidence-limitations", "Evidence Limitations"],
  ["source-references", "Source References"],
];
for (const [id, title] of sections) {
  assert.ok(ids.includes(id), `Missing section: ${id}`);
  assert.ok(html.includes(title), `Missing section title: ${title}`);
  assert.match(html, new RegExp(`href="#${id}"`), `Missing TOC link: ${id}`);
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

const readouts = [
  ["peak-altitude", "Peak Altitude", "2,329", "ft"],
  ["top-speed", "Top Speed", "486", "mph"],
  ["thrust-time", "Thrust Time", "1.5", "s"],
  ["peak-acceleration", "Peak Acceleration", "28.4", "G"],
  ["average-acceleration", "Average Acceleration", "21.1", "G"],
  ["coast-apogee", "Coast–Apogee", "9.1", "s"],
  ["apogee-ejection", "Apogee–Ejection", "−9.0", "s"],
  ["ejection-altitude", "Ejection Altitude", "389", "ft"],
  ["descent", "Descent", "1", "mph"],
  ["flight-duration", "Flight Duration", "152.7", "s"],
];
for (const [name, label, value, unit] of readouts) {
  const content = card(name);
  assert.ok(content.includes(label), `Missing readout label: ${label}`);
  const matches = content.match(/<dd><strong>[^<]+<\/strong><span>[^<]+<\/span><\/dd>/g) || [];
  assert.deepEqual(matches, [`<dd><strong>${value}</strong><span>${unit}</span></dd>`],
    `Exactly one exact numerical readout required for: ${label}`);
}
const displayedIds = all(/data-readout="([^"]+)"/g);
assert.deepEqual(displayedIds, readouts.map(([name]) => name),
  "Readout identities, order, and count must stay unchanged");
assert.equal((html.match(/class="readout-card panel/g) || []).length, 10);
assert.equal((html.match(/class="readout-card panel is-anomalous"/g) || []).length, 3);

assert.match(card("apogee-ejection"), /negative event time and event classification are unresolved/);
assert.match(card("apogee-ejection"), /not evidence of an actual ejection time/);
assert.match(card("ejection-altitude"), /not proof that an actual ejection occurred at 389 ft/);
assert.match(card("descent"), /not proof of an actual 1 mph descent/);

assert.match(html, /AltimeterTwo original display video/);
assert.match(html, /Video-confirmed instrument readout/);
assert.match(html, /do not\s+independently verify physical measurement accuracy/);
assert.match(html, /雷霆V2\.ork/);
assert.match(html, /2,322\.55 ft/);
assert.match(html, /1\.081 kg/);
assert.match(html, /雷霆V2\(1\)\.ork/);
assert.match(html, /2,328\.08 ft/);
assert.match(html, /1\.068 kg/);
assert.equal((html.match(/<dd>14 s<\/dd>/g) || []).length, 2);
assert.equal((html.match(/Not a Verified Preflight Prediction/g) || []).length, 2);
const snapshotCards = all(/<article class="snapshot-card panel">([\s\S]*?)<\/article>/g);
assert.equal(snapshotCards.length, 2, "Exactly two saved snapshots");
const snapshots = [
  { label: "雷霆V2.ork", altitude: "2,322.55 ft", mass: "1.081 kg", warningSpeed: "69.7 ft/s" },
  { label: "雷霆V2(1).ork", altitude: "2,328.08 ft", mass: "1.068 kg", warningSpeed: "69.8 ft/s" },
];
for (let i = 0; i < snapshots.length; i += 1) {
  const saved = snapshots[i];
  const content = snapshotCards[i];
  assert.ok(content.includes(`<h3>${saved.label}</h3>`), `Snapshot label mismatch: ${i}`);
  assert.ok(content.includes("H219T Simulation 4"), `Simulation identity mismatch: ${i}`);
  for (const [label, value] of [
    ["Saved altitude", saved.altitude],
    ["Simulation total mass", saved.mass],
    ["Simulated delay", "14 s"],
  ]) {
    assert.ok(content.includes(`<div><dt>${label}</dt><dd>${value}</dd></div>`),
      `Wrong saved ${label}: ${saved.label}`);
  }
  assert.equal((content.match(/class="snapshot-warning"/g) || []).length, 1,
    `One OpenRocket warning per snapshot: ${saved.label}`);
  assert.ok(content.includes("Saved simulation warning · HighSpeedDeployment"),
    `Missing warning identity: ${saved.label}`);
  assert.ok(content.includes(`Simulated recovery deployment speed: ${saved.warningSpeed}`),
    `Warning speed belongs to wrong simulation: ${saved.label}`);
}
assert.match(html, /do not\s+establish that high-speed recovery deployment occurred during the actual flight/);
assert.match(html, /saved models are not identical configurations/i);
assert.match(html, /confirmed preflight version is unknown/);
assert.match(html, /no accuracy, error percentage, or\s+simulation-to-flight delta is calculated/);

assert.match(html, /AeroTech H219T-14A, reported as adjusted with UDDT to 10 seconds/);
assert.match(html, /30-inch parachute/);
assert.match(html, /No JLCR used on this flight/);
for (const label of [
  "Video-confirmed instrument readout",
  "Saved simulation result",
  "User-reported configuration",
  "Unverified or unavailable evidence",
]) {
  assert.ok(html.includes(label), `Missing evidence class: ${label}`);
}

assert.ok(!/<img\b|<video\b|<canvas\b/i.test(html), "Raw or fabricated media must not be embedded");
assert.ok(!/href="[^"]*\.(?:ork|mp4|png|jpe?g)(?:[?#][^"]*)?"/i.test(html), "Raw artifacts must not be linked");
assert.ok(!/file:\/\/|[A-Z]:\\/i.test(html), "Private local paths must not appear");
assert.ok(!/%/.test(html), "Accuracy percentages must not be presented");
assert.ok(!home.includes("thunder-v2-flight-evidence"), "Homepage must not link the evidence page");
assert.match(hprPage, /href="\.\.\/thunder-v2-flight-evidence\/index\.html"/);
assert.equal((html.match(/<section class="case-section"/g) || []).length, 6);
assert.match(css, /\.readout-grid/);
assert.match(css, /\.is-anomalous/);
assert.match(css, /\.flight-featured-readout/);
assert.match(css, /\.evidence-key-item/);
assert.match(css, /\.snapshot-warning/);
assert.match(css, /@media \(max-width: 760px\)/);

console.log(
  `PASS: Flight data presentation, ${readouts.length} readouts, two saved snapshots, ` +
    `${sections.length} sections, ${ids.length} unique IDs, ${localFiles} relative files, noindex`,
);
