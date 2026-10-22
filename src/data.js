export const PROFILE = {
  name: "Viyan Manokaran",
  role: "AI engineer and full stack developer",
  city: "Chennai",
  timeZone: "Asia/Kolkata",
  email: "viyanmanokaran@gmail.com",
  phone: "+91 8248152543",
  linkedin: "linkedin.com/in/viyanmanokaran",
  github: "github.com/Viyangit",
};

/**
 * `summary` shows on the conveyor crate; `problem`, `built` and `note` fill the case study
 * that opens when a crate is clicked.
 */
export const PROJECTS = [
  {
    name: "FedLearn",
    client: "Open-source library",
    year: "2026",
    stack: ["Rust", "WebAssembly", "TypeScript", "CUDA"],
    summary:
      "An on-device learning engine that gives AI products a memory of each user, without their data ever leaving the device.",
    problem:
      "AI assistants start every session blank, forget old knowledge when they learn something new, and can only personalise by uploading user data to a server.",
    built: [
      "A tiny personal adapter per user (about 150 KB, LoRA-based) that learns from each session and lives only on that user's device.",
      "Continual learning with EWC and GEM, so new preferences don't erase what the model already knew.",
      "Privacy-preserving federated updates: DP-SGD with a Rényi privacy budget, FedProx and SCAFFOLD aggregation, secure aggregation and a Byzantine-robust server.",
      "A Rust core with CUDA kernels and a WebAssembly build, shipped as the fedlearn-core npm package with a CLI, MCP server and privacy dashboard.",
    ],
    note: "Developers add personal memory to their AI in about four lines of code, and users' confidential text never leaves their machine.",
    link: "https://github.com/Viyangit/FedLearn",
  },
  {
    name: "Envision",
    client: "Chennai Metco Pvt Ltd",
    year: "2025",
    stack: ["Electron.js", "OpenCV", "Python", "JavaScript"],
    summary:
      "A desktop metallurgy analysis platform that reads live industrial camera feeds and runs computer-vision quality checks.",
    problem:
      "Metallurgy samples were inspected by eye. Review was slow, varied between operators, and defects were often caught late in production.",
    built: [
      "An Electron.js desktop app that ingests live feeds from industrial cameras on the shop floor.",
      "OpenCV pipelines that highlight surface and structural defects in each frame.",
      "Standardised inspection workflows with clear visual output and batch-wise analysis summaries.",
    ],
    note: "Electron gave the plant a native desktop tool while keeping the vision code in Python and OpenCV.",
  },
  {
    name: "T-Map",
    client: "Sakthi Auto Corp, Erode",
    year: "2025",
    stack: ["MS SQL", "JavaScript", "HTML", "CSS", "Linux"],
    summary:
      "An internal audit platform with shift-aware tracking for factory operations and compliance, migrated from Windows to Linux.",
    problem:
      "Audit checklists and follow-ups were scattered, so supervisors could not see which shift had closed which issue.",
    built: [
      "Shift-aware audit tracking with centralised checklists, status updates and team accountability.",
      "An MS SQL data layer that gives every finding full traceability from report to closure.",
      "A migration of the whole application from a Windows server to a Linux server.",
    ],
    note: "The Windows to Linux migration kept the plant's audit data intact while moving it to a cheaper, more stable host.",
  },
  {
    name: "BVS",
    client: "RoBridge AI",
    year: "2025",
    stack: ["OpenAI API", "Ollama", "React", "Python"],
    summary:
      "A barcode workflow system for industrial storage with AI-assisted data handling and an offline model fallback.",
    problem:
      "Manual entry at storage bays caused mislabelled stock and unreliable movement records.",
    built: [
      "Scanner input paired with AI-assisted parsing and validation of item data.",
      "The OpenAI API as the primary model, with a local Ollama model as fallback when the network or API is unavailable.",
      "Faster item identification, cleaner inventory records and reliable movement tracking.",
    ],
    note: "The Ollama fallback means the floor keeps scanning even when the cloud model can't be reached.",
  },
  {
    name: "ClaimShield Nexus",
    client: "Insurance claims platform",
    year: "2026",
    stack: ["FastAPI", "PostgreSQL", "Celery", "AWS", "XGBoost", "Next.js"],
    summary: "Multi-tenant claims ingestion with a six-stage fraud check that keeps working when a service fails.",
    problem:
      "Claims arrive from many systems in many formats, and a fraud check that stops whenever its model server is down lets bad claims straight through.",
    built: [
      "Ingestion over REST, CSV, FHIR, webhooks and SQS: each claim is validated and written idempotently, the API returns 202 and Celery workers do the rest.",
      "A six-stage fraud check: 11 rules, XGBoost, isolation forest and LOF with TreeSHAP, graph and spike analysis, then risk fusion. If the ML server is down it falls back to a local model, then to rules.",
      "Found a race where two workers could take the same case number on Postgres, Redis, Celery and SQS, and fixed it with a Postgres sequence and a concurrency test.",
      "A Lambda and SQS intake path with a dead-letter queue (AWS CDK), plus Postgres row-level security tested in CI.",
    ],
    note: "Every stage has a fallback, so a failed service lowers confidence instead of stopping the check.",
    link: "https://github.com/Viyangit/ClaimShieldNexus",
  },
  {
    name: "TenantVault",
    client: "Team project",
    year: "2026",
    stack: ["ASP.NET Core 8", "PostgreSQL", "React", "TypeScript", "AWS"],
    summary: "A multi-tenant platform where tenant isolation is enforced in the database, not just the app.",
    problem: "In a shared database, one missing filter is all it takes for one tenant to read another's data.",
    built: [
      "Tenants kept apart at four layers: middleware, EF Core query filters, a save interceptor and Postgres row-level security under a role that can't bypass it.",
      "The API refuses to start if any tenant table is missing its filter.",
      "Tested like an attacker would: an attack simulator, static checks that ban raw SQL, and Testcontainers tests in CI.",
      "An SQS bulk import that carries tenant context through the queue.",
    ],
    note: "Isolation holds even if application code gets it wrong, because the database enforces it too.",
    link: "https://github.com/Vignesh0005/TenantVault",
  },
  {
    name: "Farm Easy",
    client: "Rajalakshmi Engineering College",
    year: "2025",
    stack: ["Python", "React", "CSS", "Ollama"],
    summary: "A marketplace connecting farmers with transport, plus seasonal cost forecasting.",
    problem: "Small growers struggle to find transport and to plan around seasonal price swings.",
    built: [
      "A marketplace that connects producers with transport workflows.",
      "Seasonal cost forecasting with a local generative model running on Ollama.",
      "Planning support for crop movement and delivery timelines.",
    ],
    note: "Running the model locally keeps the forecasting usable without paid API access.",
  },
];

export const INTERNSHIPS = [
  {
    company: "Tunga Aerospace",
    // Photo slots: main, inset, wide, tag. Only the certificate so far; the others show placeholders.
    photos: [
      { src: "/uploads/tunga-team.webp", alt: "Viyan, far left, with the intern team and a Tunga Aerospace engineer outside the facility", still: true, focus: "0% 50%" },
      { src: "/uploads/tunga-building.webp", alt: "The Tunga Aerospace Industries gate and building in Chennai" },
      null,
      { src: "/uploads/tunga-certificate.webp", alt: "Internship certificate from Tunga Aerospace Industries, 5 February to 6 March 2025" }],
    role: "Junior software engineer",
    dates: "Feb 5 to Mar 6, 2025",
    start: "2025-02-05",
    end: "2025-03-06",
    stack: ["Python", "GStreamer", "YOLO"],
    desc:
      "Built an RTSP streaming GUI that sends drone camera feeds to any device over IP, with GStreamer pipelines and object-detection hooks.",
    notes: [
      { label: "Shipped", text: "A desktop GUI that streams drone camera feeds over RTSP to any device on the network." },
      { label: "Under the hood", text: "GStreamer pipelines handle capture, encoding and delivery; YOLO hooks run detection on the live feed." },
      { label: "Why it mattered", text: "Operators on the ground can watch, and flag, what the drone sees in real time." },
    ],
  },
  {
    company: "Sakthi Auto",
    // Photo slots: main, inset, wide, tag. Only the certificate so far; the others show placeholders.
    photos: [
      { src: "/uploads/sakthi-entrance.webp", alt: "The Sakthi Auto Component Ltd entrance wall", still: true, focus: "4% 50%" },
      { src: "/uploads/sakthi-tmap-schedule.webp", alt: "T-Map Add New Schedule form for EOHS training, with department, trainer and attendance sections", screen: true, ratio: "1600 / 921" },
      { src: "/uploads/sakthi-tmap-dashboard.webp", alt: "T-Map dashboard with the Sakthi Auto training map and training distribution panel", screen: true, ratio: "1600 / 921" },
      { src: "/uploads/sakthi-certificate.webp", alt: "Internship completion certificate from Sakthi Auto Component Limited for the T-Map module extension, 10 March to 16 May 2025" }],
    role: "Software developer",
    dates: "Mar 10 to May 16, 2025",
    start: "2025-03-10",
    end: "2025-05-16",
    stack: ["MS SQL", "JavaScript", "Linux", "Python"],
    desc:
      "Built T-Map, a shift-aware audit platform on MS SQL, and migrated it from a Windows server to Linux.",
    notes: [
      { label: "The problem", text: "Audit checklists and follow-ups were scattered, so supervisors couldn't see which shift had closed which issue." },
      { label: "Shipped", text: "T-Map: shift-aware audit tracking with central checklists, status updates and team accountability." },
      { label: "Data", text: "An MS SQL layer gives every finding full traceability, from report to closure." },
      { label: "Migration", text: "Moved the whole application from a Windows server to Linux with the plant's audit data intact." },
    ],
  },
  {
    company: "Turbo Energy",
    // Photo slots: main, inset, wide, tag. Only the certificate so far; the others show placeholders.
    photos: [
      { src: "/uploads/turbo-sap-easy-access.webp", alt: "SAP Easy Access menu open at Materials Management, Inventory Management, Goods Movement (MIGO)", screen: true },
      { src: "/uploads/turbo-sap-gate-entry.webp", alt: "SAP Create Gate Entry (Transport) screen for a truck delivering painted galvanised coil against a purchase order", screen: true, ratio: "578 / 431" },
      null,
      { src: "/uploads/turbo-certificate.webp", alt: "Internship certificate from Turbo Energy Private Limited, 16 June to 2 July 2025" }],
    role: "Junior software engineer",
    dates: "Jun 16 to Jul 2, 2025",
    start: "2025-06-16",
    end: "2025-07-02",
    stack: ["SAP", "ABAP", "ERP"],
    desc: "Hands-on work with SAP modules and framework fundamentals in an industrial energy business.",
    notes: [
      { label: "Worked with", text: "SAP modules inside an industrial energy business." },
      { label: "Learned", text: "ABAP and the fundamentals of the SAP framework." },
      { label: "Seen up close", text: "How an ERP system ties a large business's departments together." },
    ],
  },
  {
    company: "RoBridge AI",
    // Photo slots: main, inset, wide (landscape screenshot), tag (small tilted card).
    photos: [
      { src: "/uploads/robridge-scanner.webp", alt: "The RoBridge AI barcode scanner, a 3D-printed handheld showing Ready to scan" },
      { src: "/uploads/robridge-wifi-setup.webp", alt: "The scanner Wi-Fi setup page with network list and server IP field" },
      { src: "/uploads/robridge-dashboard.webp", alt: "The RoBridge dashboard Device Connected page with WebSocket status" },
      { src: "/uploads/robridge-certificate.webp", alt: "Internship certificate from RoBridge AI Pvt. Ltd., August to November 2025" },
    ],
    role: "Junior software developer",
    dates: "Aug 8 to Nov 8, 2025",
    start: "2025-08-08",
    end: "2025-11-08",
    stack: ["React", "Python", "OpenAI API", "Ollama"],
    desc:
      "Built BVS, a barcode workflow system with OpenAI-assisted data handling and an Ollama fallback, plus internal audit tooling synced to an on-site server.",
    notes: [
      { label: "The problem", text: "Manual entry at storage bays caused mislabelled stock and unreliable movement records." },
      { label: "Shipped", text: "BVS: scanner input with AI-assisted parsing and validation of item data." },
      { label: "Fallback", text: "OpenAI API first, a local Ollama model when the network or API is unavailable, so the floor keeps scanning." },
      { label: "Tooling", text: "Internal audit tools synced to an on-site server." },
    ],
  },
];

/** `stamp` is the word pressed onto the card; `result` is the plain-language outcome. */
export const WINS = [
  {
    event: "Saveetha Engineering College",
    stamp: "1st place",
    result: "1st place, national level · ₹2,000 prize",
    context: "National-level hackathon, against teams from engineering colleges across India.",
    solution:
      "An AI-powered SaaS platform that closes the gap between classroom learning and hiring, with targeted assessments, practice tests and quizzes that prove the skills employers look for.",
  },
  {
    event: "Smart India Hackathon",
    stamp: "College winner",
    result: "College winner · ₹3,000 prize",
    context: "Internal round at Rajalakshmi Engineering College. Qualified for the national level.",
    solution:
      "A system that maps traditional medical coding (AYUSH, Siddha, Unani) to modern allopathic codes, linking herbs, formulations and classical labels to ICD-style entries and chemical formulas.",
  },
  {
    event: "Acentra Build to Care",
    stamp: "Finalist",
    result: "Finalist, top 35 of 60 teams",
    context: "35 teams from my college were shortlisted out of 60.",
    solution:
      "Fraud detection for insurance claims. Every other team built a new SaaS product; we built a plugin that sits inside the insurer's existing legacy systems, so claims get checked without replacing anything.",
  },
];

export const ENTRIES = [
  {
    event: "School of Design Thinking",
    solution:
      "An AI tutor agent that answers student questions with correct order of operations and explanations aligned to board-of-education standards.",
  },
  {
    event: "SRM Vadapalani Hackathon",
    solution:
      "A notes app that learns a student's writing style from one uploaded template, then writes new notes and answers in that same voice.",
  },
];

export const SKILLS = [
  { name: "NLP", group: "ai" },
  { name: "RAG", group: "ai" },
  { name: "PyTorch", group: "ai" },
  { name: "OpenCV", group: "ai" },
  { name: "Ollama", group: "ai" },
  { name: "OpenAI API", group: "ai" },
  { name: "Pinecone", group: "ai" },
  { name: "NumPy", group: "ai" },
  { name: "Pandas", group: "ai" },
  { name: "Python", group: "code" },
  { name: "Django", group: "code" },
  { name: "React", group: "code" },
  { name: "Electron.js", group: "code" },
  { name: "Java", group: "code" },
  { name: "C", group: "code" },
  { name: "GStreamer", group: "code" },
  { name: "MS SQL", group: "code" },
  { name: "PostgreSQL", group: "code" },
  { name: "Git", group: "tools" },
  { name: "Linux", group: "tools" },
  { name: "SAP", group: "tools" },
  { name: "Figma", group: "tools" },
];

export const SKILL_GROUPS = {
  ai: "AI, ML and data",
  code: "Languages, frameworks and databases",
  tools: "Tools and platforms",
};

export const CERTIFICATES = [
  {
    title: "Advanced Algorithmic Thinking with Python",
    issuer: "LinkedIn Learning",
    year: "2024",
    logo: "/uploads/Python-logo.png",
  },
  {
    title: "Java Foundation",
    issuer: "Infosys Springboard",
    year: "2024",
    logo: "/uploads/Java-logo.jpg",
  },
  {
    title: "Agentforce Specialist",
    issuer: "Salesforce",
    year: "2025",
    logo: "/uploads/Salesforce-logo.webp",
  },
];
