# Portfolio refresh QA

## Source checks

- `node --check assets/js/script.js`
- `node --check tests/browser-check.cjs`
- Previously completed: `python3 tests/check_site.py`: one main landmark and H1; unique IDs; all 13 links and internal anchor targets; referenced local files; safe new-tab links; no template identity, mistyped GitHub handle, private course-guide reference, or unsupported graduation metadata. The final Windows browser-QA environment did not have Python, so this check was not rerun there.
- `git diff --check`
- Independent source review of content provenance, semantic structure, menu logic, theme storage fallback, and reduced-motion styles
- Contrast calculations corrected the primary button background to `#7060df` and light-theme heading gradient endpoint to `#8755a9`

## Browser QA: passed locally

`tests/browser-check.cjs` completed successfully in a local Windows environment using Playwright 1.55.0 with the installed Google Chrome executable. The site was served from the repository root at `http://127.0.0.1:8000`.

The passing suite covers:

- Full-page desktop and mobile screenshots in both dark and light themes, plus mobile open-menu and no-JavaScript captures
- Horizontal-overflow checks at 320, 390, 768, 1024, and 1440px
- Theme switching and persistence across reloads
- Repeated menu open/close cycles, Escape dismissal with focus restoration, outside-click dismissal, section selection, and desktop/mobile resize transitions
- Native anchor navigation and back/forward history
- Keyboard skip-link behavior and reduced-motion styles
- No-JavaScript content/navigation and blocked-`localStorage` resilience
- Legacy contact redirect
- Public GitHub profile and Rocket Flight Solver links returning HTTP 200
- Zero page errors, console errors, or HTTP responses at status 400 or above

Final screenshots were visually inspected. The review found and corrected a mobile text-spacing issue where hiding the education-card line break caused “Mater DeiHigh School”; it now renders and reads as “Mater Dei High School.” The resize test was also made deterministic by waiting for the media-query handler before asserting menu visibility.

Committed visual evidence:

- [Desktop dark](screenshots/desktop-dark.png)
- [Desktop light](screenshots/desktop-light.png)
- [Mobile dark](screenshots/mobile-dark.png)
- [Mobile light](screenshots/mobile-light.png)

## Content boundaries

- Class of 2028, aerospace focus, V4 priority, and ARC competition details are user-confirmed
- V4 is described as in development and not flown; no firmware, bench-test, manufacturing, or flight-readiness success is claimed
- Rocket Flight Solver links to its public source code, not an unverified live deployment
- No portrait or resume is represented; neither has been supplied for publication
- The private course-guide project is not featured
- Existing legacy asset files are retained but unreferenced; template identity/project configuration is removed
- Repository settings, hosting settings, DNS, infrastructure, and the main branch are unchanged
