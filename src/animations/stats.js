/**
 * STATS STRIP
 *
 * When the card scrolls into view (or straight away if it's already
 * visible on load), it rises in and each number counts up from 0.
 *
 * Targets: .stats__card, .stat, [data-count]
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

  const tl = gsap.timeline({
    scrollTrigger: { trigger: card, start: "top 92%", once: true },
    // if it's already on screen at load, wait for the hero cards to land first
    delay: card.getBoundingClientRect().top < window.innerHeight ? 1.4 : 0,
  });

  tl.from(card, { y: 60, autoAlpha: 0, duration: 1, ease: "power3.out" })
    .from(stats, { y: 20, autoAlpha: 0, duration: 0.7, stagger: CONFIG.stagger, ease: "power2.out" }, "-=0.6")
    .add(() => {
      numbers.forEach((el, i) => {
        const target = Number(el.dataset.count);
        const counter = { value: 0 };
        gsap.to(counter, {
          value: target,
          duration: CONFIG.countDuration,
          delay: i * CONFIG.stagger,
          ease: "power3.out",
          onUpdate: () => (el.textContent = Math.round(counter.value)),
        });
      });
    }, "<");
  // start numbers at 0 so there's no flash of the final value
  numbers.forEach((el) => (el.textContent = "0"));

  return tl;
}
