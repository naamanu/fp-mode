import React from "react";
import { render } from "ink";
import { Command } from "commander";
import chalk from "chalk";
import fs from "node:fs";
import path from "node:path";
import { App } from "./components/App.js";
import { loadAllProblems, loadStarterCode, loadTestCases } from "./problems/loader.js";
import { getLocalProblemsDir } from "./problems/repo.js";
import { loadProgress } from "./state/progress.js";
import { getWorkspaceDir } from "./state/config.js";
import { openInEditor } from "./utils/editor.js";
import { colorDifficulty, statusIcon } from "./utils/formatting.js";
import { judgeSubmission } from "./engine/judge.js";
import { markSolved } from "./state/progress.js";
import { isDockerAvailable } from "./engine/docker.js";
import type { Language } from "./problems/types.js";

function getProblemsDir(): string {
  return getLocalProblemsDir();
}

export function createCli(): Command {
  const program = new Command();

  program
    .name("fp-mode")
    .description(
      "A CLI online judge for functional programming — Haskell & OCaml",
    )
    .version("0.1.0");

  // Default command: launch TUI
  program
    .action(() => {
      render(React.createElement(App));
    });

  // List problems
  program
    .command("list")
    .description("List all problems")
    .option("-d, --difficulty <level>", "Filter by difficulty (easy/medium/hard)")
    .action((opts) => {
      const problemsDir = getProblemsDir();
      let problems = loadAllProblems(problemsDir);
      const progress = loadProgress();
      const solvedIds = new Set(Object.keys(progress.solved));

      if (opts.difficulty) {
        problems = problems.filter((p) => p.difficulty === opts.difficulty);
      }

      if (problems.length === 0) {
        console.log(chalk.gray("No problems found."));
        return;
      }

      console.log(
        chalk.magenta.bold("\n  fp-mode") +
          chalk.gray(" — Functional Programming Challenges\n"),
      );

      for (const p of problems) {
        const icon = statusIcon(solvedIds.has(p.id));
        const diff = colorDifficulty(p.difficulty);
        const langs = Object.keys(p.languages).join(", ");
        console.log(
          `  ${icon} ${diff} ${chalk.bold(p.title)} ${chalk.gray(`[${p.category}]`)} ${chalk.dim(`(${langs})`)}`,
        );
      }
      console.log();
    });

  // Start working on a problem
  program
    .command("start <slug>")
    .description("Create workspace and open editor for a problem")
    .option("-l, --lang <language>", "Language to use (haskell/ocaml)", "haskell")
    .action(async (slug, opts) => {
      const problemsDir = getProblemsDir();
      const problems = loadAllProblems(problemsDir);
      const problem = problems.find((p) => p.id === slug);

      if (!problem) {
        console.error(chalk.red(`Problem "${slug}" not found.`));
        console.log(chalk.gray('Run "fp-mode list" to see available problems.'));
        process.exit(1);
      }

      const language = opts.lang as Language;
      if (!problem.languages[language]) {
        console.error(
          chalk.red(
            `Problem "${slug}" does not support language "${language}".`,
          ),
        );
        const available = Object.keys(problem.languages).join(", ");
        console.log(chalk.gray(`Available: ${available}`));
        process.exit(1);
      }

      const ext = language === "haskell" ? "Solution.hs" : "solution.ml";
      const filePath = path.join(getWorkspaceDir(), slug, ext);

      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        const starter = loadStarterCode(problem.path, language);
        fs.writeFileSync(filePath, starter);
        console.log(chalk.green(`Created workspace: ${filePath}`));
      } else {
        console.log(chalk.yellow(`Workspace exists: ${filePath}`));
      }

      console.log(chalk.cyan("Opening editor..."));
      try {
        await openInEditor(filePath);
        console.log(chalk.green("Editor closed."));
        console.log(
          chalk.gray(`Submit with: fp-mode submit ${slug} --lang ${language}`),
        );
      } catch (e) {
        console.error(
          chalk.red(e instanceof Error ? e.message : "Failed to open editor"),
        );
      }
    });

  // Submit a solution
  program
    .command("submit <slug>")
    .description("Submit solution for judging")
    .option("-l, --lang <language>", "Language (haskell/ocaml)", "haskell")
    .action(async (slug, opts) => {
      const problemsDir = getProblemsDir();
      const problems = loadAllProblems(problemsDir);
      const problem = problems.find((p) => p.id === slug);

      if (!problem) {
        console.error(chalk.red(`Problem "${slug}" not found.`));
        process.exit(1);
      }

      const language = opts.lang as Language;
      const ext = language === "haskell" ? "Solution.hs" : "solution.ml";
      const filePath = path.join(getWorkspaceDir(), slug, ext);

      if (!fs.existsSync(filePath)) {
        console.error(chalk.red("No solution file found."));
        console.log(
          chalk.gray(`Run "fp-mode start ${slug} --lang ${language}" first.`),
        );
        process.exit(1);
      }

      // Check Docker
      const dockerOk = await isDockerAvailable();
      if (!dockerOk) {
        console.error(chalk.red("Docker is not running."));
        console.log(
          chalk.gray("Please start Docker Desktop and try again."),
        );
        process.exit(1);
      }

      const code = fs.readFileSync(filePath, "utf-8");
      const testSuite = loadTestCases(problem.path);
      const langConfig = problem.languages[language]!;

      console.log(chalk.cyan("⏳ Judging submission..."));

      try {
        const result = await judgeSubmission(
          language,
          code,
          langConfig.functionName,
          testSuite.cases,
        );

        // Display results
        const passed = result.testResults.filter((r) => r.passed).length;
        const total = result.testResults.length;

        console.log();
        if (result.status === "accepted") {
          console.log(chalk.green.bold("✓ Accepted!"));
          markSolved(problem.id, language, problem.difficulty);
        } else if (result.status === "compile_error") {
          console.log(chalk.yellow.bold("✗ Compile Error"));
          if (result.compileOutput) {
            console.log(chalk.yellow(result.compileOutput));
          }
        } else if (result.status === "time_limit") {
          console.log(chalk.yellow.bold("✗ Time Limit Exceeded"));
        } else if (result.status === "runtime_error") {
          console.log(chalk.red.bold("✗ Runtime Error"));
          if (result.compileOutput) {
            console.log(chalk.red(result.compileOutput));
          }
        } else {
          console.log(chalk.red.bold("✗ Wrong Answer"));
        }

        console.log(
          chalk.gray(`${passed}/${total} tests passed (${result.totalTimeMs}ms)\n`),
        );

        for (const tr of result.testResults) {
          const icon = tr.passed ? chalk.green("✓") : chalk.red("✗");
          const label = tr.hidden ? "(hidden)" : "";
          console.log(`  ${icon} Test ${tr.caseIndex + 1} ${label}`);
          if (!tr.hidden && !tr.passed) {
            console.log(chalk.gray(`    Input:    ${tr.input}`));
            console.log(chalk.gray(`    Expected: ${tr.expected}`));
            console.log(chalk.red(`    Actual:   ${tr.actual}`));
          }
        }
        console.log();
      } catch (e) {
        console.error(
          chalk.red(e instanceof Error ? e.message : "Submission failed"),
        );
        process.exit(1);
      }
    });

  // Status command
  program
    .command("status")
    .description("Show progress summary")
    .action(() => {
      const progress = loadProgress();
      const solvedCount = Object.keys(progress.solved).length;

      console.log(
        chalk.magenta.bold("\n  fp-mode") +
          chalk.gray(" — Progress Summary\n"),
      );

      for (const diff of ["easy", "medium", "hard"] as const) {
        const stats = progress.stats[diff];
        const color = diff === "easy" ? "green" : diff === "medium" ? "yellow" : "red";
        const bar = stats.total > 0
          ? `${"█".repeat(stats.solved)}${"░".repeat(stats.total - stats.solved)}`
          : "no problems";
        console.log(
          `  ${chalk[color](diff.padEnd(8))} ${bar} ${stats.solved}/${stats.total}`,
        );
      }

      console.log(chalk.gray(`\n  Total solved: ${solvedCount}\n`));

      if (solvedCount > 0) {
        console.log(chalk.gray("  Recent:"));
        const entries = Object.entries(progress.solved)
          .sort(([, a], [, b]) => b.solvedAt.localeCompare(a.solvedAt))
          .slice(0, 5);
        for (const [id, entry] of entries) {
          console.log(
            chalk.gray(
              `    ${chalk.green("✓")} ${id} (${entry.language}, ${entry.solvedAt})`,
            ),
          );
        }
        console.log();
      }
    });

  // Setup command — build Docker images
  program
    .command("setup")
    .description("Build Docker images for Haskell and OCaml")
    .action(async () => {
      const dockerOk = await isDockerAvailable();
      if (!dockerOk) {
        console.error(chalk.red("Docker is not running."));
        process.exit(1);
      }

      console.log(chalk.cyan("Building Docker images..."));

      const { buildImage } = await import("./engine/docker.js");

      for (const lang of ["haskell", "ocaml"]) {
        const dockerDir = path.join(process.cwd(), "docker", lang);
        if (!fs.existsSync(dockerDir)) {
          console.log(chalk.yellow(`Skipping ${lang}: no Dockerfile found`));
          continue;
        }
        console.log(chalk.gray(`  Building fp-mode-${lang}...`));
        try {
          await buildImage("Dockerfile", dockerDir, `fp-mode-${lang}`);
          console.log(chalk.green(`  ✓ fp-mode-${lang} built`));
        } catch (e) {
          console.error(
            chalk.red(
              `  ✗ ${lang}: ${e instanceof Error ? e.message : "build failed"}`,
            ),
          );
        }
      }
      console.log(chalk.green("\nSetup complete!"));
    });

  return program;
}
