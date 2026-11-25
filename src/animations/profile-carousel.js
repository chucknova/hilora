/**
 * PROFILE CAROUSEL (hero)
 *
 * The coral corner brackets stay fixed in the centre like a camera viewfinder.
 * Every few seconds the row slides one card to the left, and the card that
 * lands in the frame grows into the featured size, its tint turns from navy
 * to warm, and the brackets "lock on" to it.
 *
 * - Loops forever (cards are cloned once so they can wrap around off-screen).
 * - Pauses while the cursor is over the row, and while the hero is off-screen.
 * - Click any visible card to bring it into the frame.
 *
 * How the morph works: each card's size, type and tint are driven by one CSS
 * custom property, --f (0 = regular card, 1 = featured). See hero.css.
 *
 * Usage:
 *   const carousel = createProfileCarousel(document.querySelector(".profiles"));
 *   carousel.start(); // begin autoplay (hero.js calls this after the intro)
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { sheen } from "./utils.js";

const CONFIG = {
  interval: 3.2, // seconds each card stays in focus
  duration: 1.15, // slide time
  ease: "expo.inOut",
  // horizontal positions (design px, before the responsive zoom)
  firstOffset: 313.5, // centre → first card on each side
  step: 257, // distance between the other cards (236 card + 21 gap)
  visibleRange: 2, // cards visible on each side of the frame
};

export function createProfileCarousel(root) {
  const originals = [...root.querySelectorAll(".profile")];
  const frame = root.querySelector(".profiles__frame");

  // One set of clones lets a card leave on the left while its twin enters on the right
  const clones = originals.map((card) => {
    const clone = card.cloneNode(true);
    clone.classList.remove("is-featured");
    clone.setAttribute("aria-hidden", "true");
    return clone;
  });
  root.append(...clones);
  const cards = [...originals, ...clones];
  const total = cards.length;

  let offset = Math.max(0, originals.findIndex((c) => c.classList.contains("is-featured")));
  let busy = false;
  let started = false;
  let hovered = false;
  let onScreen = true;
  let timer = null;

  root.classList.add("profiles--carousel");

  /* ----- positions ----- */

  // slot 0 is the frame, negative slots are to the left, positive to the right
  function slotOf(i) {
    let s = (((i - offset) % total) + total) % total;
    if (s > total / 2) s -= total;
    return s;
  }
  function stateFor(slot) {
    const dist = Math.abs(slot);
    return {
      x: dist === 0 ? 0 : Math.sign(slot) * (CONFIG.firstOffset + (dist - 1) * CONFIG.step),
      "--f": dist === 0 ? 1 : 0,
      autoAlpha: dist <= CONFIG.visibleRange ? 1 : 0,
      zIndex: 10 - dist,
    };
  }
  function markFeatured() {
    cards.forEach((c, i) => c.classList.toggle("is-featured", slotOf(i) === 0));
  }

  // place every card instantly
  cards.forEach((card, i) => gsap.set(card, stateFor(slotOf(i))));
  markFeatured();

  /* ----- movement ----- */

  function go(steps = 1) {
    if (busy || steps === 0) return;
    busy = true;
    timer?.kill();
    offset += steps;

    const duration = CONFIG.duration * (Math.abs(steps) > 1 ? 1.3 : 1);
    const tl = gsap.timeline({
      defaults: { duration, ease: CONFIG.ease },
      onComplete: () => {
        busy = false;
        schedule();
      },
    });

    cards.forEach((card, i) => {
      const slot = slotOf(i);
      const { zIndex, ...to } = stateFor(slot);
      gsap.set(card, { zIndex });
      tl.to(card, to, 0);
    });
    markFeatured();

    const incoming = cards.find((_, i) => slotOf(i) === 0);

    // brackets let go while the row travels…
    tl.to(frame, { scale: 1.1, autoAlpha: 0.35, duration: duration * 0.4, ease: "power2.out" }, 0)
      // …then snap tight onto the new card
      .to(frame, { scale: 1, autoAlpha: 1, duration: 0.7, ease: "back.out(3)" }, duration * 0.62)
      .add(() => sheen(incoming, { duration: 1 }), duration * 0.7)
      .fromTo(
        incoming.querySelectorAll(".badge"),
        { scale: 0.6, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.5, stagger: 0.08, ease: "back.out(2.5)", immediateRender: false },
        duration * 0.7
      );

    return tl;
  }

  /* ----- autoplay ----- */

  function schedule() {
    timer?.kill();
    if (!started || hovered || !onScreen || busy) return;
    timer = gsap.delayedCall(CONFIG.interval, () => go(1));
  }

  root.addEventListener("pointerenter", (e) => {
    if (e.pointerType !== "mouse") return;
    hovered = true;
    timer?.kill();
  });
  root.addEventListener("pointerleave", (e) => {
    if (e.pointerType !== "mouse") return;
    hovered = false;
    schedule();
  });

  ScrollTrigger.create({
    trigger: root,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => {
      onScreen = self.isActive;
      onScreen ? schedule() : timer?.kill();
    },
  });

  // click a side card to bring it into focus
  cards.forEach((card, i) => {
    card.addEventListener("click", () => {
      const slot = slotOf(i);
      if (slot !== 0 && Math.abs(slot) <= CONFIG.visibleRange) go(slot);
    });
  });

  return {
    cards,
    frame,
    slotOf,
    visibleRange: CONFIG.visibleRange,
    go,
    start() {
      started = true;
      schedule();
    },
  };
}
