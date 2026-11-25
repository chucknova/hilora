/**
 * STATS STRIP
 *
 * Entrance (when the card scrolls into view, or straight away if it's
 * already visible on load):
 *   1. The card rises in, then each stat fades up.
 *   2. Each number counts up from 0; as it lands, a short coral rule draws
 *      in beneath it.
 *
 * Targets: .stats__card, .stat, [data-count], .stat__underline
 */
import { gsap } from "gsap";

const CONFIG = {
  countDuration: 2,
  stagger: 0.12,
};

export function initStatsAnimations() {
  const card = document.querySelector(".stats__card");
  if (!card) return;

  const stats = card.querySelectorAll(".stat");
  const numbers = card.querySelectorAll("[data-count]");
  const underlines = card.querySelectorAll(".stat__underline");

  // start state: numbers at 0 (no flash of the final value), rules undrawn
  numbers.forEach((el) => (el.textContent = "0"));
  gsap.set(underlines, { scaleX: 0 });

  const tl = gsap.timeline({
    scrollTrigger: { trigger: card, start: "top 92%", once: true },
    // if it's already on screen at load, wait for the hero cards to land first
    delay: card.getBoundingClientRect().top < window.innerHeight ? 1.4 : 0,
  });

  tl.from(card, { y: 60, autoAlpha: 0, duration: 1, ease: "power3.out" }).from(
    stats,
    { y: 20, autoAlpha: 0, duration: 0.7, stagger: CONFIG.stagger, ease: "power2.out" },
    "-=0.6"
  );

  numbers.forEach((el, i) => {
    const counter = { value: 0 };
    const at = 0.4 + i * CONFIG.stagger;
    tl.to(
      counter,
      {
        value: Number(el.dataset.count),
        duration: CONFIG.countDuration,
        ease: "power3.out",
        onUpdate: () => (el.textContent = Math.round(counter.value)),
      },
      at
    )
      // the rule draws in as the count settles
      .to(underlines[i], { scaleX: 1, duration: 0.6, ease: "power3.out" }, at + CONFIG.countDuration * 0.55);
  });

  return tl;
}
