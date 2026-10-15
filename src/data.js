export const PROFILE = {
  name: "Viyan Manokaran",
  role: "AI engineer and full stack developer",
  city: "Chennai",
  timeZone: "Asia/Kolkata",
  email: "viyanmanokaran@gmail.com",
  phone: "+91 8248152543",
  linkedin: "linkedin.com/in/viyan-manokaran",
  github: "github.com/viyanmanokaran",
};

/**
 * `summary` shows on the conveyor crate; `problem`, `built` and `note` fill the case study
 * that opens when a crate is clicked.
 */
export const PROJECTS = [
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
    name: "Transport",
    client: "Rajalakshmi Engineering College",
    year: "2025",
    stack: ["Python", "React", "JavaScript", "Google Maps"],
    summary: "An in-house app for assigning cabs and tracking drivers in real time.",
    problem: "Staff transport was coordinated over phone calls, with no live view of where drivers were.",
    built: [
      "Cab assignment and pickup scheduling for staff transportation teams.",
      "Real-time driver tracking on Google Maps.",
      "One dashboard for routes and trip progress.",
    ],
    note: "Built for the college's own transport team and used in-house.",
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
    role: "Junior software engineer",
    dates: "Feb 5 to Mar 6, 2025",
    start: "2025-02-05",
    stack: ["Python", "GStreamer", "YOLO"],
    desc:
      "Built an RTSP streaming GUI that sends drone camera feeds to any device over IP, with GStreamer pipelines and object-detection hooks.",
  },
  {
    company: "Sakthi Auto",
    role: "Software developer",
    dates: "Mar 10 to May 16, 2025",
    start: "2025-03-10",
    stack: ["MS SQL", "JavaScript", "Linux", "Python"],
    desc:
      "Built T-Map, a shift-aware audit platform on MS SQL, and migrated it from a Windows server to Linux.",
  },
  {
    company: "Turbo Energy",
    role: "Junior software engineer",
    dates: "Jun 16 to Jul 2, 2025",
    start: "2025-06-16",
    stack: ["SAP", "ABAP", "ERP"],
    desc: "Hands-on work with SAP modules and framework fundamentals in an industrial energy business.",
  },
  {
    company: "RoBridge AI",
    role: "Junior software developer",
    dates: "Aug 8 to Nov 8, 2025",
    start: "2025-08-08",
    stack: ["React", "Python", "OpenAI API", "Ollama"],
    desc:
      "Built BVS, a barcode workflow system with OpenAI-assisted data handling and an Ollama fallback, plus internal audit tooling synced to an on-site server.",
  },
];

/** `stamp` is the word pressed onto the card; `result` is the plain-language outcome. */
export const WINS = [
  {
    event: "Saveetha Engineering College",
    stamp: "1st place",
    result: "1st place, national level",
    context: "National-level hackathon, against teams from engineering colleges across India.",
    solution:
      "An AI-powered SaaS platform that closes the gap between classroom learning and hiring, with targeted assessments, practice tests and quizzes that prove the skills employers look for.",
  },
  {
    event: "Smart India Hackathon",
    stamp: "College winner",
    result: "College winner",
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
