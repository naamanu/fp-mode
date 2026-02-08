import fs from "node:fs";
import path from "node:path";
import { simpleGit } from "simple-git";
import { getConfig } from "../state/config.js";

const DEFAULT_REPO = "https://github.com/fp-mode/problems.git";

export function getProblemsDir(): string {
  const config = getConfig();
  if (config.problemsDir) return config.problemsDir;
  return path.join(getDataDir(), "problems");
}

function getDataDir(): string {
  return path.join(
    process.env.HOME ?? process.env.USERPROFILE ?? ".",
    ".fp-mode",
  );
}

export function getLocalProblemsDir(): string {
  // Use bundled problems directory if available (for development / standalone)
  const bundled = path.join(process.cwd(), "problems", "problems");
  if (fs.existsSync(bundled)) return bundled;

  // Otherwise use the cloned repo
  const cloned = path.join(getProblemsDir(), "problems");
  if (fs.existsSync(cloned)) return cloned;

  // Fallback to bundled path even if it doesn't exist yet
  return bundled;
}

export async function ensureProblemsRepo(): Promise<string> {
  const problemsDir = getProblemsDir();

  // If we have bundled problems, use them directly
  const bundled = path.join(process.cwd(), "problems", "problems");
  if (fs.existsSync(bundled)) return bundled;

  if (fs.existsSync(path.join(problemsDir, ".git"))) {
    // Repo already cloned, pull latest
    try {
      const git = simpleGit(problemsDir);
      await git.pull();
    } catch {
      // offline is fine, use cached
    }
    return path.join(problemsDir, "problems");
  }

  // Clone the repo
  const config = getConfig();
  const repoUrl = config.repoUrl ?? DEFAULT_REPO;
  fs.mkdirSync(problemsDir, { recursive: true });
  const git = simpleGit();
  await git.clone(repoUrl, problemsDir, ["--depth", "1"]);
  return path.join(problemsDir, "problems");
}
