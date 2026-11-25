/**
 * CARD TILT (reusable)
 *
 * 3D tilt that follows the cursor, with a moving glare highlight.
 * Add `data-tilt` to any card. Pointer devices only (see index.js).
 *
 * The glare is drawn in CSS (.profile::after) using the custom
 * properties --gx, --gy and --glare that this script updates.
 */
import { gsap } from "gsap";

const CONFIG = {
  maxTilt: 10, // degrees
  lift: 1.03, // scale on hover
  duration: 0.6,
};

export function initCardTilt(selector) {
  document.querySelectorAll(selector).forEach((card) => {
    // quickTo reuses one tween per property — smooth and cheap on mousemove
    const rx = gsap.quickTo(card, "rotationX", { duration: CONFIG.duration, ease: "power3.out" });
    const ry = gsap.quickTo(card, "rotationY", { duration: CONFIG.duration, ease: "power3.out" });

    const onEnter = () => {
      gsap.to(card, { scale: CONFIG.lift, duration: CONFIG.duration, ease: "power3.out", overwrite: "auto" });
      card.style.setProperty("--glare", "1");
    };

    const onMove = (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width; // 0 → 1
      const py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * 2 * CONFIG.maxTilt);
      rx((0.5 - py) * 2 * CONFIG.maxTilt);
      card.style.setProperty("--gx", `${px * 100}%`);
      card.style.setProperty("--gy", `${py * 100}%`);
    };

    const onLeave = () => {
      rx(0);
      ry(0);
      gsap.to(card, { scale: 1, duration: CONFIG.duration, ease: "power3.out", overwrite: "auto" });
      card.style.setProperty("--glare", "0");
    };

    card.addEventListener("pointerenter", onEnter);
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerleave", onLeave);
  });
}
