"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const page = path.join(root, "projects", "_template", "index.html");
const html = fs.readFileSync(page, "utf8");
const js = fs.readFileSync(path.join(root, "assets", "js", "script.js"), "utf8");
const css = fs.readFileSync(path.join(root, "assets", "css", "case-study.css"), "utf8");
const doc = fs.readFileSync(path.join(root, "docs", "case-study-template.md"), "utf8");

function all(pattern) {
  return [...html.matchAll(pattern)].map((match) => match[1]);
}
const ids = all(/\bid="([^"]+)"/g);
assert.equal(new Set(ids).size, ids.length, "Duplicate element IDs");
assert.equal((html.match(/<h1\b/g) || []).length, 1, "Exactly one H1");
assert.equal((html.match(/<main\b/g) || []).length, 1, "Exactly one main");
assert.match(html, /name="robots" content="noindex, nofollow"/);
assert.match(html, /id="main-content"/);
for (const id of ["themeToggle", "menuToggle", "navMenu", "currentYear"]) {
  assert.ok(ids.includes(id), "Shared JS hook missing: " + id);
}
for (const target of all(/\bhref="#([^"]+)"/g)) {
  assert.ok(ids.includes(target), "Missing in-page anchor: #" + target);
}
const refs = all(/\b(?:href|src)="([^"]+)"/g);
let checked = 0;
for (const ref of refs) {
  if (/^(#|https?:|mailto:)/.test(ref)) continue;
  const relativePath = ref.split("#")[0].split("?")[0];
  const full = path.resolve(path.dirname(page), relativePath);
  assert.ok(full.startsWith(root + path.sep), "File escapes repository: " + ref);
  assert.ok(fs.existsSync(full), "Missing local asset: " + ref);
  checked++;
}
assert.match(js, /href\.startsWith\("#"\)/, "Cross-page menu guard missing");
assert.match(css, /\.case-layout/);
assert.match(css, /max-width:\s*760px/);
assert.match(doc, /noindex/);
assert.ok(html.includes("Internal template"), "Template must be labeled");
assert.ok(!html.includes("V4 has not yet flown"), "Do not ship project-specific claims");
console.log("PASS: case study scaffold, " + ids.length +
  " unique IDs, " + checked + " relative files, anchors, JS hooks, noindex");
