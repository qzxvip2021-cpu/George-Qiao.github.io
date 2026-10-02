/* Progressive enhancements: content and navigation work without JavaScript. */
(() => {
  "use strict";
  const root = document.documentElement;
  const themeButton = document.getElementById("themeToggle");
  const themePreference = window.matchMedia("(prefers-color-scheme: light)");
  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem("theme");
  } catch {
    /* Storage can be unavailable in private contexts. */
  }
  function applyTheme(theme) {
    root.dataset.theme = theme;
    themeButton.setAttribute(
      "aria-label",
      `Switch to ${theme === "dark" ? "light" : "dark"} theme`,
    );
    document.querySelector('meta[name="theme-color"]').content =
      theme === "dark" ? "#101117" : "#f7f7fb";
  }
  applyTheme(
    ["light", "dark"].includes(savedTheme)
      ? savedTheme
      : themePreference.matches
        ? "light"
        : "dark",
  );
  themeButton.hidden = false;
  themeButton.addEventListener("click", () => {
    savedTheme = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(savedTheme);
    try {
      localStorage.setItem("theme", savedTheme);
    } catch {
      /* Theme still works for this visit. */
    }
  });
  themePreference.addEventListener("change", (event) => {
    if (!savedTheme) applyTheme(event.matches ? "light" : "dark");
  });

  const menuButton = document.getElementById("menuToggle");
  const menu = document.getElementById("navMenu");
  const mobile = window.matchMedia("(max-width: 760px)");
  let open = false;
  function setMenu(next, restoreFocus = false) {
    open = next;
    menu.hidden = mobile.matches && !open;
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute(
      "aria-label",
      open ? "Close navigation menu" : "Open navigation menu",
    );
    menuButton.querySelector("span").textContent = open ? "−" : "+";
    if (restoreFocus) menuButton.focus();
  }
  menuButton.hidden = false;
  setMenu(false);
  menuButton.addEventListener("click", () => setMenu(!open));
  mobile.addEventListener("change", () => setMenu(false));
  menu.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) return;
    setMenu(false);
    const target = document.querySelector(link.getAttribute("href"));
    if (target) {
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && open) setMenu(false, true);
  });
  document.addEventListener("click", (event) => {
    if (open && !event.target.closest(".nav")) setMenu(false);
  });
  document.getElementById("currentYear").textContent = String(
    new Date().getFullYear(),
  );
})();
