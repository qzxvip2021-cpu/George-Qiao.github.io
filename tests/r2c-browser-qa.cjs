"use strict";

/**
 * R2-C publication QA: browser-only checks; never writes deployment files.
 * Run after: npm install --no-save --no-package-lock playwright@1.55.0
 *            npx playwright install chromium
 *            node tests/r2c-browser-qa.cjs
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const ARTIFACTS = path.resolve(process.env.R2C_QA_ARTIFACT_DIR || "qa-artifacts/r2c");
const SUBPATH = "/George-Qiao.github.io";
const WIDTHS = [320, 390, 768, 1024, 1440];
const SCHEMES = ["dark", "light"];
const ROUTES = [
  { id: "home", path: "", heading: /Engineering from the ground up/i, noindex: false },
  { id: "v4", path: "projects/v4-flight-computer/", heading: /V4 Flight Computer/i, noindex: false },
  { id: "thunder", path: "projects/thunder-v2-hpr-flight/", heading: /^Thunder V2$/, noindex: false },
  { id: "evidence", path: "projects/thunder-v2-flight-evidence/", heading: /Flight Evidence/i, noindex: true },
];
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
};

function serve(req, res) {
  let decoded;
  try {
    decoded = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    res.writeHead(400);
    res.end("Bad URL");
    return;
  }
  // Two supported preview bases: root and GitHub Pages repository subpath.
  let relative = decoded.startsWith(SUBPATH + "/")
    ? decoded.slice(SUBPATH.length + 1)
    : decoded.replace(/^\/+/, "");
  if (!relative || relative.endsWith("/")) relative += "index.html";
  const absolute = path.resolve(ROOT, relative);
  if (!absolute.startsWith(ROOT + path.sep)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  let stat;
  try {
    stat = fs.statSync(absolute);
  } catch {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  if (!stat.isFile()) {
    res.writeHead(404);
    res.end("Not a file");
    return;
  }
  res.writeHead(200, {
    "Content-Type": MIME[path.extname(absolute).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(absolute).pipe(res);
}

function routeURL(base, route) {
  return base + route;
}

function samePath(actual, expected) {
  assert.equal(new URL(actual).pathname, new URL(expected).pathname);
}

async function verifyRoute(page, base, route, width, scheme, screenshots, label) {
  const url = routeURL(base, route.path);
  const response = await page.goto(url, { waitUntil: "load" });
  assert.equal(response.status(), 200, label + ": HTTP 200");
  assert.equal(await page.locator("h1").count(), 1, label + ": one H1");
  assert.equal(await page.locator("main").count(), 1, label + ": one main");
  const heading = (await page.locator("h1").innerText()).replace(/\s+/g, " ").trim();
  assert.match(heading, route.heading, label + ": page title");
  assert.equal(await page.locator("html").getAttribute("data-theme"), scheme, label + ": theme");

  const robotsMeta = page.locator('meta[name="robots"]');
  // Public indexable pages have no robots meta. Avoid Playwright's 30-second
  // locator timeout before treating an absent optional tag as null.
  const robots = (await robotsMeta.count())
    ? await robotsMeta.first().getAttribute("content")
    : null;
  if (route.noindex) {
    assert.match(robots || "", /noindex/i, label + ": evidence noindex");
  } else {
    assert.ok(!/noindex/i.test(robots || ""), label + ": public page indexable");
  }
  const dimensions = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  assert.ok(
    dimensions.scroll <= dimensions.viewport + 1,
    label + ": horizontal overflow " + JSON.stringify(dimensions),
  );
  if (route.id === "thunder") {
    const images = page.locator("img");
    assert.equal(await images.count(), 2, label + ": approved photograph count");
    for (let i = 0; i < 2; i += 1) {
      const image = images.nth(i);
      // These approved photos intentionally use loading="lazy". Trigger loading
      // by scrolling before waiting for decode, rather than treating offscreen
      // images as failed HTTP requests.
      await image.scrollIntoViewIfNeeded({ timeout: 15000 });
      await image.evaluate((img) => Promise.race([
        img.decode(),
        new Promise((_, reject) => setTimeout(
          () => reject(new Error(
            "Photo decode exceeded 12s: " + img.currentSrc +
            " complete=" + img.complete + " width=" + img.naturalWidth
          )), 12000
        )),
      ]));
      const state = await image.evaluate((img) => ({
        complete: img.complete,
        width: img.naturalWidth,
        alt: img.getAttribute("alt"),
      }));
      assert.ok(state.complete && state.width > 0 && state.alt,
        label + ": approved photo decoded with alt");
    }
  }
  if (route.id === "v4") {
    assert.equal(await page.getByText("PROJECT IMAGE PENDING REVIEW").count(), 0);
    assert.ok((await page.locator("body").innerText()).includes("V4 has not flown"));
  }
  if (route.id === "evidence") {
    assert.equal(await page.locator('[data-readout="peak-altitude"]').count(), 1);
    assert.equal(await page.locator(".readout-card").count(), 10);
    assert.equal(await page.locator(".snapshot-card").count(), 2);
  }
  if ((width === 1440 && scheme === "light") ||
      (width === 390 && scheme === "dark")) {
    const filename = path.join(
      ARTIFACTS,
      (base.includes(SUBPATH) ? "subpath" : "root") +
        "-" + route.id + "-" + width + "-" + scheme + ".png",
    );
    await page.screenshot({ path: filename, fullPage: true });
    screenshots.push(filename);
  }
}

async function testLinkJourney(page, base) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base, { waitUntil: "load" });
  await page.getByRole("link", { name: "Read V4 case study" }).click();
  samePath(page.url(), base + "projects/v4-flight-computer/index.html");
  await page.getByRole("link", { name: "Back to projects" }).click();
  samePath(page.url(), base + "index.html#projects");

  await page.goto(base, { waitUntil: "load" });
  await page.getByRole("link", { name: "Read Thunder V2 case study" }).click();
  samePath(page.url(), base + "projects/thunder-v2-hpr-flight/index.html");
  await page.getByRole("link", {
    name: "View full AltimeterTwo readouts and simulation snapshots",
  }).click();
  samePath(page.url(), base + "projects/thunder-v2-flight-evidence/index.html");
  const robots = await page.locator('meta[name="robots"]').getAttribute("content");
  assert.match(robots, /noindex/i);
  await page.getByRole("link", { name: "Back to Thunder V2 case study" }).click();
  samePath(page.url(), base + "projects/thunder-v2-hpr-flight/index.html");
}

async function testSharedUI(page, base) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base, { waitUntil: "load" });
  const menu = page.locator("#menuToggle");
  assert.equal(await page.locator("#navMenu").isVisible(), false);
  await menu.click();
  assert.equal(await menu.getAttribute("aria-expanded"), "true");
  assert.equal(await page.locator("#navMenu").isVisible(), true);
  await page.keyboard.press("Escape");
  assert.equal(await menu.getAttribute("aria-expanded"), "false");
  assert.equal(await menu.evaluate((node) => node === document.activeElement), true);

  await menu.click();
  await page.locator("#navMenu").getByRole("link", { name: "Projects" }).click();
  assert.equal(await page.locator("#navMenu").isVisible(), false);
  assert.equal(new URL(page.url()).hash, "#projects");

  const current = await page.locator("html").getAttribute("data-theme");
  await page.locator("#themeToggle").click();
  const next = current === "dark" ? "light" : "dark";
  assert.equal(await page.locator("html").getAttribute("data-theme"), next);
  await page.reload();
  assert.equal(await page.locator("html").getAttribute("data-theme"), next);
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page.locator("html").evaluate((node) => getComputedStyle(node).scrollBehavior),
    "auto",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
}

async function testNoJavaScript(browser, base) {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    colorScheme: "light",
    viewport: { width: 390, height: 844 },
  });
  try {
    const page = await context.newPage();
    await page.goto(base, { waitUntil: "load" });
    assert.equal(await page.locator("#navMenu").isVisible(), true);
    await page.getByRole("link", { name: "Read V4 case study" }).click();
    samePath(page.url(), base + "projects/v4-flight-computer/index.html");
  } finally {
    await context.close();
  }
}

async function testBlockedStorage(browser, base) {
  const context = await browser.newContext();
  try {
    await context.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        get() { throw new Error("Storage blocked for QA"); },
      });
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base, { waitUntil: "load" });
    await page.locator("#themeToggle").click();
    assert.deepEqual(errors, [], "Storage restriction must not break theme control");
  } finally {
    await context.close();
  }
}

async function main() {
  fs.mkdirSync(ARTIFACTS, { recursive: true });
  const server = http.createServer(serve);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  let browser;
  try {
    const { port } = server.address();
    const origin = "http://127.0.0.1:" + port;
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
    const screenshots = [];
    const errors = [];
    let scenarios = 0;
    for (const prefix of ["", SUBPATH]) {
      const base = origin + prefix + "/";
      for (const scheme of SCHEMES) {
        const context = await browser.newContext({
          colorScheme: scheme,
          viewport: { width: 1440, height: 900 },
        });
        try {
          const page = await context.newPage();
          page.on("pageerror", (err) => errors.push("pageerror: " + err.message));
          page.on("console", (msg) => {
            if (msg.type() === "error") errors.push("console: " + msg.text());
          });
          page.on("requestfailed", (req) => errors.push("request failed: " + req.url()));
          page.on("response", (res) => {
            if (res.url().startsWith(origin) && res.status() >= 400)
              errors.push("HTTP " + res.status() + " " + res.url());
          });
          for (const width of WIDTHS) {
            await page.setViewportSize({ width, height: 844 });
            for (const route of ROUTES) {
              const label = [prefix || "root", scheme, width, route.id].join("/");
              console.log("R2-C BEGIN " + label);
              await verifyRoute(page, base, route, width, scheme, screenshots, label);
              scenarios += 1;
              if (scenarios % 10 === 0)
                console.log("R2-C progress: " + scenarios + "/80 scenarios completed");
            }
          }
          await testLinkJourney(page, base);
          await testSharedUI(page, base);
          const templateResponse = await page.goto(base + "projects/_template/");
          assert.equal(templateResponse.status(), 200);
          assert.match(await page.locator('meta[name="robots"]').getAttribute("content"), /noindex/i);
        } finally {
          await context.close();
        }
      }
      await testNoJavaScript(browser, base);
      await testBlockedStorage(browser, base);
    }
    assert.deepEqual(errors, [], "No JS, console, request or HTTP errors");
    assert.equal(scenarios, 80, "Two prefixes x two schemes x five widths x four pages");
    console.log(JSON.stringify({
      result: "PASS",
      baseCommit: process.env.R2C_BASE_SHA || "checked-out GitHub commit",
      scenarios,
      routes: ROUTES.map((x) => x.id),
      widths: WIDTHS,
      schemes: SCHEMES,
      prefixes: ["/", SUBPATH + "/"],
      navigation: "V4 / Thunder V2 / Flight Evidence and return links",
      behavior: "mobile menu, theme persistence, reduced motion, no-JS, blocked storage",
      images: "two approved Thunder V2 photographs load",
      screenshots: screenshots.length,
      errors: errors.length,
    }, null, 2));
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error("R2-C Browser QA FAILED");
  console.error(error);
  process.exitCode = 1;
});
