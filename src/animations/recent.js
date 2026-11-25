/**
 * RECENTLY VERIFIED PROFESSIONALS
 *
 * Scroll-in (once, when the section reaches 75% of the viewport):
 *   1. Eyebrow, headline lines and lead text reveal; "See all" button fades in.
 *   2. Cards rise in one after another.
 *   3. As each card lands, its "Verified" badge stamps on (scale + sheen),
 *      the avatar settles and the chips pop in — "recently verified".
 *
 * Hover (pointer devices): a sheen sweeps across the card's "Verified" badge.
 * Card lift and button hovers are CSS (recent.css).
 *
 * Save button (all devices): toggles Save ⇄ Saved. Saving drops the bookmark
 * in, fills it, and gives a tiny burst; the label rolls to "Saved".
 *
 * Targets: .recent, .recent__intro > *, .btn-outline-lg, .pro-card,
 *          .pro-card__verified, .pro-card__avatar, .pro-card__chips li, .save-btn
 */
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { sheen } from "./utils.js";

const CONFIG = {
  start: "top 75%",
  cardStagger: 0.12,
  burst: { count: 6, distance: 16, color: "#0D0D5E" },
};

export function initRecentAnimations({ canHover }) {
  const section = document.querySelector(".recent");
  if (!section) return;
  gsap.set(section, { autoAlpha: 1 });

  const cards = [...section.querySelectorAll(".pro-card")];
  const split = SplitText.create(section.querySelector(".section-head__title"), {
    type: "lines",
    mask: "lines",
  });

  const tl = gsap.timeline({
    scrollTrigger: { trigger: section, start: CONFIG.start, once: true },
    defaults: { ease: "power3.out" },
  });

  // 1. Heading
  tl.from(section.querySelector(".section-head__eyebrow"), { y: 16, autoAlpha: 0, duration: 0.7 })
    .from(split.lines, { yPercent: 105, duration: 1, stagger: 0.1, ease: "power4.out" }, 0.1)
    .from(section.querySelector(".section-head__lead"), { y: 20, autoAlpha: 0, duration: 0.8 }, 0.3)
    .from(section.querySelector(".btn-outline-lg"), { x: 24, autoAlpha: 0, duration: 0.8 }, 0.35);

  // 2 + 3. Cards, then each card's details
  cards.forEach((card, i) => {
    const at = 0.45 + i * CONFIG.cardStagger;
    const badge = card.querySelector(".pro-card__verified");
    // clearProps hands transform back to CSS so the hover lift works afterwards
    tl.from(card, { y: 50, autoAlpha: 0, duration: 0.9, ease: "expo.out", clearProps: "transform" }, at)
      .from(card.querySelector(".pro-card__avatar"), { y: 12, autoAlpha: 0, duration: 0.6 }, at + 0.2)
      .from(badge, { scale: 0.5, autoAlpha: 0, duration: 0.5, ease: "back.out(2.4)" }, at + 0.45)
      .add(() => sheen(badge, { duration: 0.9 }), at + 0.6)
      .from(card.querySelectorAll(".pro-card__chips li"), { y: 8, autoAlpha: 0, duration: 0.4, stagger: 0.06 }, at + 0.4);
  });

  if (canHover) {
    cards.forEach((card) => {
      const badge = card.querySelector(".pro-card__verified");
      let busy = false;
      card.addEventListener("pointerenter", () => {
        if (busy) return;
        busy = true;
        sheen(badge, { duration: 0.8 }).eventCallback("onComplete", () => {
          busy = false;
        });
      });
    });
  }

  return tl;
}

/**
 * Save ⇄ Saved toggle. Works with or without motion; `animate` adds the flourish.
 */
let animateSave = true;

export function initSaveButtons({ animate }) {
  animateSave = animate; // init can re-run when motion settings change; listeners are bound once
  document.querySelectorAll(".save-btn").forEach((btn) => {
    if (btn.dataset.saveBound) return;
    btn.dataset.saveBound = "true";
    const icon = btn.querySelector(".save-btn__icon");
    const label = btn.querySelector(".save-btn__label");

    btn.addEventListener("click", () => {
      const saved = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", String(saved));

      if (!animateSave) {
        label.textContent = saved ? "Saved" : "Save";
        return;
      }

      // label rolls out and the new word rolls in
      gsap
        .timeline()
        .to(label, { yPercent: -60, autoAlpha: 0, duration: 0.15, ease: "power2.in" })
        .call(() => (label.textContent = saved ? "Saved" : "Save"))
        .fromTo(label, { yPercent: 60 }, { yPercent: 0, autoAlpha: 1, duration: 0.25, ease: "power2.out" });

      if (saved) {
        gsap.fromTo(icon, { y: -6, scale: 0.7 }, { y: 0, scale: 1, duration: 0.5, ease: "back.out(3)" });
        burst(btn, icon);
      } else {
        gsap.fromTo(icon, { scale: 0.85 }, { scale: 1, duration: 0.3, ease: "power2.out" });
      }
    });
  });
}

// A few tiny dots popping out around the bookmark
function burst(btn, icon) {
  const { count, distance, color } = CONFIG.burst;
  const b = btn.getBoundingClientRect();
  const r = icon.getBoundingClientRect();
  const cx = r.left + r.width / 2 - b.left;
  const cy = r.top + r.height / 2 - b.top;
  btn.style.position = "relative";

  for (let i = 0; i < count; i++) {
    const dot = document.createElement("span");
    dot.setAttribute("aria-hidden", "true");
    Object.assign(dot.style, {
      position: "absolute",
      left: `${cx - 2}px`,
      top: `${cy - 2}px`,
      width: "4px",
      height: "4px",
      borderRadius: "50%",
      background: color,
      pointerEvents: "none",
    });
    btn.appendChild(dot);
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    gsap
      .timeline({ onComplete: () => dot.remove() })
      .fromTo(
        dot,
        { x: 0, y: 0, scale: 1 },
        {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          scale: 0,
          duration: 0.5,
          ease: "power2.out",
        }
      );
  }
}
