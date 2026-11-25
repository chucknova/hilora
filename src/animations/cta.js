/**
 * GET STARTED (CTA) + FOOTER
 *
 * CTA scroll-in (once, at 75% of the viewport):
 *   1. Eyebrow + title reveal.
 *   2. The two cards rise in.
 *   3. The browser mock slides up into the employer card, the results load in
 *      row by row and "86 verified" counts up.
 *   Then the results list steps up one row every few seconds, like new
 *   verified profiles arriving. It pauses while the card is hovered and while
 *   the section is off-screen.
 *
 * Footer (once, at 90% of the viewport): brand block, link columns and the
 * copyright line fade up in turn. Link hover underline is CSS.
 *
 * Targets: .cta, .cta-card, .mock, .mock__row, .mock__track, [data-count],
 *          .site-footer__brand, .site-footer__col, .site-footer__copy
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { countUp } from "./utils.js";

const CONFIG = {
  start: "top 75%",
  rowHeight: 69, // matches .mock__row height in cta.css
  step: { duration: 0.7, hold: 2.2 },
};

export function initCtaAnimations() {
  const section = document.querySelector(".cta");
  if (!section) return;
  gsap.set(section, { autoAlpha: 1 });

  const cards = section.querySelectorAll(".cta-card");
  const mock = section.querySelector(".mock");
  const track = mock.querySelector(".mock__track");
  const rows = [...track.children].filter((r) => !r.hasAttribute("aria-hidden"));
  const count = mock.querySelector("[data-count]");
  const split = SplitText.create(section.querySelector(".section-head__title"), { type: "lines", mask: "lines" });

  // duplicate the rows once so the list can loop seamlessly (guarded: init can re-run)
  if (!track.dataset.looped) {
    track.dataset.looped = "true";
    rows.forEach((row) => {
      const clone = row.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    });
  }
  count.textContent = "0";

  const ticker = createStepper(track, rows.length);

  gsap
    .timeline({
      scrollTrigger: { trigger: section, start: CONFIG.start, once: true },
      defaults: { ease: "power3.out" },
    })
    .from(section.querySelector(".section-head__eyebrow"), { y: 16, autoAlpha: 0, duration: 0.7 })
    .from(split.lines, { yPercent: 105, duration: 1, ease: "power4.out" }, 0.1)
    .from(cards, { y: 50, autoAlpha: 0, duration: 0.9, stagger: 0.12, ease: "expo.out", clearProps: "transform" }, 0.3)
    .from(mock, { x: 60, y: 50, autoAlpha: 0, duration: 1, ease: "expo.out" }, 0.75)
    .from(rows, { y: 14, autoAlpha: 0, duration: 0.5, stagger: 0.12 }, 1.1)
    .add(countUp(count, Number(count.dataset.count), { duration: 1.2 }), 1.0)
    .add(() => ticker.start(), 2.2);

  // pause while hovered or off-screen
  const employerCard = section.querySelector(".cta-card--employers");
  employerCard.addEventListener("pointerenter", () => ticker.setHovered(true));
  employerCard.addEventListener("pointerleave", () => ticker.setHovered(false));
  ScrollTrigger.create({
    trigger: section,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => ticker.setOnScreen(self.isActive),
  });
}

// Steps the list up one row at a time, then jumps back invisibly (the rows are duplicated)
function createStepper(track, count) {
  const { duration, hold } = CONFIG.step;
  const tl = gsap.timeline({ paused: true, repeat: -1 });
  for (let i = 1; i <= count; i++) {
    tl.to(track, { y: -CONFIG.rowHeight * i, duration, ease: "power3.inOut" }, `+=${hold}`);
  }
  tl.set(track, { y: 0 });

  let started = false;
  let hovered = false;
  let onScreen = true;
  const sync = () => (started && !hovered && onScreen ? tl.play() : tl.pause());
  return {
    start() {
      started = true;
      sync();
    },
    setHovered(v) {
      hovered = v;
      sync();
    },
    setOnScreen(v) {
      onScreen = v;
      sync();
    },
  };
}

export function initFooterAnimations() {
  const footer = document.querySelector(".site-footer");
  if (!footer) return;
  gsap.set(footer, { autoAlpha: 1 });
  gsap.from(
    [footer.querySelector(".site-footer__brand"), ...footer.querySelectorAll(".site-footer__col"), footer.querySelector(".site-footer__copy")],
    {
      y: 24,
      autoAlpha: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: { trigger: footer, start: "top 90%", once: true },
    }
  );
}
