/**
 * Animation entry point.
 *
 * Every section has its own file exporting an init function. This file
 * registers the GSAP plugins once and decides whether to run the full
 * animations or the reduced-motion fallback.
 *
 * Dependencies: gsap (npm i gsap) — all plugins used here ship with it for free.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

import { initHeaderAnimations } from "./header.js";
import { initHeroAnimations } from "./hero.js";
import { initStatsAnimations } from "./stats.js";
import { initVerifyAnimations } from "./verify.js";
import { initRecentAnimations, initSaveButtons } from "./recent.js";
import { initDifferent } from "./different.js";
import { initFieldsAnimations } from "./fields.js";
import { initCtaAnimations, initFooterAnimations } from "./cta.js";
import { initCardTilt } from "./card-tilt.js";
import { initMagnetic } from "./magnetic.js";

gsap.registerPlugin(ScrollTrigger, SplitText);

// Handy for tweaking in the browser console during development only
if (import.meta.env?.DEV) Object.assign(window, { gsap, ScrollTrigger });

export function initAnimations() {
  // Stateful UI (the accordion) is set up once, outside matchMedia, so it isn't
  // reset if the device's hover/motion conditions change while the page is open.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  initDifferent({ animate: !reduceMotion });

  const mm = gsap.matchMedia();

  mm.add(
    {
      motionOK: "(prefers-reduced-motion: no-preference)",
      reduceMotion: "(prefers-reduced-motion: reduce)",
      canHover: "(hover: hover) and (pointer: fine)",
    },
    (ctx) => {
      const { motionOK, canHover } = ctx.conditions;

      if (!motionOK) {
        // Show everything immediately, no movement.
        gsap.set("[data-anim]", { autoAlpha: 1 });
        initHeaderAnimations({ reduced: true });
        initSaveButtons({ animate: false });
        return;
      }

      initHeaderAnimations({ reduced: false });
      initHeroAnimations();
      initStatsAnimations();
      initVerifyAnimations();
      initRecentAnimations({ canHover });
      initSaveButtons({ animate: true });
      initFieldsAnimations();
      initCtaAnimations();
      initFooterAnimations();

      // Pointer-only effects (skipped on touch screens)
      if (canHover) {
        initCardTilt("[data-tilt]");
        initMagnetic("[data-magnetic]");
      }
    }
  );
}
