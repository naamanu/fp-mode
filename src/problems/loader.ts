import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import type { Problem, TestSuite, Difficulty } from "./types.js";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export function loadProblem(problemDir: string): Problem {
  const yamlPath = path.join(problemDir, "problem.yaml");
  const raw = fs.readFileSync(yamlPath, "utf-8");
  const data = parseYaml(raw);
  return {
    id: data.id,
    title: data.title,
    difficulty: data.difficulty,
    category: data.category,
    tags: data.tags ?? [],
    description: data.description,
    languages: data.languages ?? {},
    path: problemDir,
  };
}

export function loadTestCases(problemDir: string): TestSuite {
  const casesPath = path.join(problemDir, "tests", "cases.yaml");
  const raw = fs.readFileSync(casesPath, "utf-8");
  const data = parseYaml(raw);
  return {
    cases: (data.cases ?? []).map((c: Record<string, unknown>) => ({
      input: String(c.input),
      expected: String(c.expected),
      hidden: c.hidden === true,
    })),
  };
}

export function loadStarterCode(
  problemDir: string,
  language: string,
): string {
  const ext = language === "haskell" ? "haskell.hs" : "ocaml.ml";
  const starterPath = path.join(problemDir, "starters", ext);
  if (!fs.existsSync(starterPath)) {
    throw new Error(
      `No starter code for language "${language}" in ${problemDir}`,
    );
  }
  return fs.readFileSync(starterPath, "utf-8");
}

export function loadAllProblems(problemsRoot: string): Problem[] {
  const problems: Problem[] = [];
  for (const difficulty of DIFFICULTIES) {
    const diffDir = path.join(problemsRoot, difficulty);
    if (!fs.existsSync(diffDir)) continue;
    const entries = fs.readdirSync(diffDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const problemDir = path.join(diffDir, entry.name);
      const yamlPath = path.join(problemDir, "problem.yaml");
      if (!fs.existsSync(yamlPath)) continue;
      try {
        problems.push(loadProblem(problemDir));
      } catch {
        // skip malformed problems
      }
    }
  }
  return problems;
}
