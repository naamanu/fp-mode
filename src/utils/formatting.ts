import chalk from "chalk";
import type { Difficulty } from "../problems/types.js";

export function colorDifficulty(diff: Difficulty): string {
  switch (diff) {
    case "easy":
      return chalk.green(diff);
    case "medium":
      return chalk.yellow(diff);
    case "hard":
      return chalk.red(diff);
  }
}

export function statusIcon(solved: boolean): string {
  return solved ? chalk.green("✓") : chalk.dim("○");
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

export function padRight(str: string, len: number): string {
  // Account for ANSI escape codes
  const visible = str.replace(/\x1b\[[0-9;]*m/g, "");
  const pad = Math.max(0, len - visible.length);
  return str + " ".repeat(pad);
}
