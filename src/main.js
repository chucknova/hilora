import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/header.css";
import "./styles/hero.css";
import "./styles/verify.css";
import "./styles/recent.css";
import "./styles/different.css";
import "./styles/fields.css";
import "./styles/cta.css";

import { initHeader } from "./header.js";
import { initAnimations } from "./animations/index.js";

initHeader();

// Wait for web fonts so SplitText measures the real glyphs (prevents line jumps)
document.fonts.ready.then(initAnimations);
