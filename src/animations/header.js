/**
 * HEADER + PROMO BAR
 *
 * 1. On load: header drops in, nav links stagger in, promo bar slides down.
 * 2. Mobile menu: links cascade in when the menu opens.
 *
 * Targets: .site-header, .site-nav__link, .site-header__actions .btn,
 *          .promo-bar, #mobile-menu
 */
import { gsap } from "gsap";

const CONFIG = {
  duration: 0.8,
  ease: "power3.out",
  linkStagger: 0.05,
};

export function initHeaderAnimations({ reduced }) {
  const menu = document.getElementById("mobile-menu");
  if (menu) setupMobileMenu(menu, reduced);

  if (reduced) return;

  const tl = gsap.timeline({ defaults: { ease: CONFIG.ease, duration: CONFIG.duration } });

  tl.fromTo(".site-header", { autoAlpha: 0, yPercent: -100 }, { autoAlpha: 1, yPercent: 0 })
    .from(
      ".site-header__logo, .site-nav__link, .site-header__actions .btn, .menu-toggle",
      { autoAlpha: 0, y: -12, stagger: CONFIG.linkStagger, duration: 0.6 },
      "-=0.45"
    )
    .fromTo(
      ".promo-bar",
      { autoAlpha: 0, clipPath: "inset(0 0 100% 0)" },
      { autoAlpha: 1, clipPath: "inset(0 0 0% 0)", duration: 0.7 },
      "<0.1"
    );

  return tl;
}

function setupMobileMenu(menu, reduced) {
  const links = () => menu.querySelectorAll(":scope > a, .mobile-menu__actions");

  menu.addEventListener("menu:open", () => {
    menu.hidden = false;
    if (reduced) return;
    gsap.killTweensOf([menu, ...links()]);
    gsap.fromTo(menu, { height: 0 }, { height: "auto", duration: 0.5, ease: "power3.out" });
    gsap.fromTo(
      links(),
      { autoAlpha: 0, x: -16 },
      { autoAlpha: 1, x: 0, duration: 0.45, stagger: 0.04, ease: "power2.out", delay: 0.1 }
    );
  });

  menu.addEventListener("menu:close", () => {
    if (reduced) {
      menu.hidden = true;
      return;
    }
    gsap.killTweensOf([menu, ...links()]);
    gsap.to(menu, {
      height: 0,
      duration: 0.35,
      ease: "power2.in",
      onComplete: () => {
        menu.hidden = true;
        gsap.set(menu, { clearProps: "height" });
      },
    });
  });
}
