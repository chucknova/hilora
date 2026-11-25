import { gsap } from "gsap";

/**
 * Counts an element's text from 0 up to `to`. Returns the tween so it can be
 * placed in a timeline.
 */
export function countUp(el, to, { duration = 2, ease = "power3.out" } = {}) {
  const counter = { value: 0 };
  return gsap.to(counter, {
    value: to,
    duration,
    ease,
    onUpdate: () => (el.textContent = Math.round(counter.value)),
  });
}

/**
 * A soft white highlight that sweeps across an element once.
 * The element needs `position: relative` (or absolute) and `overflow: hidden`.
 */
export function sheen(el, { duration = 1.1, angle = 105 } = {}) {
  const shine = document.createElement("span");
  shine.setAttribute("aria-hidden", "true");
  Object.assign(shine.style, {
    position: "absolute",
    inset: "0",
    zIndex: "2",
    pointerEvents: "none",
    background: `linear-gradient(${angle}deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)`,
    mixBlendMode: "soft-light",
  });
  el.appendChild(shine);
  return gsap.fromTo(
    shine,
    { xPercent: -120 },
    { xPercent: 120, duration, ease: "power2.inOut", onComplete: () => shine.remove() }
  );
}
