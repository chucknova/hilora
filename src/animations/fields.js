/**
 * PICK A FIELD / INDUSTRY
 *
 * Scroll-in (once, when the section reaches 75% of the viewport):
 *   1. Eyebrow fades up, title lines rise out of a mask.
 *   2. Tiles rise in as a wave across the grid (row by row, left to right),
 *      each photo settling from a slight zoom.
 *   3. The "N verified profiles" numbers count up from 0.
 *
 * Hover is CSS (fields.css): photo zooms 1.06, shade deepens, arrow nudges
 * up-right; the "See all" wash lightens.
 *
 * Targets: .fields, .fields__title, .field, .field__img, .field [data-count]
 */
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { countUp } from "./utils.js";

const CONFIG = {
  start: "top 75%",
  stagger: 0.07,
};

export function initFieldsAnimations() {
  const section = document.querySelector(".fields");
  if (!section) return;
  gsap.set(section, { autoAlpha: 1 });

  const tiles = section.querySelectorAll(".field");
  const counts = section.querySelectorAll("[data-count]");
  const split = SplitText.create(section.querySelector(".fields__title"), { type: "lines", mask: "lines" });
  counts.forEach((el) => (el.textContent = "0"));

  gsap
    .timeline({
      scrollTrigger: { trigger: section, start: CONFIG.start, once: true },
      defaults: { ease: "power3.out" },
    })
    .from(section.querySelector(".section-head__eyebrow"), { y: 16, autoAlpha: 0, duration: 0.7 })
    .from(split.lines, { yPercent: 105, duration: 1, stagger: 0.1, ease: "power4.out" }, 0.1)
    .from(
      tiles,
      { y: 40, scale: 0.96, autoAlpha: 0, duration: 0.9, ease: "expo.out", stagger: { each: CONFIG.stagger, grid: "auto", from: "start" } },
      0.25
    )
    .from(
      section.querySelectorAll(".field__img"),
      // clearProps hands transform back to CSS so the hover zoom works afterwards
      { scale: 1.15, duration: 1.4, stagger: { each: CONFIG.stagger, grid: "auto", from: "start" }, clearProps: "transform" },
      0.25
    )
    .add(() => counts.forEach((el, i) => countUp(el, Number(el.dataset.count), { duration: 1 }).delay(i * 0.05)), 0.7);
}
