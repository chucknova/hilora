/**
 * WHAT MAKES US DIFFERENT
 *
 * An accordion of six features on the left drives a preview panel on the right.
 * The coral bar under the open item (from the design) is a timer: when it
 * fills, the next feature opens. It loops through all six.
 *
 *  - Click any feature to open it (the timer restarts from there).
 *  - The timer pauses while the pointer is over the list or the preview, and
 *    while the section is off-screen.
 *  - Switching: the panel background eases to the feature's colour, the old
 *    cards drop away, the new photo wipes in from the right with a slow zoom,
 *    then the new cards rise in and play a short story:
 *      01 Scout bounties   bounty counts up to ₦350,000; progress bars fill Referred → Interviewing
 *      02 Stealth mode     the visibility toggle switches off; "Hidden from search" pops in
 *      03 Escrow           "Payment held" stamps on; the timeline dots light up in order
 *      04 Trust dossier    the four checks tick in one by one
 *      05 Graduates        verification chips pop in
 *      06 Replacement      "7 working days" counts up; "₦0" pops
 *
 * Scroll-in (once): heading reveals, list rows slide in, preview rises, then
 * the first story plays and the timer starts.
 *
 * Reduced motion: the accordion still works (instant switching), no timer.
 * Without JS: item 01 is open and its preview shows.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

const CONFIG = {
  start: "top 70%",
  interval: 7, // seconds each feature stays open
  stageWidth: 692, // design width of the preview; it's scaled to fit
};

let bound = false;

export function initDifferent({ animate }) {
  const section = document.querySelector(".different");
  if (!section || bound) return;
  bound = true; // the accordion is bound once, even if motion settings change later

  const items = [...section.querySelectorAll(".feature")];
  const panels = items.map((li) => li.querySelector(".feature__panel"));
  const bars = items.map((li) => li.querySelector(".feature__progress span"));
  const stage = section.querySelector(".preview__stage");
  const previews = [...section.querySelectorAll(".pv")];
  const stories = [storyScout, storyStealth, storyEscrow, storyDossier, storyGraduate, storyReplacement];

  fitStage(section.querySelector(".preview"), stage);

  let current = 0;
  let timer = null;
  let hovered = false;
  let onScreen = false;
  let started = false;

  section.querySelector(".features").classList.add("is-enhanced");
  panels.forEach((p, i) => gsap.set(p, { height: i === 0 ? "auto" : 0 }));
  gsap.set(stage, { backgroundColor: previews[0].dataset.color });

  /* ----- switching ----- */

  function open(i, { instant = !animate } = {}) {
    if (i === current) return;
    const prev = current;
    current = i;

    items.forEach((li, k) => {
      li.classList.toggle("is-open", k === i);
      li.querySelector(".feature__row").setAttribute("aria-expanded", String(k === i));
    });
    gsap.set(bars[prev], { scaleX: 0 });

    if (instant) {
      panels.forEach((p, k) => gsap.set(p, { height: k === i ? "auto" : 0 }));
      previews.forEach((pv, k) => pv.classList.toggle("is-active", k === i));
      gsap.set(stage, { backgroundColor: previews[i].dataset.color });
      return;
    }

    // accordion: close the old panel while the new one opens
    gsap.to(panels[prev], { height: 0, duration: 0.5, ease: "power3.inOut" });
    gsap.fromTo(panels[i], { height: 0 }, { height: "auto", duration: 0.5, ease: "power3.inOut" });
    gsap.fromTo(panels[i].children, { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.06, delay: 0.15 });

    switchPreview(previews[prev], previews[i], i);
    schedule();
  }

  function switchPreview(from, to, i) {
    gsap.killTweensOf([from, to]);
    const outCards = from.querySelectorAll(".pv-card");
    const inPhoto = to.querySelector(".pv__photo");
    const inImg = inPhoto.querySelector("img");

    gsap.to(stage, { backgroundColor: to.dataset.color, duration: 0.8, ease: "power2.inOut" });

    // outgoing cards drop away
    gsap.to(outCards, { y: 14, autoAlpha: 0, duration: 0.3, stagger: 0.04, ease: "power2.in" });

    // incoming preview sits on top; its photo wipes in from the right
    to.classList.add("is-active");
    gsap.set(to, { zIndex: 2 });
    gsap.set(from, { zIndex: 1 });
    gsap.set(to.querySelectorAll(".pv-card"), { autoAlpha: 0 });

    gsap
      .timeline({
        onComplete: () => {
          from.classList.remove("is-active");
          gsap.set(outCards, { clearProps: "transform,opacity,visibility" });
        },
      })
      .fromTo(
        inPhoto,
        { clipPath: "inset(0 0 0 100% round 14px)" },
        { clipPath: "inset(0 0 0 0% round 14px)", duration: 0.8, ease: "expo.inOut" },
        0.15
      )
      .fromTo(inImg, { scale: 1.12 }, { scale: 1, duration: 1.4, ease: "power3.out" }, 0.15);

    playStory(to, i, 0.75);
  }

  function playStory(pv, i, delay = 0) {
    const cards = pv.querySelectorAll(".pv-card");
    const tl = gsap.timeline({ delay });
    tl.fromTo(cards, { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.12, ease: "power3.out" });
    if (animate) tl.add(stories[i](pv), 0.3);
    return tl;
  }

  /* ----- timer ----- */

  function schedule() {
    timer?.kill();
    if (!animate || !started) return;
    timer = gsap.fromTo(
      bars[current],
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: CONFIG.interval,
        ease: "none",
        onComplete: () => open((current + 1) % items.length),
      }
    );
    if (hovered || !onScreen) timer.pause();
  }
  const pause = () => timer?.pause();
  const resume = () => {
    if (!hovered && onScreen) timer?.resume();
  };

  /* ----- events ----- */

  items.forEach((li, i) => {
    li.querySelector(".feature__row").addEventListener("click", () => open(i));
  });

  const body = section.querySelector(".different__body");
  body.addEventListener("pointerenter", (e) => {
    if (e.pointerType !== "mouse") return;
    hovered = true;
    pause();
  });
  body.addEventListener("pointerleave", (e) => {
    if (e.pointerType !== "mouse") return;
    hovered = false;
    resume();
  });

  ScrollTrigger.create({
    trigger: section,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => {
      onScreen = self.isActive;
      onScreen ? resume() : pause();
    },
  });

  /* ----- scroll-in ----- */

  if (!animate) {
    gsap.set(section, { autoAlpha: 1 });
    return;
  }

  gsap.set(section, { autoAlpha: 1 });
  gsap.set(bars[0], { scaleX: 0 });
  gsap.set(previews[0].querySelectorAll(".pv-card"), { autoAlpha: 0 });
  const split = SplitText.create(section.querySelector(".section-head__title"), { type: "lines", mask: "lines" });

  gsap
    .timeline({
      scrollTrigger: { trigger: section, start: CONFIG.start, once: true },
      defaults: { ease: "power3.out" },
    })
    .from(section.querySelector(".section-head__eyebrow"), { y: 16, autoAlpha: 0, duration: 0.7 })
    .from(split.lines, { yPercent: 105, duration: 1, ease: "power4.out" }, 0.1)
    .from(items, { x: -24, autoAlpha: 0, duration: 0.7, stagger: 0.07 }, 0.3)
    .from(section.querySelector(".preview"), { y: 40, autoAlpha: 0, duration: 1, ease: "expo.out" }, 0.4)
    .fromTo(
      previews[0].querySelector(".pv__photo img"),
      { scale: 1.12 },
      { scale: 1, duration: 1.6, ease: "power3.out" },
      0.4
    )
    .add(() => {
      playStory(previews[0], 0);
      started = true;
      schedule();
    }, 0.9);
}

/* ---------- preview scaling ---------- */

function fitStage(wrap, stage) {
  const update = () => stage.style.setProperty("--z", String(wrap.clientWidth / CONFIG.stageWidth));
  update();
  new ResizeObserver(update).observe(wrap);
}

/* ---------- stories ---------- */

const naira = (n) => "₦" + Math.round(n).toLocaleString("en-NG");

function storyScout(pv) {
  const amount = pv.querySelector("[data-amount]");
  const target = Number(amount.dataset.amount);
  const [referred, interviewing] = pv.querySelectorAll(".pv-stage__bar i");
  const counter = { v: 0 };
  return gsap
    .timeline()
    .to(counter, { v: target, duration: 1.2, ease: "power2.out", onUpdate: () => (amount.textContent = naira(counter.v)) }, 0)
    .fromTo(referred, { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power2.inOut" }, 0.3)
    .fromTo(interviewing, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power2.inOut" }, 0.8);
}

function storyStealth(pv) {
  const track = pv.querySelector(".pv-toggle");
  const knob = track.querySelector("i");
  const pill = pv.querySelector(".pv-pill-grey");
  // starts "on" (visible), then the professional switches it off
  return gsap
    .timeline()
    .set(track, { backgroundColor: "#1f8a5c" })
    .set(knob, { x: 19.15 })
    .set(pill, { scale: 0.6, autoAlpha: 0 })
    .to(knob, { x: 0, duration: 0.35, ease: "power2.inOut" }, 0.6)
    .to(track, { backgroundColor: "#dde1ea", duration: 0.35 }, 0.6)
    .to(pill, { scale: 1, autoAlpha: 1, duration: 0.45, ease: "back.out(2.5)" }, 0.95);
}

function storyEscrow(pv) {
  const tag = pv.querySelector(".pv-tag");
  const dots = pv.querySelectorAll(".pv-step > i");
  return gsap
    .timeline()
    .fromTo(tag, { scale: 1.7, rotate: -6, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 0.45, ease: "back.out(2.2)" }, 0.2)
    .fromTo(dots, { scale: 0 }, { scale: 1, duration: 0.4, stagger: 0.25, ease: "back.out(3)" }, 0.4);
}

function storyDossier(pv) {
  const checks = pv.querySelectorAll(".pv-check");
  const icons = pv.querySelectorAll(".pv-check .ok-icon");
  return gsap
    .timeline()
    .fromTo(checks, { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, stagger: 0.12 }, 0.1)
    .fromTo(icons, { scale: 0 }, { scale: 1, duration: 0.4, stagger: 0.12, ease: "back.out(3)" }, 0.25);
}

function storyGraduate(pv) {
  const chips = pv.querySelectorAll(".pv-chip");
  const emblem = pv.querySelector(".pv-emblem");
  return gsap
    .timeline()
    .fromTo(chips, { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.4, stagger: 0.15, ease: "back.out(2.5)" }, 0.2)
    .fromTo(emblem, { rotate: -90, scale: 0.6 }, { rotate: 0, scale: 1, duration: 0.6, ease: "back.out(2)" }, 0.3);
}

function storyReplacement(pv) {
  const days = pv.querySelector("[data-days]");
  const zero = pv.querySelector(".pv-split .pv-amount");
  const counter = { v: 0 };
  return gsap
    .timeline()
    .to(counter, { v: 7, duration: 0.9, ease: "power2.out", onUpdate: () => (days.textContent = Math.round(counter.v)) }, 0)
    .fromTo(zero, { scale: 0.5, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.4, ease: "back.out(3)" }, 0.7);
}
