# Portfolio refresh QA

## Passed source checks

- `node --check assets/js/script.js`
- `node --check tests/browser-check.cjs`
- `python3 tests/check_site.py`: one main landmark and H1; unique IDs; all 13 links and internal anchor targets; referenced local files; safe new-tab links; no template identity, mistyped GitHub handle, private course-guide reference, or unsupported graduation metadata
- `git diff --check`
- Independent source review of content provenance, semantic structure, menu logic, theme storage fallback, and reduced-motion styles
- Contrast calculations corrected the primary button background to `#7060df` and light-theme heading gradient endpoint to `#8755a9`

## Browser QA: blocked, not passed

Desktop/mobile Chromium launch was attempted using Playwright and agent-browser in the cloud environment, including approved execution escalation. The environment denies the Unix-domain socket Chromium requires for its process singleton (`socket() failed: Operation not permitted`). The supported cloud browser also could not open the local preview URL (`ERR_BLOCKED_BY_CLIENT`). No browser screenshot or rendered-layout result was obtained.

`tests/browser-check.cjs` contains the intended executable browser regression suite. It has **not completed** in this environment. It covers desktop/mobile screenshots, 320–1440px overflow checks, navigation, theme persistence, repeated menu interactions, Escape/outside dismissal, keyboard skip link, reduced motion, no-JavaScript access, blocked storage, and the legacy contact redirect. Run it in a browser-capable environment before marking the PR ready.

## Content boundaries

- Class of 2028, aerospace focus, V4 priority, and ARC competition details are user-confirmed
- V4 is described as in development and not flown; no firmware, bench-test, manufacturing, or flight-readiness success is claimed
- Rocket Flight Solver links to its public source code, not an unverified live deployment
- No portrait or resume is represented; neither has been supplied for publication
- The private course-guide project is not featured
- Existing legacy asset files are retained but unreferenced; template identity/project configuration is removed
- Repository settings, hosting settings, DNS, infrastructure, and the main branch are unchanged
