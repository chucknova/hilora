/**
 * MAGNETIC BUTTON (reusable)
 *
 * The element is gently pulled toward the cursor while hovered, and its
 * label moves a little further for a layered feel. Springs back on leave.
 * Add `data-magnetic` to a button. Pointer devices only (see index.js).
 */
import { gsap } from "gsap";

const CONFIG = {
  strength: 0.25, // how far the button follows the cursor (0–1)
  labelStrength: 0.15, // extra movement for the inner label
};

export function initMagnetic(selector) {
  document.querySelectorAll(selector).forEach((el) => {
    const label = el.firstElementChild;
    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
    const lxTo = label && gsap.quickTo(label, "x", { duration: 0.5, ease: "power3.out" });
    const lyTo = label && gsap.quickTo(label, "y", { duration: 0.5, ease: "power3.out" });

    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      xTo(dx * CONFIG.strength);
      yTo(dy * CONFIG.strength);
      if (label) {
        lxTo(dx * CONFIG.labelStrength);
        lyTo(dy * CONFIG.labelStrength);
      }
    });

    el.addEventListener("pointerleave", () => {
      gsap.to([el, label].filter(Boolean), { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" });
    });
  });
}
