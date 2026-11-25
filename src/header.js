/**
 * Header behaviour (not animation-library dependent):
 *  - adds a shadow once the page is scrolled
 *  - mobile menu toggle
 */
export function initHeader() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.getElementById("mobile-menu");
  if (!header) return;

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      // Animation for the open/close lives in animations/header.js
      menu.dispatchEvent(new CustomEvent(open ? "menu:open" : "menu:close"));
    });
  }
}
