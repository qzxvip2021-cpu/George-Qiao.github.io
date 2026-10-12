# V2 Case Study Foundation — authoring guide

**Status:** Gate 1 scaffold only. This is not an approved V4/HPR case study and is not linked from the V1 homepage.

## Architecture

- The V1 home page remains the main entry point; this gate does not edit `index.html`.
- `projects/_template/index.html` is the **non-public, noindex** template for future project pages.
- `assets/css/case-study.css` adds only page-specific styling; global tokens, header, theme, reduced-motion settings, and basic typography come from `assets/css/style.css`.
- `assets/js/script.js` is shared. Its mobile menu now safely handles links pointing back to home-page anchors.
- Paths are relative and support GitHub Pages' repository subpath (`/George-Qiao.github.io/`).

## Creating a new case study

1. Copy `projects/_template/index.html` into `projects/<approved-slug>/index.html`. Keep this exact nesting depth, or adjust every relative asset/home link.
2. Replace **every** square-bracket placeholder with source-backed, user-approved content. Include accurate roles, version/revision, status, and dates.
3. Add authentic images/media with attribution, meaningful `alt` text, privacy review, and optimized formats. Remove the placeholder illustration and its cautionary caption.
4. Keep simulation/model output distinct from real measurements. Don't infer a flight time series from a summary, and don't call a design ready or flight-proven without evidence.
5. Populate the sources and verification section with truthful references, including what remains untested. Treat manufacturing-package consistency as distinct from hardware testing.
6. Only after content and permissions pass review: remove the internal notice and `noindex, nofollow`, update the page metadata/title, and add a link from the appropriate homepage project card.
7. Have a reviewer approve new project facts, images, personal info, and external links **before** publication.

## Local validation

From the repository root:

```sh
node --check assets/js/script.js
node tests/case-study-check.cjs
python3 -m http.server 8000
```

Preview `http://127.0.0.1:8000/projects/_template/` (not the public website).

Browser checks should cover:
- Desktop/mobile layouts at 320, 390, 768, 1024, and 1440 px; dark and light themes.
- Theme preference shared with the homepage and persisted after reload; blocked storage fallback.
- Mobile menu opening, Escape, outside click, navigation back to homepage, and keyboard focus.
- In-page TOC, back-to-projects link, keyboard skip link, and no-JavaScript content/navigation.
- No overflow, broken relative paths, HTTP errors, or browser-console errors.

Do not merge the foundation template or place its placeholders on the live homepage. Gate 2 will supply verified content separately.
