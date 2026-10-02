# George Qiao — Engineering Portfolio

A responsive, dependency-free portfolio about rocketry, avionics, simulation, and hands-on engineering. Built with semantic HTML, CSS, and a small progressive-enhancement JavaScript file.

## Local preview

From the repository root:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. There is no build step or package installation. Both the content and section links remain usable without JavaScript.

## Editing

- `index.html`: biography, project cards, contact links, and search/social metadata
- `assets/css/style.css`: responsive layout, dark/light tokens, and reduced-motion behavior
- `assets/js/script.js`: theme preference, accessible mobile navigation, and current year
- `assets/ele/favicon.svg`: initials-based site icon
- `assets/nexus-card/index.html`: compatibility redirect from the old template contact card

The simulation project links to its public source-code repository. V4 and ARC are conservative overviews with clearly labeled documentation placeholders. The portfolio does not claim a live service, V4 flight testing, certifications, or unsupported project metrics. ARC placement and leadership details are user-confirmed. Keep descriptions tied to verifiable work, and obtain approval before adding personal information or images.

## Content awaiting review

- Expand V4 design documentation and add approved ARC competition photos or a detailed case study
- Select the most important projects and add accurate case studies, screenshots, and results
- Supply an approved portrait and current resume before adding a portrait or resume download

Unreferenced legacy image/PDF assets are retained to avoid losing existing files. They are not used as George's photo, project evidence, or resume. The former template project data and contact-card configuration have been removed to avoid attributing another person's projects and contact information to George.

## Verification

```sh
node --check assets/js/script.js
python3 tests/check_site.py
```

For browser verification, serve the root as above and check desktop and mobile widths, keyboard navigation, menu dismissal (Escape, outside click, and section selection), theme persistence, reduced motion, no-JavaScript access, and absence of overflow or failed local requests. `tests/browser-check.cjs` can be run with Playwright available (`node tests/browser-check.cjs`); screenshots are written outside the repository by default.

## Origin and license

This site was adapted from the [rushhiii portfolio template](https://github.com/rushhiii/portfolio). The refreshed design retains the original dark/light, indigo-accented, card-based direction while removing template-specific identity and project claims. See `LICENSE` for the repository's existing license. No deployment or repository settings are changed by this refresh.
