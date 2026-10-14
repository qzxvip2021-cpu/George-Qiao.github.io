"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const page = path.join(root, "index.html");
const html = fs.readFileSync(page, "utf8");
const css = fs.readFileSync(path.join(root, "assets", "css", "awards-recognition.css"), "utf8");

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
assert.ok(html.includes('<link rel="stylesheet" href="./assets/css/awards-recognition.css" />'));

const projectsAt = html.indexOf('id="projects"');
const journeyAt = html.indexOf('id="journey"');
const awardsAt = html.indexOf('id="awards"');
const contactAt = html.indexOf('id="contact"');
assert.ok(
  projectsAt < journeyAt && journeyAt < awardsAt && awardsAt < contactAt,
  "Sections must remain Projects, Journey, Awards, Contact",
);
assert.match(html, /<a href="#awards">Awards<\/a>/);
assert.match(html, /<p class="eyebrow">04 \/ Awards &amp; Recognition<\/p>/);
assert.match(html, /<p class="eyebrow">05 \/ Contact<\/p>/);

const awards = section("awards", "contact");
assert.equal((awards.match(/<article class="award-card panel">/g) || []).length, 3, "Exactly three award cards");
assert.equal((awards.match(/<h3>/g) || []).length, 3, "Each award card needs one H3");
assert.equal((awards.match(/<img\b/g) || []).length, 0, "Awards must not include images or logos");
assert.deepEqual(allFrom(awards, /class="award-category">([^<]+)</g), [
  "Competition Result",
  "Team Recognition",
  "Personal Credential",
]);

const orderedText = [
  "American Rocketry Challenge &mdash; 2026 National Finals",
  "42nd Place",
  "Art Learning Mission (Team 2)",
  "ARC Launchpad League &mdash; 2026",
  "2nd Place",
  "Art Learning Mission (Team 2)",
  "NAR Junior Level 1 &mdash; High-Power Rocketry",
  "Junior Level 1",
  "National Association of Rocketry",
];
let cursor = -1;
for (const text of orderedText) {
  const next = awards.indexOf(text, cursor + 1);
  assert.ok(next > cursor, `Missing or out-of-order award text: ${text}`);
  cursor = next;
}

assert.match(awards, /<dt>Year<\/dt>\s*<dd>2026<\/dd>/);
assert.equal((awards.match(/<dt>Year<\/dt>\s*<dd>2026<\/dd>/g) || []).length, 2);
assert.match(
  awards,
  /Our team placed 42nd at the 2026 American Rocketry Challenge\s+National Finals\. As Team Captain, I contributed to rocket design,\s+team coordination, and project documentation\./,
);
assert.match(awards, /This is a team result, not an individual ranking\./);
assert.match(
  awards,
  /Recognized for our team's active participation, engagement in\s+learning activities, and involvement in the American Rocketry\s+Challenge community throughout the competition season\./,
);
assert.match(
  awards,
  /Launchpad League team placement, not second place in the\s+national rocket flight competition or an individual award/,
);
assert.match(
  awards,
  /My National Association of Rocketry membership card documents\s+Junior Level 1 high-power rocketry status under the Junior HPR\s+Participation Program\./,
);
assert.match(awards, /Evidence basis: user-provided membership card; no independent NAR\s+database lookup was performed\./);

for (const href of [
  "https://www.rocketrychallenge.org/result/2026/",
  "https://www.rocketrychallenge.org/launchpad-league/",
  "https://www.nar.org/content.aspx?club_id=114127&amp;module_id=765342&amp;page_id=22",
]) {
  const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(awards, new RegExp(`href="${escaped}"[\\s\\S]*?target="_blank"[\\s\\S]*?rel="noopener noreferrer"`));
}

assert.ok(
  !/href="[^"]*projects\/(?:v4-flight-computer|thunder-v2-hpr-flight|thunder-v2-flight-evidence)\/?[^"]*"/i.test(html),
  "Homepage must not link the unpublished case-study pages",
);
assert.ok(!/finalists?|finals field|\b\d+\s+teams?\b/i.test(awards), "Do not state finalist counts");
assert.ok(!/narTcert|AIME|USNCO/i.test(awards), "Do not add unapproved honors");
assert.ok(!/membership (?:number|id)|expiration|expiry|adult level|level 2/i.test(awards), "Do not expose or overstate credential details");
assert.ok(!/independent NAR database (?:verification|lookup confirmed)/i.test(awards));

for (const hook of ["main-content", "themeToggle", "menuToggle", "navMenu", "projects", "journey", "awards", "contact", "currentYear"]) {
  assert.ok(ids.includes(hook), `Shared hook or anchor missing: ${hook}`);
}

for (const ref of all(/\b(?:href|src)="([^"]+)"/g)) {
  if (/^(#|https?:|mailto:)/.test(ref)) continue;
  const local = ref.split("#")[0].split("?")[0];
  const full = path.resolve(path.dirname(page), local);
  assert.ok(full.startsWith(root + path.sep), `File escapes repository: ${ref}`);
  assert.ok(fs.existsSync(full), `Missing local file: ${ref}`);
}

assert.match(css, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
assert.match(css, /@media \(min-width: 761px\) and \(max-width: 1024px\)/);
assert.match(css, /@media \(max-width: 980px\)/);
assert.match(css, /@media \(max-width: 760px\)/);
assert.match(css, /\.nav-menu\s*\{[\s\S]*?flex-wrap: wrap/);

console.log("PASS: Awards & Recognition, three approved cards, evidence boundaries, links, order, anchors, and responsive CSS");

function allFrom(source, pattern) {
  return [...source.matchAll(pattern)].map((match) => match[1]);
}
