"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const page = path.join(root, "projects", "thunder-v2-hpr-flight", "index.html");
const html = fs.readFileSync(page, "utf8");
const css = fs.readFileSync(path.join(root, "assets", "css", "hpr-flight-case-study.css"), "utf8");
const home = fs.readFileSync(path.join(root, "index.html"), "utf8");

function all(pattern) {
  return [...html.matchAll(pattern)].map((match) => match[1]);
}

function section(id) {
  const marker = `<section class="case-section" id="${id}"`;
  const start = html.indexOf(marker);
  assert.notEqual(start, -1, `Missing section body: ${id}`);
  const next = html.indexOf('<section class="case-section"', start + marker.length);
  const end = next === -1 ? html.indexOf("</article>", start) : next;
  return html.slice(start, end);
}

const ids = all(/\bid="([^"]+)"/g);
assert.equal(new Set(ids).size, ids.length, "Duplicate element IDs");
assert.equal((html.match(/<h1\b/g) || []).length, 1, "Exactly one H1");
assert.equal((html.match(/<main\b/g) || []).length, 1, "Exactly one main");
assert.match(html, /name="robots" content="noindex, nofollow"/);

const expectedSections = [
  ["overview", "Rocket Overview &amp; Design Objectives"],
  ["configuration", "Rocket Configuration"],
  ["motor-recovery", "Motor &amp; Recovery Configuration"],
  ["flight-preparation-launch", "Flight Preparation &amp; Launch"],
  ["results", "User-Reported Flight Results"],
  ["recovery-observations", "Recovery Observations &amp; Limitations"],
  ["lessons", "Engineering Challenges &amp; Lessons Learned"],
  ["next-steps-references", "Next Steps &amp; Evidence References"],
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

assert.match(html, /User-reported configuration and altitude; original flight evidence has not been checked/);
assert.ok((html.match(/User-reported/gi) || []).length >= 8, "User-reported labels must remain prominent");
const overview = section("overview");
assert.match(overview, /My Role &amp; Contributions/);
assert.match(overview, /I participated across the engineering cycle/);
assert.match(overview, /structural design and CAD/);
assert.match(overview, /fabrication and assembly of 3D-printed\s+components/);
assert.match(overview, /motor selection and delay adjustment/);
assert.match(overview, /parachute and\s+recovery-system configuration/);
assert.match(overview, /launch-day preparation and field launch\s+operations/);
assert.match(overview, /post-flight recovery inspection and analysis of the\s+available flight-data summary/);
assert.match(overview, /do not imply sole ownership of all project work/);
assert.match(section("configuration"), /I contributed to Thunder V2's structural design and CAD/);
assert.match(section("configuration"), /does not establish materials, print parameters, exact\s+as-flown mass or dimensions, or structural-test results/);
assert.match(section("motor-recovery"), /My participation included motor selection/);
assert.match(section("flight-preparation-launch"), /I participated in prelaunch preparation and field launch operations/);
assert.match(section("results"), /I participated in reviewing and analyzing the available AltimeterTwo\s+summary/);
assert.match(section("recovery-observations"), /I participated in post-flight recovery inspection/);
assert.match(section("recovery-observations"), /Original inspection\s+records and specific outcomes have not been reviewed/);
assert.match(section("lessons"), /CAD must stay connected to physical work/);
assert.match(section("lessons"), /Flight configuration is a coupled decision/);
assert.match(section("lessons"), /Operations need contemporaneous evidence/);
assert.match(section("lessons"), /A summary is not a complete flight profile/);
assert.match(html, /AeroTech H219T-14A/);
assert.match(html, /Adjusted with UDDT to 10 seconds/);
assert.match(html, /30-inch parachute/);
assert.match(html, /No JLCR used on this flight/);
assert.match(html, /2,329 ft/);
assert.match(html, /AltimeterTwo/);
assert.match(html, /original display photograph\/video and contemporaneous written record not reviewed/);
assert.match(html, /photograph or video capturing the AltimeterTwo displayed summary/);
assert.ok(!/\bexport(?:ed)?\b/i.test(html), "Do not imply AltimeterTwo export capability");
assert.match(html, /did not establish an approved preflight\s+prediction/);
assert.match(html, /No continuous measured curve is presented/);
assert.match(html, /prediction-accuracy calculation is made/);
assert.match(html, /Ambiguous typed ejection and\s+descent fields are omitted/);
assert.match(
  section("configuration"),
  /src="\.\.\/\.\.\/assets\/projects\/thunder-v2\/thunder-v2-nose-cone\.jpg"[\s\S]*alt="Black Thunder V2 nose cone displayed indoors\."[\s\S]*width="900"[\s\S]*height="1600"[\s\S]*Physical nose cone for Thunder V2\./,
);
assert.match(
  section("flight-preparation-launch"),
  /src="\.\.\/\.\.\/assets\/projects\/thunder-v2\/launch-event-team\.jpg"[\s\S]*alt="Three teammates holding a model rocket outdoors at a launch event\."[\s\S]*width="1600"[\s\S]*height="1067"[\s\S]*At a model rocket launch event with teammates\./,
);
assert.equal((html.match(/<figure class="case-media panel project-photo/g) || []).length, 2);
assert.equal((html.match(/loading="lazy"/g) || []).length, 2);
assert.equal((html.match(/decoding="async"/g) || []).length, 2);
assert.ok(!html.includes("FLIGHT PHOTO PENDING REVIEW"), "Approved launch photo must replace the pending placeholder");
assert.ok(!html.includes("No approved Thunder V2 launch photograph supplied"));
assert.match(html, /Private links, local paths, raw project files, and unapproved photographs are intentionally not published/);
assert.ok(!/2,?323\s*ft/i.test(html), "Unapproved simulation prediction must not appear");
assert.ok(!/prediction accuracy/i.test(html), "Do not present prediction accuracy");
assert.ok(!html.includes("LOC-IV"), "Unrelated rocket history must not appear");
assert.ok(!html.includes("V4 Flight Computer"), "Unrelated V4 project must not appear");
assert.ok(!html.includes("A42"), "Unrelated project must not appear");
assert.ok(!/file:\/\/|[A-Z]:\\/i.test(html), "Private local paths must not appear");
assert.ok(!home.includes("thunder-v2-hpr-flight"), "Homepage must not link the private case study");
assert.equal((html.match(/<section class="case-section"/g) || []).length, 8);
assert.match(css, /\.result-card/);
assert.match(css, /\.project-photo img/);
assert.match(css, /\.configuration-photo img/);
assert.match(css, /@media \(max-width: 760px\)/);

console.log(
  `PASS: Thunder V2 HPR case study, ${expectedSections.length} sections, ${ids.length} unique IDs, ` +
    `${localFiles} relative files, user-reported boundaries, noindex`,
);
