/**
 * Samson Magana — Portfolio
 *
 * All visible content is generated from the Configuration section below.
 * To update the site, edit only that section; everything else is
 * presentation logic and does not need to change.
 *
 * Sections:
 *   1. Configuration
 *   2. Utilities
 *   3. Content rendering
 *   4. Interactions
 *   5. Hero animation
 */

/* 1. Configuration */

const LINKS = {
  email:         "Samsonmagana04@gmail.com",
  phone:         "+27789524338",
  phoneLabel:    "078 952 4338",
  phoneAlt:      "+27695413747",
  phoneAltLabel: "069 541 3747",
  // TODO: fill these in — an empty string hides the button entirely.
  github:   "",   // e.g. "https://github.com/yourname"
  linkedin: ""    // e.g. "https://www.linkedin.com/in/yourname"
};

const BIO = [
  "I’m a software developer and AI engineer based in <strong>Gauteng, South Africa</strong>, focused on building web applications that solve everyday, practical problems. My work sits at the meeting point of clean data and clear interfaces: a well-designed database on one side, and a screen a first-time user can understand on the other.",
  "I’m completing an <strong>Advanced Diploma in Information Technology at Vaal University of Technology</strong>, having finished my Diploma in IT in 2025. Alongside my studies I’m certified in <strong>CCNAv7 (Switching, Routing &amp; Wireless Essentials), IT Essentials (PC Hardware &amp; Software) and Cybersecurity Fundamentals</strong>, so I understand the machines and networks the software runs on — not just the code.",
  "I work mainly with <strong>Java, JavaScript, Python and SQL</strong>, and I’m comfortable moving between the front end, the back end and the database. I learn best by shipping: taking a requirement, breaking it into small working pieces, and testing each one before moving on.",
  "On the AI side I work in <strong>Python with scikit-learn and Pandas</strong>: cleaning and shaping data, training and evaluating models, and wiring the predictions back into the applications I build. My cybersecurity project applies this directly — anomaly detection over system logs, brute-force detection and risk scoring.",
  "Right now I’m looking for a <strong>junior or graduate developer role, an AI or machine-learning role, an IT support role, or an internship</strong>, where I can contribute to real features, work with experienced engineers, and keep growing as a developer."
];

const FACTS = [
  ["Based in",       "Gauteng, South Africa"],
  ["Focus",          "Web apps, data-driven systems, AI &amp; IT support"],
  ["Main stack",     "Java · JavaScript · Python · SQL"],
  ["AI focus",       "Machine learning, anomaly detection, risk scoring"],
  ["Qualifications", "Diploma in IT (2025) · Advanced Diploma in IT (in progress)"],
  ["Certified in",   "CCNAv7 · IT Essentials · Cybersecurity Fundamentals · UX Design Fundamentals"],
  ["Availability",   "Travel to other facilities, standby, weekend &amp; after-hours support"],
  ["Other",          "Code C1 driver’s licence · comfortable working at heights"],
  ["Work style",     "On-site, hybrid or remote"],
  ["Languages",      "English"]
];

const CERTS = [
  "Cybersecurity Fundamentals",
  "IT Essentials: PC Hardware and Software",
  "CCNAv7: Switching, Routing, and Wireless Essentials",
  "User Experience Design Fundamentals"
];

const TECH = ["Java", "JavaScript", "Python", "SQL", "HTML", "CSS", "VB.Net", "scikit-learn", "Pandas"];

/*
  Counts are derived from the source arrays rather than hard-coded, so
  adding a skill or certificate updates the stat card automatically.
*/
const STATS = [
  [String(TECH.length),  "Languages & tools"],
  [String(CERTS.length), "Industry certifications"],
  ["1",    "Flagship project in development"],
  ["100%", "Hands-on, self-driven learning"]
];

const PROJECTS = [
  {
    title:   "AI Cybersecurity Threat Detection System",
    status:  "In development",
    summary: "A SOC-style detection pipeline that ingests system logs into Elasticsearch, applies machine-learning models to spot brute-force attempts and anomalous behaviour, and assigns each event a risk score. Analysts work from Kibana dashboards with role-based access control, and high-risk events trigger automated security alerts. The whole stack runs in Docker, with a Python collector shipping logs, a detector scoring them, and Kibana as the analyst view.",
    tags:    ["Python", "Elasticsearch", "Kibana", "scikit-learn", "Docker", "RBAC"],
    code:    "",   // TODO: link the repo
    live:    ""    // leave empty if there is no hosted demo
  }
];

const EXPERIENCE = [
  {
    period: "2026 — In progress",
    title:  "Advanced Diploma in Information Technology",
    org:    "Vaal University of Technology · Vanderbijlpark, Gauteng",
    points: [
      "Continuing my IT studies beyond the diploma, deepening database, networking and software development knowledge.",
      "Building a SOC-style threat detection system alongside my studies: log ingestion into Elasticsearch, ML-based anomaly detection, risk scoring and Kibana dashboards."
    ]
  },
  {
    period: "2025",
    title:  "Diploma in Information Technology",
    org:    "Vaal University of Technology · Vanderbijlpark, Gauteng",
    points: [
      "Completed the diploma in 2025, covering programming, databases, networking and systems fundamentals.",
      "Worked with Java, JavaScript, Python, SQL, HTML, CSS and VB.Net across coursework and projects."
    ]
  },
  {
    period: "2022",
    title:  "National Senior Certificate (NSC) — Grade 12",
    org:    "Mafa Max Motloung Secondary School · Delmas, Mpumalanga",
    points: ["Completed Grade 12 in 2022."]
  }
];

const ROLES = [
  "I design databases.",
  "I build machine-learning models.",
  "I build responsive interfaces.",
  "I turn data into predictions.",
  "I debug until it works.",
  "I write code others can read."
];

const SKILLS = [
  ["⌨", "Web applications",
    "Responsive front ends in HTML, CSS and JavaScript that stay fast and readable on any screen."],
  ["▤", "Data-driven systems",
    "Relational databases designed around how the data will be used, queried with clean SQL."],
  ["◆", "Machine-learning foundations",
    "Classification, anomaly detection and forecasting in Python with scikit-learn and Pandas, from data cleaning through to evaluating the model."],
  ["🛡", "Secure by habit",
    "Input validation, least privilege and careful handling of user data from the first commit."],
  ["◧", "Built for people",
    "Interfaces shaped by user experience principles, so people find what they need without instructions."],
  ["✎", "Requirements to features",
    "I read business needs closely and translate them into a clear scope and a working solution."],
  ["✓", "Clear communication",
    "Plain-language updates, honest estimates and documentation that saves the team time."],
  ["🛠", "IT support & troubleshooting",
    "Desktop and laptop diagnostics, hardware and software faults, printer, scanner, email and connectivity issues, structured escalation."],
  ["⇄", "Networking fundamentals",
    "CCNAv7 switching, routing and wireless essentials, plus basic network connectivity checks and Windows software installation and configuration."]
];

const CONTACT_LEAD =
  "I’m looking for a junior or graduate developer role, an AI or machine-learning role, " +
  "an IT support role, or an internship, where I can ship real features and keep learning. " +
  "I’m based in Gauteng, hold a Code C1 licence and am available for travel to other facilities, " +
  "standby, weekend and after-hours support. Send me a message or call either number and I will reply.";

/* 2. Utilities */

/** Shortcut for `document.getElementById`. */
const $ = (id) => document.getElementById(id);

/**
 * Create an element with optional class and text content.
 * @param {string} tag
 * @param {string} [className]
 * @param {string} [text]
 * @returns {HTMLElement}
 */
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text)      node.textContent = text;
  return node;
};

/** True when the user has asked the OS to reduce motion. */
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Delay `fn` until `wait` ms have passed without another call.
 * Used to keep the canvas from rebuilding itself on every resize tick.
 */
function debounce(fn, wait) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Add a pointer-following glow to a card. The CSS reads `--x` and `--y`
 * to place the radial gradient under the cursor.
 */
function attachGlow(card) {
  card.addEventListener("pointermove", (event) => {
    const box = card.getBoundingClientRect();
    card.style.setProperty("--x", (event.clientX - box.left) + "px");
    card.style.setProperty("--y", (event.clientY - box.top)  + "px");
  });
}

/* 3. Content rendering */

// Hero: letter-by-letter name reveal
const nameEl = $("name");
nameEl.textContent = "";
let letterIndex = 0;
"Samson Magana".split(" ").forEach((word) => {
  const wordEl = el("span", "word");
  wordEl.setAttribute("aria-hidden", "true");
  [...word].forEach((char) => {
    const charEl = el("span", "ch", char);
    charEl.style.setProperty("--i", letterIndex++);
    wordEl.appendChild(charEl);
  });
  nameEl.appendChild(wordEl);
});

// Hero: typewriter roles
const typeEl = $("type");
if (reduceMotion) {
  typeEl.textContent = ROLES[0];
} else {
  (function typewriter() {
    let role = 0, char = 0, deleting = false;
    (function step() {
      const target = ROLES[role];
      typeEl.textContent = target.slice(0, char);

      if (!deleting && char === target.length) {
        deleting = true;
        return setTimeout(step, 1600);
      }
      if (deleting && char === 0) {
        deleting = false;
        role = (role + 1) % ROLES.length;
        return setTimeout(step, 400);
      }
      char += deleting ? -1 : 1;
      setTimeout(step, deleting ? 28 : 55);
    })();
  })();
}

// Ticker: repeat the tech list to fill the marquee
const trackEl = $("track");
for (let copy = 0; copy < 4; copy++) {
  TECH.forEach((tech) => trackEl.appendChild(el("span", "", tech)));
}

// About section
const bioEl = $("bio");
BIO.forEach((paragraph) => {
  const p = el("p");
  p.innerHTML = paragraph;
  bioEl.appendChild(p);
});

FACTS.forEach(([key, value]) => {
  $("factsList").appendChild(el("dt", "", key));
  const dd = el("dd");
  dd.innerHTML = value;
  $("factsList").appendChild(dd);
});

STATS.forEach(([number, label]) => {
  const card = el("div");
  card.appendChild(el("b", "", number));
  card.appendChild(el("span", "", label));
  $("stats").appendChild(card);
});

CERTS.forEach((cert) => $("certs").appendChild(el("li", "", cert)));

// Expertise cards
SKILLS.forEach(([icon, title, description], index) => {
  const card = el("article", "card rv");
  card.style.setProperty("--d", (index % 3) * 0.1 + "s");
  card.appendChild(el("div", "ico", icon));
  card.appendChild(el("h3", "", title));
  card.appendChild(el("p", "", description));
  attachGlow(card);
  $("skills").appendChild(card);
});

// Projects
const projectListEl = $("projectList");
PROJECTS.forEach((project, index) => {
  const card = el("article", "card rv");
  card.style.setProperty("--d", (index % 3) * 0.1 + "s");

  if (project.status) card.appendChild(el("span", "badge", project.status));
  card.appendChild(el("h3", "", project.title));
  card.appendChild(el("p", "", project.summary));

  if (project.tags && project.tags.length) {
    const tagList = el("ul", "tags");
    project.tags.forEach((tag) => tagList.appendChild(el("li", "", tag)));
    card.appendChild(tagList);
  }

  if (project.code || project.live) {
    const linkRow = el("div", "links");
    [["Source code", project.code], ["Live site", project.live]].forEach(([label, url]) => {
      if (!url) return;
      const link = el("a", "", label);
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      linkRow.appendChild(link);
    });
    card.appendChild(linkRow);
  }

  attachGlow(card);
  projectListEl.appendChild(card);
});
// A single project looks better centred than stretched across the grid.
if (PROJECTS.length === 1) projectListEl.classList.add("solo");

// Education timeline
EXPERIENCE.forEach((entry, index) => {
  const card = el("article", "card rv");
  card.style.setProperty("--d", (index % 3) * 0.1 + "s");
  card.appendChild(el("span", "period", entry.period));
  card.appendChild(el("h3", "", entry.title));
  if (entry.org) card.appendChild(el("p", "org", entry.org));

  if (entry.points && entry.points.length) {
    const list = el("ul", "bullets");
    entry.points.forEach((point) => list.appendChild(el("li", "", point)));
    card.appendChild(list);
  }

  attachGlow(card);
  $("expList").appendChild(card);
});

// Contact
$("contactLead").textContent = CONTACT_LEAD;
$("mail").href = "mailto:" + LINKS.email;
$("mail").textContent = LINKS.email;

[["Mobile",      LINKS.phone,    LINKS.phoneLabel],
 ["Alternative", LINKS.phoneAlt, LINKS.phoneAltLabel]]
  .forEach(([label, number, display]) => {
    if (!number) return;
    const box = el("div");
    box.appendChild(el("span", "", label));
    const link = el("a", "", display || number);
    link.href = "tel:" + number.replace(/\s+/g, "");
    box.appendChild(link);
    $("phones").appendChild(box);
  });

[["Call " + LINKS.phoneLabel,    LINKS.phone    ? "tel:" + LINKS.phone    : ""],
 ["Call " + LINKS.phoneAltLabel, LINKS.phoneAlt ? "tel:" + LINKS.phoneAlt : ""],
 ["GitHub",                      LINKS.github],
 ["LinkedIn",                    LINKS.linkedin]]
  .forEach(([label, url]) => {
    if (!url) return;
    const link = el("a", "btn g mag", label);
    link.href = url;
    if (url.startsWith("http")) {
      link.target = "_blank";
      link.rel = "noopener";
    }
    $("social").appendChild(link);
  });

// Footer
$("yr").textContent = new Date().getFullYear();

/* 4. Interactions */

// Playground
$("code").value = `<style>
  body { font-family: system-ui, sans-serif; margin: 0; padding: 1.5rem; background: #EAF3EE; color: #13203A; }
  .card { background: #fff; border-radius: 14px; padding: 1.3rem; max-width: 20rem; box-shadow: 0 2px 0 #C8D2CC; }
  button { background: #0B7A75; color: #fff; border: 0; border-radius: 999px; padding: .6rem 1.2rem; font-size: 1rem; }
</style>
<div class="card">
  <h2>Hello, I’m Samson</h2>
  <p>Change this text or the colours and watch the card update.</p>
  <button>Say hi</button>
</div>`;

function renderPlayground() {
  $("out").srcdoc = $("code").value;
}
$("code").addEventListener("input", renderPlayground);
renderPlayground();

// Scroll reveal: add `.in` once, then stop observing — reveal should not replay.
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("in");
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.15 });
document.querySelectorAll(".rv").forEach((node) => revealObserver.observe(node));

// Timeline step highlight
const timelineObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const isPast = entry.boundingClientRect.top < innerHeight * 0.7;
    entry.target.classList.toggle("on", entry.isIntersecting && isPast);
  });
}, { threshold: 0.6, rootMargin: "0px 0px -20% 0px" });
document.querySelectorAll(".tl li").forEach((node) => timelineObserver.observe(node));

// Scroll progress bar + timeline fill
const progressBar  = $("bar");
const timelineFill = $("fill");
const timelineEl   = $("tl");

function updateScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - innerHeight;
  progressBar.style.transform = "scaleX(" + (scrollable > 0 ? scrollY / scrollable : 0) + ")";

  const box   = timelineEl.getBoundingClientRect();
  const ratio = (innerHeight * 0.65 - box.top) / box.height;
  timelineFill.style.transform = "scaleY(" + Math.min(1, Math.max(0, ratio)) + ")";
}
addEventListener("scroll", updateScrollProgress, { passive: true });
addEventListener("resize", updateScrollProgress);
updateScrollProgress();

// Magnetic buttons
if (!reduceMotion) {
  document.querySelectorAll(".mag").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const box = button.getBoundingClientRect();
      const dx  = (event.clientX - box.left - box.width  / 2) * 0.18;
      const dy  = (event.clientY - box.top  - box.height / 2) * 0.28;
      button.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    button.addEventListener("pointerleave", () => {
      button.style.transform = "";
    });
  });
}

// Theme toggle
$("theme").addEventListener("click", () => {
  const root = document.documentElement;
  const isDark = root.dataset.theme
    ? root.dataset.theme === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;

  const next = isDark ? "light" : "dark";
  root.dataset.theme = next;

  try { localStorage.setItem("theme", next); } catch (e) { /* private mode */ }

  readAccentColour();
});

/* 5. Hero animation: canvas particle network */

const canvas  = $("net");
const ctx     = canvas.getContext("2d");
const POINTER = { x: -999, y: -999 };

let width, height;
let points = [];
let accentRGB = "11,122,117";
let animationId = 0;

/**
 * Read the live `--node` custom property so the network re-tints when the
 * theme changes. Falls back to the light-theme colour if it is missing.
 */
function readAccentColour() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--node")
    .trim();
  if (raw) accentRGB = raw;
}

/**
 * Resize the backing store for the current device pixel ratio (capped at
 * 2 to avoid over-rendering on high-density screens) and rebuild points.
 * The point count scales with visible area so low-end phones get a lighter
 * scene than a widescreen desktop.
 */
function resizeCanvas() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const box = canvas.getBoundingClientRect();

  width  = box.width;
  height = box.height;
  canvas.width  = width  * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = Math.round(Math.min(90, (width * height) / 14000));
  points = Array.from({ length: count }, () => ({
    x:  Math.random() * width,
    y:  Math.random() * height,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35
  }));

  readAccentColour();
}

function drawFrame() {
  ctx.clearRect(0, 0, width, height);

  // Update positions and let the pointer gently push nearby points away.
  for (const point of points) {
    point.x += point.vx;
    point.y += point.vy;
    if (point.x < 0 || point.x > width)  point.vx *= -1;
    if (point.y < 0 || point.y > height) point.vy *= -1;

    const dx = point.x - POINTER.x;
    const dy = point.y - POINTER.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 140) {
      point.x += (dx / distance) * 0.6;
      point.y += (dy / distance) * 0.6;
    }
  }

  // Draw nodes, then connect neighbours that are close enough.
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    ctx.fillStyle = `rgba(${accentRGB}, .7)`;
    ctx.beginPath();
    ctx.arc(a.x, a.y, 1.8, 0, Math.PI * 2);
    ctx.fill();

    for (let j = i + 1; j < points.length; j++) {
      const b = points[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d >= 130) continue;
      ctx.strokeStyle = `rgba(${accentRGB}, ${(1 - d / 130) * 0.35})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  animationId = requestAnimationFrame(drawFrame);
}

resizeCanvas();
addEventListener("resize", debounce(resizeCanvas, 150));

// Track the pointer only inside the hero.
canvas.parentElement.addEventListener("pointermove", (event) => {
  const box = canvas.getBoundingClientRect();
  POINTER.x = event.clientX - box.left;
  POINTER.y = event.clientY - box.top;
});
canvas.parentElement.addEventListener("pointerleave", () => {
  POINTER.x = POINTER.y = -999;
});

/*
  Start or pause the animation based on two conditions:

    - The user must not have requested reduced motion.
    - The hero must currently be on-screen.
*/
if (!reduceMotion) {
  new IntersectionObserver(([entry]) => {
    cancelAnimationFrame(animationId);
    if (entry.isIntersecting) drawFrame();
  }).observe(canvas);

  drawFrame();
} else {
  // Render a single static frame so the hero is not empty.
  drawFrame();
  cancelAnimationFrame(animationId);
}