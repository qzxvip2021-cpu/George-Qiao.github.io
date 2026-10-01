/* Run with Playwright installed; no npm dependencies are needed by the site. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  const out = process.env.SCREENSHOT_DIR || "/tmp/portfolio-qa";
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const errors = [],
    badResponses = [];
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "dark",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("response", (r) => {
    if (r.status() >= 400) badResponses.push(`${r.status()} ${r.url()}`);
  });
  await page.goto("http://127.0.0.1:8000");
  await assert.equal(await page.locator("h1").count(), 1);
  await page.screenshot({ path: `${out}/desktop-dark.png`, fullPage: true });
  await page.getByRole("link", { name: "Explore my work" }).click();
  await page.waitForURL("**/#projects");
  assert.equal(await page.locator("#projects").isVisible(), true);
  await page
    .getByRole("link", { name: "George Qiao, home", exact: true })
    .click();
  await page.waitForURL("**/#home");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await page.reload();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
  await page.screenshot({ path: `${out}/desktop-light.png`, fullPage: true });
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    const dimensions = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: innerWidth,
    }));
    assert.ok(
      dimensions.scroll <= dimensions.width,
      `overflow at ${width}: ${JSON.stringify(dimensions)}`,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:8000");
  const menu = page.getByRole("button", { name: "Open navigation menu" });
  await menu.click();
  assert.equal(
    await page.locator("#menuToggle").getAttribute("aria-expanded"),
    "true",
  );
  await page.screenshot({ path: `${out}/mobile-menu.png` });
  await page.keyboard.press("Escape");
  assert.equal(
    await page.locator("#menuToggle").getAttribute("aria-expanded"),
    "false",
  );
  assert.equal(
    await page
      .locator("#menuToggle")
      .evaluate((e) => e === document.activeElement),
    true,
  );
  await menu.click();
  await page.locator("h1").click();
  assert.equal(await page.locator("#navMenu").isVisible(), false);
  await menu.click();
  await page
    .locator("#navMenu")
    .getByRole("link", { name: "Projects", exact: true })
    .click();
  await page.waitForURL("**/#projects");
  assert.equal(await page.locator("#navMenu").isVisible(), false);
  assert.equal(
    await page
      .locator("#projects")
      .evaluate((e) => e === document.activeElement),
    true,
  );
  await page.goBack();
  await page.goForward();
  assert.ok(page.url().endsWith("#projects"));
  await page.goto("http://127.0.0.1:8000");
  await page.screenshot({ path: `${out}/mobile-dark.png`, fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  assert.equal(await page.locator("#navMenu").isVisible(), true);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.locator("#navMenu").isVisible(), false);
  await page.goto("http://127.0.0.1:8000");
  await page.keyboard.press("Tab");
  assert.equal(
    await page
      .locator(".skip-link")
      .evaluate((e) => e === document.activeElement),
    true,
  );
  await page.keyboard.press("Enter");
  assert.equal(
    await page.locator("main").evaluate((e) => e === document.activeElement),
    true,
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page
      .locator("html")
      .evaluate((e) => getComputedStyle(e).scrollBehavior),
    "auto",
  );
  const nojs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
    colorScheme: "light",
  });
  const nojsPage = await nojs.newPage();
  await nojsPage.goto("http://127.0.0.1:8000");
  assert.equal(await nojsPage.locator("#navMenu").isVisible(), true);
  assert.equal(await nojsPage.locator(".project-card").count(), 3);
  await nojsPage
    .locator("#navMenu")
    .getByRole("link", { name: "Projects", exact: true })
    .click();
  await nojsPage.waitForURL("**/#projects");
  await nojsPage.screenshot({
    path: `${out}/mobile-no-js.png`,
    fullPage: true,
  });
  const privateContext = await browser.newContext();
  await privateContext.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage blocked");
      },
    });
  });
  const privatePage = await privateContext.newPage();
  const storageErrors = [];
  privatePage.on("pageerror", (e) => storageErrors.push(e.message));
  await privatePage.goto("http://127.0.0.1:8000");
  await privatePage.locator("#themeToggle").click();
  assert.deepEqual(storageErrors, []);
  await page.goto("http://127.0.0.1:8000/assets/nexus-card/");
  await page.waitForURL("**/index.html#contact");
  assert.deepEqual(errors, []);
  assert.deepEqual(badResponses, []);
  console.log(
    JSON.stringify(
      {
        result: "PASS",
        tests: [
          "desktop/mobile layout",
          "320/390/768/1024/1440 no overflow",
          "light/dark persistence",
          "menu repeated open, Escape, outside click, section selection, resize",
          "native anchor and back/forward navigation",
          "keyboard skip link",
          "reduced motion",
          "no-JavaScript content/navigation",
          "blocked localStorage",
          "legacy contact redirect",
          "zero console errors or HTTP failures",
        ],
        screenshots: out,
      },
      null,
      2,
    ),
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
