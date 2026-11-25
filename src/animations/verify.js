/**
 * HOW VERIFICATION WORKS
 *
 * Scroll-in (once, when the section reaches 75% of the viewport):
 *   1. Eyebrow fades up, headline lines rise out of a mask, lead text fades up.
 *   2. The four step cards rise in one after another.
 *   3. Each card's mini UI plays its "in progress → done" story, one card
 *      after the other so the four read as one process.
 *
 * Hover: hovering a card replays that card's story (ignored if it's already playing).
 *
 * Stories (each is a reset() that puts the UI in its "in progress" state and a
 * run() that builds a fresh timeline to the finished design):
 *   Step 1  Apply        — each row uploads in turn: a spinner sits in the tick's
 *                          place while a bar runs along the bottom (with realistic
 *                          stalls); the spinner closes into a circle, becomes the
 *                          tick, and the row brightens.
 *   Step 2  Credentials  — a scan beam passes over Tunde's card while the pill
 *                          says "Checking COREN"; then the green "Valid" pill stamps down.
 *   Step 3  References   — both referees show a "calling" spinner, greyed out.
 *                          Each one confirms in turn (photo comes to colour, tick
 *                          badge), the pill counts 0 → 1 → 2 of 2 and turns green,
 *                          "Calling…" becomes "Called 13 Nov".
 *   Step 4  Live         — card rises, number counts to 38, check pills pop,
 *                          then a small confetti burst from the "Live" pill.
 *
 * Without JS (or with reduced motion) the panels show the finished design.
 */
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";
import { countUp } from "./utils.js";

gsap.registerPlugin(Physics2DPlugin);

const CONFIG = {
  start: "top 75%",
  firstStory: 0.85, // when the first card's story starts in the scroll-in timeline
  stepGap: 0.6, // delay between each card's story on scroll-in
  confetti: {
    count: 26,
    colors: ["#FF6B4A", "#FDE9B0", "#98B8F1", "#FFFFFF", "#FFC2B2", "#A7EC31"],
  },
};

export function initVerifyAnimations() {
  const section = document.querySelector(".verify");
  if (!section) return;
  gsap.set(section, { autoAlpha: 1 });

  const steps = [...section.querySelectorAll(".step")];
  const title = section.querySelector(".section-head__title");
  const split = SplitText.create(title, { type: "lines", mask: "lines" });

  // one story per card, put in its "in progress" state right away
  const makers = [storyApply, storyCredentials, storyReferences, storyLive];
  const stories = steps.map((step, i) => createStory(makers[i](step)));

  const tl = gsap.timeline({
    scrollTrigger: { trigger: section, start: CONFIG.start, once: true },
    defaults: { ease: "power3.out" },
  });

  // 1. Heading
  tl.from(section.querySelector(".section-head__eyebrow"), { y: 16, autoAlpha: 0, duration: 0.7 })
    .from(split.lines, { yPercent: 105, duration: 1, stagger: 0.1, ease: "power4.out" }, 0.1)
    .from(section.querySelector(".section-head__lead"), { y: 20, autoAlpha: 0, duration: 0.8 }, 0.35);

  // 2. Cards
  tl.from(steps, { y: 60, autoAlpha: 0, duration: 1, stagger: 0.12, ease: "expo.out" }, 0.4);

  // 3. Stories, one after the other
  stories.forEach((story, i) => tl.call(story.play, null, CONFIG.firstStory + i * CONFIG.stepGap));

  // Hover replays the card's story
  steps.forEach((step, i) => step.addEventListener("pointerenter", stories[i].play));

  // "Live" pill keeps a soft pulse
  pulse(section.querySelector(".pill--live"), "rgba(194, 57, 27, 0.35)");

  return tl;
}

/* ---------- story runner ---------- */

function createStory({ reset, run }) {
  let tl = null;
  reset();
  return {
    play() {
      if (tl && tl.isActive()) return; // let a running story finish
      tl?.kill();
      reset();
      tl = run();
    },
  };
}

/* ---------- Step 1: uploads ---------- */

// Progress "shapes" so each upload stalls and speeds up a little differently
const UPLOAD_CURVES = [
  [0, 0.32, 0.4, 0.82, 1],
  [0, 0.18, 0.55, 0.62, 1],
  [0, 0.45, 0.5, 0.9, 1],
];

function storyApply(step) {
  const rows = [...step.querySelectorAll(".ui-check")].map((row) => ({
    row,
    ring: row.querySelector(".ui-ring"),
    fill: row.querySelector(".ui-ring__fill"),
    tick: row.querySelector(".ui-check__icon img"),
    label: row.querySelector(".ui-check__label"),
    bar: row.querySelector(".ui-check__bar"),
  }));

  return {
    reset() {
      rows.forEach(({ row, ring, fill, tick, label, bar }) => {
        gsap.set(row, { autoAlpha: 0, x: -16, scale: 1 });
        gsap.set(ring, { autoAlpha: 1, scale: 1, rotation: 0 });
        gsap.set(fill, { strokeDasharray: "0.28 1" }); // a short arc = classic spinner
        gsap.set(tick, { autoAlpha: 0, scale: 0.5 });
        gsap.set(label, { opacity: 0.45 });
        gsap.set(bar, { autoAlpha: 1, scaleX: 0 });
      });
    },
    run() {
      const tl = gsap.timeline();
      rows.forEach(({ row, ring, fill, tick, label, bar }, i) => {
        const at = i * 0.7; // rows overlap slightly, like a queue
        const curve = UPLOAD_CURVES[i % UPLOAD_CURVES.length];
        const upload = 1.15;
        const done = at + 0.2 + upload;

        tl.to(row, { autoAlpha: 1, x: 0, duration: 0.45, ease: "power3.out" }, at)
          // loading: spinner turns steadily in the icon's place
          .to(ring, { rotation: 360 * 2, duration: done + 0.3 - at, ease: "none", transformOrigin: "50% 50%" }, at)
          // progress bar along the bottom, with small stalls
          .to(bar, { keyframes: { scaleX: curve, easeEach: "power1.inOut" }, duration: upload }, at + 0.2)
          // done: the arc closes into a full circle…
          .to(fill, { strokeDasharray: "1 0", duration: 0.3, ease: "power2.inOut" }, done)
          // …which hands over to the tick
          .to(ring, { autoAlpha: 0, duration: 0.15 }, done + 0.28)
          .to(tick, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "back.out(2.2)" }, done + 0.26)
          .to(label, { opacity: 1, duration: 0.3 }, done + 0.26)
          .to(bar, { autoAlpha: 0, duration: 0.35 }, done + 0.2);
      });
      return tl;
    },
  };
}

/* ---------- Step 2: credential check ---------- */

function storyCredentials(step) {
  const [person, row] = step.querySelectorAll(".ui-card");
  const photo = person.querySelector(".ui-person__photo");
  const scan = person.querySelector(".ui-scan");
  const pending = row.querySelector(".pill--pending");
  const valid = row.querySelector(".pill--green");

  return {
    reset() {
      gsap.set(person, { autoAlpha: 0, y: -14 });
      gsap.set(photo, { autoAlpha: 0, scale: 0.7 });
      gsap.set(scan, { autoAlpha: 0, yPercent: -100 });
      gsap.set(row, { autoAlpha: 0, y: 10, backgroundColor: "#ffffff" });
      gsap.set(pending, { autoAlpha: 0, scale: 0.85 });
      gsap.set(valid, { autoAlpha: 0, scale: 1.8, rotate: -8 });
    },
    run() {
      return (
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .to(person, { autoAlpha: 1, y: 0, duration: 0.5 })
          .to(photo, { autoAlpha: 1, scale: 1, duration: 0.45, ease: "back.out(2)" }, 0.12)
          .to(row, { autoAlpha: 1, y: 0, duration: 0.45 }, 0.3)
          .to(pending, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }, 0.45)
          // scan beam passes down and back up over the card
          .to(scan, { autoAlpha: 1, duration: 0.2 }, 0.55)
          .to(scan, { yPercent: 230, duration: 0.85, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0.55)
          .to(scan, { autoAlpha: 0, duration: 0.25 }, 2.2)
          // result: "Checking" makes way, "Valid" stamps down, row flashes green
          .to(pending, { autoAlpha: 0, scale: 0.8, duration: 0.25, ease: "power2.in" }, 2.3)
          .to(valid, { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.5, ease: "back.out(2.2)" }, 2.4)
          .to(row, { backgroundColor: "#e5f3ec", duration: 0.2, ease: "none" }, 2.55)
          .to(row, { backgroundColor: "#ffffff", duration: 0.7, ease: "power1.out" }, 2.75)
      );
    },
  };
}

/* ---------- Step 3: reference calls ---------- */

function storyReferences(step) {
  const [refCard, statusCard] = step.querySelectorAll(".ui-card");
  const referees = [...step.querySelectorAll(".ui-referee")].map((ref) => ({
    person: ref.querySelector(".ui-referee__cutout img"),
    badge: ref.querySelector(".ui-referee__badge"),
    spinner: ref.querySelector(".ui-referee__badge .spinner"),
    tick: ref.querySelector(".ui-referee__badge img"),
  }));
  const calling = statusCard.querySelector(".ui-swap__pending");
  const called = statusCard.querySelector(".ui-swap__done");
  const pill = statusCard.querySelector(".pill--dot");
  const dot = pill.querySelector(".pill__dot");
  const count = pill.querySelector("[data-confirmed]");

  const pending = { backgroundColor: "#fde9b0", color: "#7a4b00" };
  const done = { backgroundColor: "#17704a", color: "#ffffff" };

  return {
    reset() {
      gsap.set(refCard, { autoAlpha: 0, y: 16 });
      gsap.set(statusCard, { autoAlpha: 0, y: 12 });
      referees.forEach(({ person, badge, spinner, tick }) => {
        gsap.set(person, { filter: "grayscale(1)", opacity: 0.45, yPercent: 12 });
        gsap.set(badge, { autoAlpha: 0, scale: 0, backgroundColor: "#ffffff" });
        gsap.set(spinner, { autoAlpha: 1 });
        gsap.set(tick, { autoAlpha: 0, scale: 0 });
      });
      gsap.set(calling, { autoAlpha: 1 });
      gsap.set(called, { autoAlpha: 0 });
      gsap.set(pill, { ...pending, scale: 1 });
      gsap.set(dot, { scale: 1, opacity: 1 });
      count.textContent = "0";
    },
    run() {
      const tl = gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .to(refCard, { autoAlpha: 1, y: 0, duration: 0.5 })
        .to(statusCard, { autoAlpha: 1, y: 0, duration: 0.45 }, 0.15)
        .to(referees.map((r) => r.badge), { autoAlpha: 1, scale: 1, duration: 0.4, stagger: 0.1, ease: "back.out(2.5)" }, 0.3)
        // the dot "rings" while calls are in progress
        .to(dot, { scale: 0.45, opacity: 0.5, duration: 0.4, yoyo: true, repeat: 5, ease: "sine.inOut" }, 0.3);

      referees.forEach(({ person, badge, spinner, tick }, i) => {
        const at = 1.2 + i * 1;
        tl.to(person, { filter: "grayscale(0)", opacity: 1, yPercent: 0, duration: 0.6 }, at)
          .to(spinner, { autoAlpha: 0, duration: 0.15 }, at)
          .to(badge, { backgroundColor: "#17704a", duration: 0.2 }, at)
          .to(tick, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "back.out(3)" }, at + 0.05)
          .call(() => (count.textContent = String(i + 1)), null, at + 0.05)
          .fromTo(count, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.3, immediateRender: false }, at + 0.05)
          .to(pill, { scale: 1.08, duration: 0.14, yoyo: true, repeat: 1, ease: "power1.out" }, at + 0.05);
      });

      // all confirmed
      const end = 1.2 + referees.length;
      tl.to(pill, { ...done, duration: 0.4, ease: "power1.out" }, end - 0.9)
        .to(calling, { autoAlpha: 0, y: -6, duration: 0.25 }, end - 0.9)
        .fromTo(called, { y: 6 }, { autoAlpha: 1, y: 0, duration: 0.3, immediateRender: false }, end - 0.8)
        // badges step aside so the finished card matches the design
        .to(referees.map((r) => r.badge), { autoAlpha: 0, scale: 0.6, duration: 0.3, stagger: 0.08, ease: "power2.in" }, end + 0.3)
        .set(calling, { y: 0 });
      return tl;
    },
  };
}

/* ---------- Step 4: profile goes live ---------- */

function storyLive(step) {
  const panel = step.querySelector(".step__panel");
  const layer = step.querySelector(".confetti");
  const [liveCard, pillsCard] = step.querySelectorAll(".ui-card");
  const livePill = liveCard.querySelector(".pill--live");
  const number = liveCard.querySelector("[data-count]");
  const pills = pillsCard.querySelectorAll(".pill");

  return {
    reset() {
      gsap.set(liveCard, { autoAlpha: 0, y: 16 });
      gsap.set(livePill, { scale: 0 });
      gsap.set(number, { scale: 1 });
      gsap.set(pillsCard, { autoAlpha: 0, y: 12 });
      gsap.set(pills, { autoAlpha: 0, scale: 0.4 });
      number.textContent = "0";
    },
    run() {
      return gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .to(liveCard, { autoAlpha: 1, y: 0, duration: 0.5 })
        .to(livePill, { scale: 1, duration: 0.5, ease: "back.out(3)" }, 0.25)
        .add(countUp(number, Number(number.dataset.count), { duration: 1.4, ease: "power2.out" }), 0.3)
        .to(pillsCard, { autoAlpha: 1, y: 0, duration: 0.45 }, 0.5)
        .to(pills, { autoAlpha: 1, scale: 1, duration: 0.45, stagger: 0.12, ease: "back.out(2.5)" }, 0.7)
        // celebrate
        .to(number, { scale: 1.12, duration: 0.15, yoyo: true, repeat: 1, ease: "power1.out", transformOrigin: "left bottom" }, 1.65)
        .call(() => confetti(layer, livePill, panel), null, 1.65);
    },
  };
}

// A small, subtle burst of confetti from `origin`, clipped to the panel
function confetti(layer, origin, panel) {
  const { count, colors } = CONFIG.confetti;
  const box = panel.getBoundingClientRect();
  const o = origin.getBoundingClientRect();
  const x0 = o.left + o.width / 2 - box.left;
  const y0 = o.top + o.height / 2 - box.top;

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("i");
    const isDot = Math.random() < 0.35;
    const w = isDot ? gsap.utils.random(4, 6) : gsap.utils.random(3, 5);
    const h = isDot ? w : gsap.utils.random(7, 10);
    Object.assign(piece.style, {
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
          physics2D: {
            velocity: gsap.utils.random(140, 300),
            angle: gsap.utils.random(-160, -20), // mostly upward, fanned left and right
            gravity: 420,
          },
          rotation: gsap.utils.random(-540, 540),
          ease: "none",
        },
        0
      )
      .to(piece, { opacity: 0, duration: 0.4 }, duration - 0.4);
  }
}

/* ---------- loops ---------- */

// Soft expanding ring behind a pill
function pulse(el, color) {
  if (!el) return;
  const ring = document.createElement("span");
  ring.setAttribute("aria-hidden", "true");
  Object.assign(ring.style, {
    position: "absolute",
    inset: "0",
    borderRadius: "inherit",
    pointerEvents: "none",
  });
  el.appendChild(ring);
  gsap.fromTo(
    ring,
    { boxShadow: `0 0 0 0 ${color}` },
    { boxShadow: "0 0 0 8px rgba(0,0,0,0)", duration: 1.6, ease: "power2.out", repeat: -1, repeatDelay: 0.4 }
  );
}
