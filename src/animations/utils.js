import { gsap } from "gsap";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";

gsap.registerPlugin(Physics2DPlugin);

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

/**
 * A small, subtle burst of confetti from the centre of `origin`.
 * Pieces are appended to `layer` (which should be position:relative/absolute
 * with overflow hidden) and remove themselves when done.
 */
export function confettiBurst(layer, origin, { count = 26, colors = ["#FF6B4A", "#FDE9B0", "#98B8F1", "#FFFFFF", "#FFC2B2", "#A7EC31"], gravity = 420 } = {}) {
  const box = layer.getBoundingClientRect();
  const o = origin.getBoundingClientRect();
  // layer may be scaled with CSS zoom; convert screen px into the layer's own px
  const k = layer.offsetWidth ? box.width / layer.offsetWidth : 1;
  const x0 = (o.left + o.width / 2 - box.left) / k;
  const y0 = (o.top + o.height / 2 - box.top) / k;

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("i");
    const isDot = Math.random() < 0.35;
    const w = isDot ? gsap.utils.random(4, 6) : gsap.utils.random(3, 5);
    const h = isDot ? w : gsap.utils.random(7, 10);
    Object.assign(piece.style, {
      position: "absolute",
      display: "block",
      zIndex: "5",
      pointerEvents: "none",
      left: `${x0}px`,
      top: `${y0}px`,
      width: `${w}px`,
      height: `${h}px`,
      borderRadius: isDot ? "50%" : "1px",
      background: gsap.utils.random(colors),
    });
    layer.appendChild(piece);

    const duration = gsap.utils.random(1.3, 1.9);
    gsap
      .timeline({ onComplete: () => piece.remove() })
      .fromTo(piece, { scale: 0 }, { scale: 1, duration: 0.15 })
      .to(
        piece,
        {
          duration,
          physics2D: { velocity: gsap.utils.random(140, 300), angle: gsap.utils.random(-160, -20), gravity },
          rotation: gsap.utils.random(-540, 540),
          ease: "none",
        },
        0
      )
      .to(piece, { opacity: 0, duration: 0.4 }, duration - 0.4);
  }
}
