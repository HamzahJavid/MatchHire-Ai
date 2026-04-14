"use strict";

const nlp = require("compromise");
const natural = require("natural");

const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;

const SKILL_DICTIONARY = new Set([
  "javascript",
  "typescript",
  "python",
  "java",
  "c",
  "c++",
  "c#",
  "go",
  "golang",
  "rust",
  "swift",
  "kotlin",
  "ruby",
  "php",
  "scala",
  "r",
  "matlab",
  "perl",
  "bash",
  "shell",
  "dart",
  "elixir",
  "html",
  "html5",
  "css",
  "css3",
  "sass",
  "scss",
  "tailwind",
  "bootstrap",
  "react",
  "reactjs",
  "vue",
  "vuejs",
  "angular",
  "svelte",
  "nextjs",
  "nuxtjs",
  "jquery",
  "nodejs",
  "express",
  "fastapi",
  "django",
  "flask",
  "spring",
  "springboot",
  "nestjs",
  "graphql",
  "rest",
  "grpc",
  "websockets",
  "sql",
  "mysql",
  "postgresql",
  "postgres",
  "mongodb",
  "redis",
  "elasticsearch",
  "sqlite",
  "firebase",
  "supabase",
  "prisma",
  "aws",
  "azure",
  "gcp",
  "docker",
  "kubernetes",
  "terraform",
  "ansible",
  "jenkins",
  "tensorflow",
  "pytorch",
  "keras",
  "pandas",
  "numpy",
  "opencv",
  "scikit-learn",
  "git",
  "linux",
  "unix",
  "android",
  "ios",
  "flutter",
  "kotlin",
  "xml",
  "ollama",
  "llm",
  "llms",
  "cnn",
  "cnns",
  "rnn",
  "rnns",
  "vit",
  "vits",
]);

const SECTION_MAP = [
  { key: "experience", re: /^(experience|work experience|employment)$/i },
  { key: "education", re: /^(education|academic background)$/i },
  { key: "skills", re: /^(skills|technical skills|competencies)$/i },
  { key: "projects", re: /^(projects|personal projects|side projects)$/i },
  { key: "summary", re: /^(summary|objective|profile|about)$/i },
  { key: "certifications", re: /^(certifications?|certificates?|licenses?)$/i },
];

function splitSections(lines) {
  const sections = {};
  let current = "header";
  let buffer = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const isHeader =
      trimmed.length > 2 &&
      trimmed.length < 50 &&
      (trimmed === trimmed.toUpperCase() ||
        SECTION_MAP.some((s) => s.re.test(trimmed)));

    if (isHeader) {
      const matched = SECTION_MAP.find(
        (s) => s.re.test(trimmed) || s.re.test(trimmed.toLowerCase()),
      );
      if (matched) {
        if (!sections[current]) sections[current] = [];
        sections[current].push(...buffer);
        current = matched.key;
        buffer = [];
        continue;
      }
    }
    buffer.push(trimmed);
  }

  if (!sections[current]) sections[current] = [];
  sections[current].push(...buffer);

  return Object.fromEntries(
    Object.entries(sections).map(([k, v]) => [k, v.filter(Boolean).join("\n")]),
  );
}

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(\+?\d[\d\s\-().]{6,})/;
const GITHUB_RE = /github\.com\/([a-zA-Z0-9_\-]+)/i;
const LINKEDIN_RE = /linkedin\.com\/in\/([a-zA-Z0-9_\-]+)/i;
const URL_RE =
  /https?:\/\/[^\s]+|(www\.|github\.com\/|linkedin\.com\/in\/)[^\s]+/gi;
const DATE_RANGE_RE =
  /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)?\s*\d{4}\s*[-–—]\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|present|current)?\s*\d{0,4}/gi;
const YEAR_RE = /\b(20\d{2}|19\d{2})\b/;
const DEGREE_RE =
  /\b(bachelor|master|phd|ph\.d|doctorate|associate|b\.?s\.?c?|m\.?s\.?c?|b\.?a\.?|m\.?e\.?|mba|btech|mtech|bs in|ms in)\b/i;
const BULLET_RE = /^[•◦\-*▪▸→]\s*/;

function extractContact(text) {
  const urls = [...(text.match(URL_RE) || [])].map((u) =>
    u.replace(/[.,;)]+$/, ""),
  );
  const portfolioURLs = urls.filter(
    (u) => !GITHUB_RE.test(u) && !LINKEDIN_RE.test(u),
  );
  const githubMatch = text.match(GITHUB_RE);
  const linkedinMatch = text.match(LINKEDIN_RE);
  return {
    email: text.match(EMAIL_RE)?.[0] || null,
    phone: text.match(PHONE_RE)?.[1]?.trim() || null,
    github: githubMatch ? `https://github.com/${githubMatch[1]}` : null,
    linkedin: linkedinMatch
      ? `https://linkedin.com/in/${linkedinMatch[1]}`
      : null,
    portfolio: portfolioURLs[0] || null,
  };
}

function extractName(lines) {
  for (const line of lines.slice(0, 6)) {
    const t = line.trim();
    if (!t || t.length > 60) continue;
    if (EMAIL_RE.test(t) || PHONE_RE.test(t)) continue;
    if (/resume|cv|curriculum/i.test(t)) continue;
    const people = nlp(t).people().out("array");
    if (people.length) {
      const parts = people[0].trim().split(/\s+/);
      if (parts.length >= 2) return people[0].trim();
    }
    if (/^([A-Z][a-z]+)(\s+[A-Z][a-z]+){1,3}$/.test(t)) return t;
  }
  return null;
}

function extractLocation(lines) {
  for (const line of lines.slice(0, 10)) {
    const t = line.trim();
    if (/^[A-Z][a-zA-Z\s]+(,\s*[A-Z][a-zA-Z\s]+)+$/.test(t) && t.length < 60)
      return t;
    if (
      /\b(lahore|karachi|islamabad|pakistan|remote|new york|london|dubai)\b/i.test(
        t,
      )
    )
      return t;
  }
  return null;
}

function extractTitle(sections) {
  const expLines = (sections.experience || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const titleRe =
    /\b(engineer|developer|intern|assistant|manager|analyst|lead|architect|officer|consultant)\b/i;
  for (const line of expLines.slice(0, 3)) {
    if (titleRe.test(line) && line.length < 80) return line;
  }
  return null;
}

function extractEducation(section) {
  if (!section) return [];
  const lines = section
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const entries = [];
  let current = null;

  for (const line of lines) {
    const hasDegree = DEGREE_RE.test(line);
    const hasDate = DATE_RANGE_RE.test(line) || YEAR_RE.test(line);
    const isBullet = BULLET_RE.test(line);

    if (hasDegree) {
      if (current) entries.push(current);
      current = {
        degree: line,
        institution: null,
        duration: null,
        gpa: null,
        notes: [],
      };
    } else if (current) {
      if (hasDate && !current.duration) {
        current.duration = line.match(DATE_RANGE_RE)?.[0] || line;
      } else if (/gpa|cgpa/i.test(line)) {
        current.gpa = line.match(/[\d.]+/)?.[0] || null;
      } else if (/coursework/i.test(line)) {
        current.coursework = line.replace(/.*coursework[:\s]*/i, "").trim();
      } else if (isBullet) {
        current.notes.push(line.replace(BULLET_RE, ""));
      } else if (!current.institution && !hasDate) {
        current.institution = line;
      }
    }
  }
  if (current) entries.push(current);
  return entries;
}

function extractExperience(section) {
  if (!section) return [];
  const lines = section
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const entries = [];
  let current = null;
  const roleRe =
    /\b(engineer|developer|intern|assistant|manager|analyst|lead|architect|officer|consultant)\b/i;

  for (const line of lines) {
    const isBullet = BULLET_RE.test(line);
    const hasDate = DATE_RANGE_RE.test(line);
    const isRole =
      roleRe.test(line) && line.length < 80 && !isBullet && !hasDate;

    if (isRole) {
      if (current) entries.push(current);
      current = {
        title: line,
        company: null,
        location: null,
        duration: null,
        bullets: [],
      };
    } else if (current) {
      if (hasDate && !current.duration) {
        current.duration = line.trim();
      } else if (isBullet) {
        current.bullets.push(line.replace(BULLET_RE, "").trim());
      } else if (!current.company && !hasDate) {
        if (/,/.test(line) && line.length < 80) {
          const parts = line.split(",").map((p) => p.trim());
          current.company = parts[0];
          current.location = parts.slice(1).join(", ");
        } else {
          current.company = line;
        }
      } else if (
        current.company &&
        !current.location &&
        !hasDate &&
        !isBullet &&
        line.length < 60
      ) {
        current.location = line;
      }
    }
  }
  if (current) entries.push(current);
  return entries;
}

function extractProjects(section) {
  if (!section) return [];
  const lines = section
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const entries = [];
  let current = null;

  for (const line of lines) {
    const isBullet = BULLET_RE.test(line);
    const isStack = /^stack:/i.test(line);
    const hasDate = /fall|spring|summer|winter|\d{4}/i.test(line);

    if (!isBullet && !isStack && /^[A-Z]/.test(line) && line.length < 100) {
      if (!current || current.bullets.length > 0 || current.stack) {
        if (current) entries.push(current);
        current = { title: line, duration: null, bullets: [], stack: null };
        if (hasDate) current.duration = line;
        continue;
      }
    }

    if (current) {
      if (isStack) {
        current.stack = line.replace(/^stack:\s*/i, "").trim();
      } else if (isBullet) {
        current.bullets.push(line.replace(BULLET_RE, "").trim());
      } else if (hasDate && !current.duration) {
        current.duration = line;
      }
    }
  }
  if (current) entries.push(current);
  return entries;
}

function extractSkills(section, fullText) {
  const source = section || fullText;
  const found = new Set();

  // Parse "Category: skill1, skill2" lines
  for (const line of source.split("\n")) {
    if (!/:/.test(line)) continue;
    const afterColon = line.split(":").slice(1).join(":").trim();
    for (const item of afterColon
      .split(/[,;]+/)
      .map((s) => s.trim().toLowerCase())) {
      if (item.length > 1 && item.length < 30) found.add(item);
    }
  }

  // Dictionary scan on full text
  for (const word of fullText.toLowerCase().split(/\s+/)) {
    if (SKILL_DICTIONARY.has(word)) found.add(word);
  }

  return [...found]
    .filter((s) => s.length > 1 && s.length < 30)
    .map((s) =>
      s
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    )
    .sort();
}

function extractKeywords(text, topN = 8) {
  const tfidf = new TfIdf();
  tfidf.addDocument(text);
  tfidf.addDocument("the and is in of to a that it with this for");
  return tfidf
    .listTerms(0)
    .filter((t) => t.term.length > 2 && !/^\d+$/.test(t.term))
    .slice(0, topN)
    .map((t) => t.term);
}

function parseResume(text) {
  const lines = text.split("\n");
  const sections = splitSections(lines);
  const contact = extractContact(text);
  const name = extractName(lines);
  const nameParts = name ? name.split(/\s+/) : [];

  return {
    firstName: nameParts[0] || null,
    lastName: nameParts.slice(1).join(" ") || null,
    title: extractTitle(sections),
    bio: sections.summary?.trim() || null,
    location: extractLocation(lines),
    ...contact,
    skills: extractSkills(sections.skills, text),
    experience: extractExperience(sections.experience),
    education: extractEducation(sections.education),
    projects: extractProjects(sections.projects),
    keywords: extractKeywords(text),
    _sections: Object.keys(sections),
  };
}

module.exports = { parseResume };
