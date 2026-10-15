"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
const v4 = fs.readFileSync(path.join(root, "projects", "v4-flight-computer", "index.html"), "utf8");
const hpr = fs.readFileSync(path.join(root, "projects", "thunder-v2-hpr-flight", "index.html"), "utf8");
const evidence = fs.readFileSync(path.join(root, "projects", "thunder-v2-flight-evidence", "index.html"), "utf8");

function sectionBetween(source, start, end) {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first + start.length);
  assert.ok(first >= 0 && last > first, "Publication page region markers missing");
  return source.slice(first, last);
}
const projects = sectionBetween(home, 'id="projects"', 'id="journey"');
const journey = sectionBetween(home, 'id="journey"', 'id="awards"');
const v4Card = sectionBetween(projects, "<h3>V4 Flight Computer</h3>", "</article>");
const thunderCard = sectionBetween(journey, "<h3>Thunder V2 &mdash; HPR Flight Experience</h3>", "</article>");

assert.match(v4Card, /href="\.\/projects\/v4-flight-computer\/index\.html"/);
assert.match(thunderCard, /href="\.\/projects\/thunder-v2-hpr-flight\/index\.html"/);
assert.equal((home.match(/href="\.\/projects\/v4-flight-computer\/index\.html"/g) || []).length, 1);
assert.equal((home.match(/href="\.\/projects\/thunder-v2-hpr-flight\/index\.html"/g) || []).length, 1);
assert.ok(!/href="[^"]*thunder-v2-flight-evidence/i.test(home), "Flight Evidence must not be in the homepage navigation");

for (const [label, page] of [["V4", v4], ["Thunder V2", hpr]]) {
  assert.ok(!/<meta\s+name="robots"[^>]*noindex/i.test(page), label + " must be indexable");
  assert.match(page, /href="\.\.\/\.\.\/index\.html#projects"/);
}
assert.match(evidence, /name="robots" content="noindex, nofollow"/);
assert.match(evidence, /Linked from Thunder V2 case study · noindex/);
assert.match(hpr, /href="\.\.\/thunder-v2-flight-evidence\/index\.html"/);
assert.match(evidence, /href="\.\.\/thunder-v2-hpr-flight\/index\.html"/);
assert.ok(!/PROJECT IMAGE PENDING REVIEW|pending-media|No approved PCB render or hardware photo supplied/.test(v4));
assert.match(v4, /CONCEPTUAL SYSTEM DIAGRAM/);
assert.match(v4, /V4 has not flown/);
assert.match(hpr, /measurement accuracy and specific launch linkage remain unverified/);
assert.match(evidence, /AeroTech H219T-14A, reported as adjusted with UDDT to 10 seconds/);
assert.equal((hpr.match(/class="case-media panel project-photo/g) || []).length, 2, "Keep both approved project photographs");
assert.ok(!/<img\b|<video\b/i.test(evidence), "Evidence page must not embed raw media");

const routes = [
  ["index.html", "./projects/v4-flight-computer/index.html"],
  ["index.html", "./projects/thunder-v2-hpr-flight/index.html"],
  ["projects/thunder-v2-hpr-flight/index.html", "../thunder-v2-flight-evidence/index.html"],
  ["projects/thunder-v2-flight-evidence/index.html", "../thunder-v2-hpr-flight/index.html"],
];
for (const [from, href] of routes) {
  const absolute = path.resolve(root, path.dirname(from), href);
  assert.ok(absolute.startsWith(root + path.sep), "Route escaped root: " + href);
  assert.ok(fs.statSync(absolute).isFile(), "Missing route file: " + href);
}
console.log("PASS: R2-A case-study publication scope, backlinks, index policy, placeholders, and file routes");
