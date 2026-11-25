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
import { confettiBurst } from "./utils.js";

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
    const outCards = from.querySelectorAll(".pv-card, .pv-confirm");
    const inPhoto = to.querySelector(".pv__photo");
    const inImg = inPhoto.querySelector("img");

    gsap.to(stage, { backgroundColor: to.dataset.color, duration: 0.8, ease: "power2.inOut" });

    // outgoing cards drop away
    gsap.to(outCards, { y: 14, autoAlpha: 0, duration: 0.3, stagger: 0.04, ease: "power2.in" });

    // incoming preview sits on top; its photo wipes in from the right
    to.classList.add("is-active");
    gsap.set(to, { zIndex: 2 });
    gsap.set(from, { zIndex: 1 });
    gsap.set(to.querySelectorAll(".pv-card, .pv-confirm"), { autoAlpha: 0 });

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

  let storyTl = null;
  function playStory(pv, i, delay = 0) {
    storyTl?.kill(); // stop the previous story (some loop, like the stealth toggle)
    const cards = pv.querySelectorAll(".pv-card");
    const tl = gsap.timeline({ delay });
    tl.fromTo(cards, { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.12, ease: "power3.out" });
    if (animate) tl.add(stories[i](pv), 0.3);
    storyTl = tl;
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

// Crossfade a .pv-swap between its "off" and "on" text
function swapTo(tl, swap, on, at) {
  const off = swap.querySelector(".pv-swap__off");
  const onEl = swap.querySelector(".pv-swap__on");
  tl.to(on ? off : onEl, { autoAlpha: 0, yPercent: on ? -40 : 40, duration: 0.25, ease: "power2.in" }, at).fromTo(
    on ? onEl : off,
    { autoAlpha: 0, yPercent: on ? 40 : -40 },
    { autoAlpha: 1, yPercent: 0, duration: 0.3, ease: "power2.out", immediateRender: false },
    at + 0.18
  );
  return tl;
}
function resetSwap(swap) {
  gsap.set(swap.querySelector(".pv-swap__off"), { autoAlpha: 1, yPercent: 0 });
  gsap.set(swap.querySelector(".pv-swap__on"), { autoAlpha: 0, yPercent: 0 });
}

/* 01 — the candidate moves Referred → Interviewing → Hired, then the two cards
   make way for a big "Bounty paid" confirmation with a small confetti burst. */
function storyScout(pv) {
  const cards = pv.querySelectorAll(".pv-card");
  const amount = pv.querySelector("[data-amount]");
  const stages = pv.querySelectorAll(".pv-stage");
  const bars = pv.querySelectorAll(".pv-stage__bar i");
  const confirm = pv.querySelector(".pv-confirm");
  const icon = confirm.querySelector(".pv-confirm__icon");
  const paid = confirm.querySelector(".pv-confirm__amount");
  const target = Number(amount.dataset.amount);

  // start state
  stages[1].classList.add("is-current");
  stages[2].classList.remove("is-current");
  gsap.set(confirm, { autoAlpha: 0 });
  const counter = { v: 0 };
  const paidCounter = { v: 0 };

  return gsap
    .timeline()
    .to(counter, { v: target, duration: 1.2, ease: "power2.out", onUpdate: () => (amount.textContent = naira(counter.v)) }, 0)
    .fromTo(bars[0], { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power2.inOut" }, 0.3)
    .fromTo(bars[1], { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power2.inOut" }, 0.8)
    .fromTo(bars[2], { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power2.inOut" }, 1.6)
    .call(() => {
      stages[1].classList.remove("is-current");
      stages[2].classList.add("is-current");
    }, null, 2.1)
    // the two cards make way…
    .to(cards, { y: -12, scale: 0.97, autoAlpha: 0, duration: 0.4, stagger: 0.06, ease: "power2.in" }, 2.8)
    // …for the bounty confirmation
    .fromTo(confirm, { y: 28, scale: 0.94, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.6, ease: "back.out(1.6)" }, 3.1)
    .fromTo(icon, { scale: 0, rotate: -45 }, { scale: 1, rotate: 0, duration: 0.5, ease: "back.out(3)" }, 3.3)
    .to(paidCounter, { v: target, duration: 1, ease: "power2.out", onUpdate: () => (paid.textContent = naira(paidCounter.v)) }, 3.3)
    .call(() => confettiBurst(pv, icon, { count: 22 }), null, 3.45);
}

/* 02 — the visibility toggle flips on and off every ~2.75s, with the copy and
   the search pill following it. Loops until another feature opens. */
function storyStealth(pv) {
  const track = pv.querySelector(".pv-toggle");
  const knob = track.querySelector("i");
  const sub = pv.querySelector(".pv-toggle-card__sub");
  const pill = pv.querySelector(".pv-pill-state");
  const hold = 2.75;

  gsap.set(knob, { x: 0 });
  gsap.set(track, { backgroundColor: "#dde1ea" });
  gsap.set(pill, { backgroundColor: "#f1f2f6", color: "#4a4e5a" });
  resetSwap(sub);
  resetSwap(pill);

  const loop = gsap.timeline({ repeat: -1 });
  const on = 0.6;
  const off = on + hold;
  loop
    .to(knob, { x: 19.15, duration: 0.35, ease: "power2.inOut" }, on)
    .to(track, { backgroundColor: "#1f8a5c", duration: 0.35 }, on)
    .to(pill, { backgroundColor: "#e5f3ec", color: "#17704a", duration: 0.35 }, on + 0.1)
    .to(knob, { x: 0, duration: 0.35, ease: "power2.inOut" }, off)
    .to(track, { backgroundColor: "#dde1ea", duration: 0.35 }, off)
    .to(pill, { backgroundColor: "#f1f2f6", color: "#4a4e5a", duration: 0.35 }, off + 0.1)
    .to({}, { duration: hold - 0.6 }, off); // hold "off" before repeating
  swapTo(loop, sub, true, on);
  swapTo(loop, pill, true, on + 0.1);
  swapTo(loop, sub, false, off);
  swapTo(loop, pill, false, off + 0.1);
  return loop;
}

/* 03 — escrow in action: the amount is held, you press "Confirm work", the
   rail fills down to "Contractor is paid" and the receipt flips to RELEASED. */
function storyEscrow(pv) {
  const amount = pv.querySelector("[data-amount]");
  const tag = pv.querySelector(".pv-tag");
  const steps = pv.querySelectorAll(".pv-step");
  const dots = pv.querySelectorAll(".pv-step__dot");
  const rail = pv.querySelector(".pv-timeline__rail");
  const fill = rail.querySelector("i");
  const btn = pv.querySelector(".pv-confirm-btn");
  const btnSwap = btn.querySelector(".pv-swap");
  const target = Number(amount.dataset.amount);

  // start state
  steps[1].classList.add("is-current");
  steps[1].classList.remove("is-done");
  steps[2].classList.remove("is-done");
  gsap.set(dots, { clearProps: "backgroundColor" });
  gsap.set(tag, { backgroundColor: "#17704a" });
  gsap.set(btn, { visibility: "visible", autoAlpha: 0, backgroundColor: "#0d0d5e" });
  resetSwap(tag);
  resetSwap(btnSwap);

  // size the rail from the first dot to the last one, and find where the middle dot sits
  const centre = (el) => el.offsetTop + el.offsetParent.offsetTop + el.offsetHeight / 2;
  const top = centre(dots[0]);
  const span = centre(dots[2]) - top;
  const toMiddle = (centre(dots[1]) - top) / span;
  gsap.set(rail, { top, height: span, bottom: "auto" });

  const counter = { v: 0 };
  return gsap
    .timeline()
    .to(counter, { v: target, duration: 1, ease: "power2.out", onUpdate: () => (amount.textContent = naira(counter.v)) }, 0)
    .fromTo(tag, { scale: 1.6, rotate: -6, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 0.45, ease: "back.out(2.2)" }, 0.2)
    .fromTo(dots, { scale: 0 }, { scale: 1, duration: 0.4, stagger: 0.2, ease: "back.out(3)" }, 0.3)
    .fromTo(fill, { scaleY: 0 }, { scaleY: toMiddle, duration: 0.6, ease: "power2.out" }, 0.5)
    // the confirm button appears and the current step waits for you
    .to(btn, { autoAlpha: 1, duration: 0.35 }, 1.0)
    .fromTo(btn, { y: 6 }, { y: 0, duration: 0.35, ease: "power2.out", immediateRender: false }, 1.0)
    .to(dots[1], { scale: 1.35, duration: 0.3, yoyo: true, repeat: 3, ease: "sine.inOut" }, 1.2)
    // press
    .to(btn, { scale: 0.94, duration: 0.12, ease: "power2.in" }, 2.4)
    .to(btn, { scale: 1, backgroundColor: "#1f8a5c", duration: 0.3, ease: "back.out(3)" }, 2.52)
    .add(() => swapTo(gsap.timeline(), btnSwap, true, 0), 2.52)
    // step 2 done → rail fills → contractor paid
    .to(dots[1], { backgroundColor: "#1f8a5c", duration: 0.3 }, 2.7)
    .call(() => steps[1].classList.replace("is-current", "is-done"), null, 2.7)
    .to(fill, { scaleY: 1, duration: 0.6, ease: "power2.inOut" }, 2.8)
    .fromTo(dots[2], { scale: 1 }, { scale: 1.4, backgroundColor: "#1f8a5c", duration: 0.2, yoyo: true, repeat: 1 }, 3.35)
    .set(dots[2], { backgroundColor: "#1f8a5c" }, 3.75)
    .call(() => steps[2].classList.add("is-done"), null, 3.4)
    // receipt flips to RELEASED
    .to(tag, { backgroundColor: "#1f8a5c", duration: 0.3 }, 3.5)
    .add(() => swapTo(gsap.timeline(), tag, true, 0), 3.5)
    .to(tag, { scale: 1.12, duration: 0.15, yoyo: true, repeat: 1 }, 3.55);
}

/* 04 — the four verification badges land one by one. */
function storyDossier(pv) {
  const badges = pv.querySelectorAll(".pv-badge");
  const icons = pv.querySelectorAll(".pv-badge .i-badge");
  return gsap
    .timeline()
    .fromTo(badges, { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.14 }, 0.1)
    .fromTo(icons, { scale: 0, rotate: -120 }, { scale: 1, rotate: 0, duration: 0.5, stagger: 0.14, ease: "back.out(2.5)" }, 0.2);
}

/* 05 — degree checks land, then the NYSC certificate gets its check. */
function storyGraduate(pv) {
  const [degree, nysc] = pv.querySelectorAll(".pv-card");
  const emblem = pv.querySelector(".pv-emblem");
  return gsap
    .timeline()
    .fromTo(degree.querySelectorAll(".pv-chip"), { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.4, stagger: 0.15, ease: "back.out(2.5)" }, 0.2)
    .fromTo(emblem, { rotate: -90, scale: 0.6 }, { rotate: 0, scale: 1, duration: 0.6, ease: "back.out(2)" }, 0.35)
    .fromTo(nysc.querySelectorAll(".pv-chip"), { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.4, ease: "back.out(2.5)" }, 0.7)
    .fromTo(nysc.querySelectorAll(".i-badge"), { rotate: -120, scale: 0 }, { rotate: 0, scale: 1, duration: 0.5, ease: "back.out(2.5)" }, 0.8);
}

/* 06 — "7 working days" counts up; "₦0" pops. */
function storyReplacement(pv) {
  const days = pv.querySelector("[data-days]");
  const zero = pv.querySelector(".pv-split .pv-amount");
  const counter = { v: 0 };
  return gsap
    .timeline()
    .to(counter, { v: 7, duration: 0.9, ease: "power2.out", onUpdate: () => (days.textContent = Math.round(counter.v)) }, 0)
    .fromTo(zero, { scale: 0.5, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.4, ease: "back.out(3)" }, 0.7);
}
