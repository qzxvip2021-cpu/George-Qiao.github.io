"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const page = path.join(root, "index.html");
const html = fs.readFileSync(page, "utf8");
const css = fs.readFileSync(path.join(root, "assets", "css", "engineering-timeline.css"), "utf8");

function all(pattern) {
  return [...html.matchAll(pattern)].map((match) => match[1]);
}

function section(id, nextId) {
  const start = html.indexOf(`id="${id}"`);
  const end = html.indexOf(`id="${nextId}"`, start);
  assert.notEqual(start, -1, `Missing section: ${id}`);
  assert.notEqual(end, -1, `Missing following section: ${nextId}`);
  return html.slice(start, end);
}

const ids = all(/\bid="([^"]+)"/g);
assert.equal(new Set(ids).size, ids.length, "Duplicate element IDs");
assert.equal((html.match(/<h1\b/g) || []).length, 1, "Exactly one H1");
assert.equal((html.match(/<main\b/g) || []).length, 1, "Exactly one main");
assert.ok(html.includes('<link rel="stylesheet" href="./assets/css/engineering-timeline.css" />'));

const projectsAt = html.indexOf('id="projects"');
const journeyAt = html.indexOf('id="journey"');
const contactAt = html.indexOf('id="contact"');
assert.ok(projectsAt < journeyAt && journeyAt < contactAt, "Journey must sit between Projects and Contact");
assert.match(html, /<a href="#journey">Journey<\/a>/);
assert.match(html, /<p class="eyebrow">03 \/ Engineering Journey<\/p>/);
assert.match(html, /<p class="eyebrow">04 \/ Contact<\/p>/);

const journey = section("journey", "contact");
assert.equal((journey.match(/class="timeline-item"/g) || []).length, 5, "Exactly five milestones");
assert.equal((journey.match(/class="timeline-marker" aria-hidden="true"/g) || []).length, 5);
assert.deepEqual(
  [...journey.matchAll(/<time class="timeline-date" datetime="([^"]+)"/g)].map((match) => match[1]),
  ["2025-08", "2025-12", "2026-05", "2026-10-02", "2026-10"],
  "Machine-readable dates must remain ordered and valid",
);
for (const index of ["01", "02", "03", "04", "05"]) {
  assert.match(journey, new RegExp(`class="timeline-index" aria-hidden="true">${index}<`));
}

const orderedText = [
  "August 2025",
  "Getting Started in Rocketry",
  "December 2025 &ndash; May 2026",
  "Rocket Flight Solver",
  "May 2026",
  "American Rocketry Challenge National Finals",
  "October 2, 2026",
  "V4 Flight Computer &mdash; Rev A Design Snapshot",
  "October 2026",
  "Thunder V2 &mdash; HPR Flight Experience",
];
let cursor = -1;
for (const text of orderedText) {
  const next = journey.indexOf(text, cursor + 1);
  assert.ok(next > cursor, `Missing or out-of-order timeline text: ${text}`);
  cursor = next;
}

assert.match(journey, /official\s+name&mdash;formed on August 19, 2025/);
assert.match(journey, /first team rocket\s+launch attempt followed on August 24, 2025/);
assert.match(journey, /does\s+not establish a successful recovery/);
assert.match(journey, /Python-based tool for rocket apogee estimation and\s+liftoff-mass optimization/);
assert.match(journey, /GitHub commit history confirms\s+project activity from December 2025 through May 2026/);
assert.match(journey, /has not been independently validated against real-flight\s+accuracy/);
assert.match(journey, /Art Learning Mission \(Team 2\) placed 42nd at the 2026 National\s+Finals/);
assert.match(journey, /team's placement, not an individual\s+ranking/);
assert.match(journey, /Team Captain, contributing to rocket\s+design, team coordination, and project documentation/);
assert.match(journey, /six-layer RP2040-based flight-computer design through\s+Rev A manufacturing-package preparation and consistency review/);
assert.match(journey, /In development &middot; Hardware design/);
assert.match(journey, /PCB was manufactured, physically\s+tested, or flown/);
assert.match(journey, /structural design, fabrication and assembly,\s+motor and recovery configuration, launch operations, and\s+post-flight data review/);
assert.match(journey, /AltimeterTwo original display video\s+shows a peak-altitude reading of 2,329 ft/);
assert.match(journey, /exact launch date remains unconfirmed/);
assert.match(journey, /OpenRocket preflight-prediction accuracy or a complete\s+recovery sequence/);

for (const href of [
  "https://github.com/qzxvip2021-cpu/rocket-flight-solver",
  "https://www.rocketrychallenge.org/result/2026/",
]) {
  const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(journey, new RegExp(`href="${escaped}"[\\s\\S]*?target="_blank"[\\s\\S]*?rel="noopener noreferrer"`));
}

assert.ok(
  !/href="[^"]*projects\/(?:v4-flight-computer|thunder-v2-hpr-flight|thunder-v2-flight-evidence)\/?[^"]*"/i.test(html),
  "Homepage must not link the unpublished case-study pages",
);
assert.ok(!/Jr\.?\s*L1|teaching hours|club restart/i.test(journey));
assert.ok(!/finals? (?:field|teams?|entrants?)\s*(?:of|:)?\s*\d+/i.test(journey));

for (const hook of ["main-content", "themeToggle", "menuToggle", "navMenu", "projects", "journey", "contact", "currentYear"]) {
  assert.ok(ids.includes(hook), `Shared hook or anchor missing: ${hook}`);
}

for (const ref of all(/\b(?:href|src)="([^"]+)"/g)) {
  if (/^(#|https?:|mailto:)/.test(ref)) continue;
  const local = ref.split("#")[0].split("?")[0];
  const full = path.resolve(path.dirname(page), local);
  assert.ok(full.startsWith(root + path.sep), `File escapes repository: ${ref}`);
  assert.ok(fs.existsSync(full), `Missing local file: ${ref}`);
}

assert.match(css, /\.timeline-list::before/);
assert.match(css, /grid-template-columns: 150px 34px minmax\(0, 1fr\)/);
assert.match(css, /@media \(max-width: 760px\)/);
assert.match(css, /grid-template-columns: 22px minmax\(0, 1fr\)/);

console.log("PASS: Engineering Journey timeline, five ordered milestones, evidence boundaries, links, anchors, and responsive CSS");
