import fs from "node:fs";
import path from "node:path";
import type {
  Progress,
  Difficulty,
  Language,
  SolvedEntry,
} from "../problems/types.js";
import { getDataDir } from "./config.js";

function getProgressPath(): string {
  return path.join(getDataDir(), "progress.json");
}

function defaultProgress(): Progress {
  return {
    solved: {},
    stats: {
      easy: { solved: 0, total: 0 },
      medium: { solved: 0, total: 0 },
      hard: { solved: 0, total: 0 },
    },
  };
}

export function loadProgress(): Progress {
  const progressPath = getProgressPath();
  if (!fs.existsSync(progressPath)) return defaultProgress();
  try {
    return JSON.parse(fs.readFileSync(progressPath, "utf-8"));
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(progress: Progress): void {
  const progressPath = getProgressPath();
  fs.mkdirSync(path.dirname(progressPath), { recursive: true });
  fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2) + "\n");
}

export function markSolved(
  problemId: string,
  language: Language,
  difficulty: Difficulty,
): void {
  const progress = loadProgress();
  const existing = progress.solved[problemId];
  const attempts = existing ? existing.attempts + 1 : 1;

  progress.solved[problemId] = {
    language,
    solvedAt: new Date().toISOString().split("T")[0],
    attempts,
  };

  // Recompute stats for this difficulty
  if (!existing) {
    progress.stats[difficulty].solved += 1;
  }

  saveProgress(progress);
}

export function updateTotals(
  totals: Record<Difficulty, number>,
): void {
  const progress = loadProgress();
  for (const diff of ["easy", "medium", "hard"] as Difficulty[]) {
    progress.stats[diff].total = totals[diff] ?? 0;
  }
  saveProgress(progress);
}

export function isSolved(problemId: string): boolean {
  const progress = loadProgress();
  return problemId in progress.solved;
}

export function getSolvedEntry(
  problemId: string,
): SolvedEntry | undefined {
  const progress = loadProgress();
  return progress.solved[problemId];
}
