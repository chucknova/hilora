/**
 * HERO
 *
 * On load (one timeline, starts ~0.35s after the header):
 *   1. Headline words rise up out of a mask, line by line.
 *   2. The coral "verified" pill wipes open left→right, the word pops in,
 *      then a light sheen sweeps across it.
 *   3. Subtitle and search bar fade up.
 *   4. Profile cards "deal out": they start stacked behind the centre card
 *      and fan out to their places. The centre card lands first, then the
 *      coral corner brackets snap in from outside.
 *   5. The profile carousel starts (see profile-carousel.js): every few
 *      seconds the next card slides into the frame and becomes the featured one.
 *
 * Ongoing:
 *   - Corner brackets gently pulse in and out.
 *   - Scroll parallax: the background pattern moves slower than the page,
 *     the card row drifts up and the headline block fades as you scroll away.
 *
 * Targets: .hero, .hero__word, .hero__pill, .hero__subtitle, .search,
 *          .profiles, .profiles__frame .corner, .hero__bg
 */
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { createProfileCarousel } from "./profile-carousel.js";
import { sheen } from "./utils.js";

const CONFIG = {
  startDelay: 0.35,
  ease: "power4.out",
  headline: { duration: 1.1, stagger: 0.08 },
  cards: { duration: 1.3, stagger: 0.07, ease: "expo.out" },
  cornerPulse: { distance: 6, duration: 1.4 },
  parallax: { cards: -70, bg: 120, content: -40 },
};

export function initHeroAnimations() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  const pill = hero.querySelector(".hero__pill");
  const pillText = hero.querySelector(".hero__pill-text");
  const strip = hero.querySelector(".profiles");
  const corners = strip.querySelectorAll(".corner");

  // Turns the static row into the looping carousel and positions the cards
  const carousel = createProfileCarousel(strip);
  const featured = carousel.cards.find((_, i) => carousel.slotOf(i) === 0);
  const sideCards = carousel.cards
    .filter((_, i) => {
      const s = Math.abs(carousel.slotOf(i));
      return s > 0 && s <= carousel.visibleRange;
    })
    // inner cards first, then outer
    .sort((a, b) => Math.abs(gsap.getProperty(a, "x")) - Math.abs(gsap.getProperty(b, "x")));

  // --- Split the plain words of the headline (the pill is animated separately)
  const split = SplitText.create(hero.querySelectorAll(".hero__word"), {
    type: "words",
    mask: "words",
  });

  gsap.set(hero, { autoAlpha: 1 });
  gsap.set(".stats", { autoAlpha: 1 }); // stats handles its own entrance

  const tl = gsap.timeline({ delay: CONFIG.startDelay, defaults: { ease: CONFIG.ease } });

  // 1. Headline words
  tl.from(split.words, {
    yPercent: 110,
    duration: CONFIG.headline.duration,
    stagger: CONFIG.headline.stagger,
  });

  // 2. "verified" pill — wipe open, word pops, sheen
  tl.fromTo(
    pill,
    { clipPath: "inset(0 100% 0 0 round 16px)", rotate: -4 },
    { clipPath: "inset(0 0% 0 0 round 16px)", rotate: 0, duration: 0.9, ease: "expo.inOut" },
    0.15
  )
    .from(pillText, { yPercent: 100, autoAlpha: 0, duration: 0.7, ease: "back.out(1.8)" }, "-=0.35")
    .add(() => sheen(pill), "-=0.2");

  // 3. Subtitle + search
  tl.from(".hero__subtitle", { y: 24, autoAlpha: 0, duration: 0.9 }, 0.45)
    .from(".search", { y: 30, autoAlpha: 0, duration: 0.9 }, 0.55);

  // 4. Cards deal out from behind the centre card to their carousel positions
  tl.from(
    featured,
    { y: 120, scale: 0.85, autoAlpha: 0, duration: CONFIG.cards.duration, ease: CONFIG.cards.ease },
    0.6
  ).from(
    sideCards,
    {
      x: 0,
      y: 60,
      rotate: (i, el) => (gsap.getProperty(el, "x") < 0 ? -8 : 8),
      scale: 0.8,
      autoAlpha: 0,
      duration: CONFIG.cards.duration,
      ease: CONFIG.cards.ease,
      stagger: CONFIG.cards.stagger,
    },
    0.75
  );

  // corner brackets fly in from outside, then pulse forever
  const cornerOffsets = [
    { x: -30, y: -30 },
    { x: 30, y: -30 },
    { x: -30, y: 30 },
    { x: 30, y: 30 },
  ];
  tl.from(
    corners,
    {
      x: (i) => cornerOffsets[i].x,
      y: (i) => cornerOffsets[i].y,
      autoAlpha: 0,
      duration: 0.7,
      ease: "back.out(2)",
      stagger: 0.04,
    },
    "-=0.6"
  )
    .add(() => pulseCorners(corners, cornerOffsets))
    // 5. hand over to the carousel
    .add(() => carousel.start());

  // --- Scroll parallax (scrubbed, so it follows the scrollbar exactly)
  gsap
    .timeline({
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 },
      defaults: { ease: "none" },
    })
    .to(".hero__bg", { y: CONFIG.parallax.bg }, 0)
    .to(strip, { y: CONFIG.parallax.cards }, 0)
    .to(".hero__content", { y: CONFIG.parallax.content, autoAlpha: 0.2 }, 0);

  return tl;
}

/* ---------- helpers ---------- */

// Brackets breathe outward and back, drawing attention to the featured card
function pulseCorners(corners, offsets) {
  const { distance, duration } = CONFIG.cornerPulse;
  const d = distance / 30; // offsets are ±30, scale them down to ±distance
  gsap.to(corners, {
    x: (i) => offsets[i].x * d,
    y: (i) => offsets[i].y * d,
    duration,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
  });
}
