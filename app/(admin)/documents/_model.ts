// Script Library domain model: local UI types, the demo/seed data, and the
// API ↔ local mapping helpers (#18). Shared by the page and its components (#40).

import type {
  ScriptDto,
  ScriptType as ApiScriptType,
  ScriptStatus as ApiScriptStatus,
} from "@/lib/types/api";

export type ScriptType = "musical" | "play" | "scene" | "skit";
export type ScriptStatus = "active" | "archived" | "draft";
export type Prog = "mjc" | "pathways" | "manteca" | "productions";

export const PROG_LABEL: Record<Prog, string> = {
  mjc: "MJC",
  pathways: "Pathways",
  manteca: "Manteca PT",
  productions: "Productions",
};

export const TYPE_LABEL: Record<ScriptType, string> = {
  musical: "Musical",
  play: "Full Play",
  scene: "Scene Collection",
  skit: "Skit",
};

export const STATUS_STYLE: Record<ScriptStatus, { bg: string; color: string }> = {
  active: { bg: "var(--success-fill)", color: "var(--success-text)" },
  archived: { bg: "var(--neutral-fill)", color: "var(--neutral-text)" },
  draft: { bg: "var(--warning-fill)", color: "var(--warning-text)" },
};

export type Script = {
  title: string;
  subtitle?: string;
  type: ScriptType;
  adapted: boolean;
  original: boolean;
  programs: Prog[];
  castMin?: number;
  castMax?: number;
  duration: string;
  lastUsed: string;
  status: ScriptStatus;
};

export const INITIAL_SCRIPTS: Script[] = [
  {
    title: "The Magic Garden",
    subtitle: "An original musical in two acts",
    type: "musical",
    adapted: false,
    original: true,
    programs: ["productions", "pathways"],
    castMin: 12,
    castMax: 18,
    duration: "55 min",
    lastUsed: "Spring 2026",
    status: "active",
  },
  {
    title: "Cinderella",
    subtitle: "Adapted for performing arts",
    type: "play",
    adapted: true,
    original: false,
    programs: ["mjc"],
    castMin: 8,
    castMax: 12,
    duration: "40 min",
    lastUsed: "Fall 2025",
    status: "active",
  },
  {
    title: "Under the Sea",
    subtitle: "A musical celebration",
    type: "musical",
    adapted: false,
    original: true,
    programs: ["manteca"],
    castMin: 6,
    castMax: 10,
    duration: "35 min",
    lastUsed: "Spring 2025",
    status: "active",
  },
  {
    title: "The Brave Little Star",
    subtitle: "Scene collection — one act per program group",
    type: "scene",
    adapted: false,
    original: true,
    programs: ["mjc", "pathways", "manteca", "productions"],
    castMin: 4,
    castMax: 8,
    duration: "20 min / scene",
    lastUsed: "Ongoing",
    status: "active",
  },
  {
    title: "Stardust",
    subtitle: "New original musical — in development",
    type: "musical",
    adapted: false,
    original: true,
    programs: ["productions"],
    duration: "TBD",
    lastUsed: "Planned: Fall 2026",
    status: "draft",
  },
  {
    title: "A Midsummer Dream",
    subtitle: "Adapted from Shakespeare",
    type: "play",
    adapted: true,
    original: false,
    programs: ["productions"],
    castMin: 15,
    castMax: 20,
    duration: "60 min",
    lastUsed: "Spring 2025",
    status: "archived",
  },
  {
    title: "Rainbow Road",
    subtitle: "A musical journey",
    type: "musical",
    adapted: false,
    original: true,
    programs: ["mjc", "pathways"],
    castMin: 10,
    castMax: 14,
    duration: "45 min",
    lastUsed: "Spring 2024",
    status: "archived",
  },
  {
    title: "The Lighthouse Keeper",
    type: "play",
    adapted: false,
    original: true,
    programs: ["manteca"],
    castMin: 6,
    castMax: 8,
    duration: "30 min",
    lastUsed: "Fall 2024",
    status: "archived",
  },
];

// ── API ↔ local model mapping (#18) ─────────────────────────────────────────────
// This page keeps its own lowercase unions; the API uses PascalCase enums and program
// GUIDs. These helpers bridge the two so the page can show and persist real data while
// the existing demo (INITIAL_SCRIPTS) remains the fallback if the API is empty/unreachable.

export const API_TYPE_TO_LOCAL: Record<ApiScriptType, ScriptType> = {
  Musical: "musical",
  Play: "play",
  Scene: "scene",
  Skit: "skit",
};
export const LOCAL_TYPE_TO_API: Record<ScriptType, ApiScriptType> = {
  musical: "Musical",
  play: "Play",
  scene: "Scene",
  skit: "Skit",
};
export const API_STATUS_TO_LOCAL: Record<ApiScriptStatus, ScriptStatus> = {
  Active: "active",
  Draft: "draft",
  Archived: "archived",
};
export const LOCAL_STATUS_TO_API: Record<ScriptStatus, ApiScriptStatus> = {
  active: "Active",
  draft: "Draft",
  archived: "Archived",
};

/** Maps a program's display name to the local Prog tag (best-effort; unknown → productions). */
export function progFromName(name: string): Prog {
  const n = name.toLowerCase();
  if (n.includes("mjc")) return "mjc";
  if (n.includes("pathways")) return "pathways";
  if (n.includes("manteca")) return "manteca";
  return "productions";
}

export function scriptFromDto(dto: ScriptDto): Script {
  return {
    title: dto.title,
    subtitle: dto.subtitle ?? undefined,
    type: API_TYPE_TO_LOCAL[dto.type] ?? "play",
    adapted: dto.isAdapted,
    original: dto.isOriginal,
    programs: Array.from(new Set((dto.programNames ?? []).map(progFromName))),
    castMin: dto.castMin ?? undefined,
    castMax: dto.castMax ?? undefined,
    duration: dto.duration ?? "TBD",
    lastUsed: dto.lastUsed ?? "—",
    status: API_STATUS_TO_LOCAL[dto.status] ?? "draft",
  };
}

export const STATUS_FILTERS = ["all", "active", "archived", "draft"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];
export const PROG_FILTERS: ("all" | Prog)[] = ["all", "mjc", "pathways", "manteca", "productions"];

// ── Form state ────────────────────────────────────────────────────────────────

export type FormState = {
  title: string;
  subtitle: string;
  type: ScriptType;
  source: "original" | "adapted";
  programs: Prog[];
  castMin: string;
  castMax: string;
  duration: string;
  status: ScriptStatus;
};

export const EMPTY_FORM: FormState = {
  title: "",
  subtitle: "",
  type: "musical",
  source: "original",
  programs: [],
  castMin: "",
  castMax: "",
  duration: "",
  status: "draft",
};

