import React, { useState, useEffect } from "react";
import { Box, Text, useApp } from "ink";
import { ProblemList } from "./ProblemList.js";
import { ProblemView } from "./ProblemView.js";
import { SubmissionResultView } from "./SubmissionResult.js";
import { loadAllProblems, loadTestCases, loadStarterCode } from "../problems/loader.js";
import { getLocalProblemsDir } from "../problems/repo.js";
import { loadProgress, markSolved } from "../state/progress.js";
import { getWorkspaceDir } from "../state/config.js";
import { openInEditor } from "../utils/editor.js";
import { judgeSubmission, judgeVisibleOnly } from "../engine/judge.js";
import type { Problem, Language, SubmissionResult } from "../problems/types.js";
import fs from "node:fs";
import path from "node:path";

type View = "list" | "problem" | "result" | "loading";

export function App() {
  const { exit } = useApp();
  const [view, setView] = useState<View>("list");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const problemsDir = getLocalProblemsDir();
    const loaded = loadAllProblems(problemsDir);
    setProblems(loaded);

    const progress = loadProgress();
    setSolvedIds(new Set(Object.keys(progress.solved)));
  }, []);

  function handleSelect(problem: Problem) {
    setSelectedProblem(problem);
    setView("problem");
  }

  function getWorkspacePath(problem: Problem, language: Language): string {
    const ext = language === "haskell" ? "Solution.hs" : "solution.ml";
    return path.join(getWorkspaceDir(), problem.id, ext);
  }

  function ensureWorkspaceFile(problem: Problem, language: Language): string {
    const filePath = getWorkspacePath(problem, language);
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      const starter = loadStarterCode(problem.path, language);
      fs.writeFileSync(filePath, starter);
    }
    return filePath;
  }

  async function handleEdit(language: Language) {
    if (!selectedProblem) return;
    const filePath = ensureWorkspaceFile(selectedProblem, language);
    try {
      await openInEditor(filePath);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to open editor");
    }
  }

  async function handleSubmit(language: Language) {
    if (!selectedProblem) return;
    const filePath = getWorkspacePath(selectedProblem, language);
    if (!fs.existsSync(filePath)) {
      setError("No solution file found. Press 'e' to create one first.");
      return;
    }
    setView("loading");
    setLoadingMsg("Submitting solution...");
    try {
      const code = fs.readFileSync(filePath, "utf-8");
      const testSuite = loadTestCases(selectedProblem.path);
      const langConfig = selectedProblem.languages[language];
      if (!langConfig) {
        setError(`Language "${language}" not supported for this problem.`);
        setView("problem");
        return;
      }
      const res = await judgeSubmission(
        language,
        code,
        langConfig.functionName,
        testSuite.cases,
      );
      setResult(res);
      if (res.status === "accepted") {
        markSolved(selectedProblem.id, language, selectedProblem.difficulty);
        setSolvedIds((prev) => new Set([...prev, selectedProblem.id]));
      }
      setView("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
      setView("problem");
    }
  }

  async function handleRunTests(language: Language) {
    if (!selectedProblem) return;
    const filePath = getWorkspacePath(selectedProblem, language);
    if (!fs.existsSync(filePath)) {
      setError("No solution file found. Press 'e' to create one first.");
      return;
    }
    setView("loading");
    setLoadingMsg("Running visible tests...");
    try {
      const code = fs.readFileSync(filePath, "utf-8");
      const testSuite = loadTestCases(selectedProblem.path);
      const langConfig = selectedProblem.languages[language];
      if (!langConfig) {
        setError(`Language "${language}" not supported for this problem.`);
        setView("problem");
        return;
      }
      const res = await judgeVisibleOnly(
        language,
        code,
        langConfig.functionName,
        testSuite.cases,
      );
      setResult(res);
      setView("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Test run failed");
      setView("problem");
    }
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: {error}</Text>
        <Text color="gray">Press Ctrl+C to exit</Text>
      </Box>
    );
  }

  switch (view) {
    case "loading":
      return (
        <Box>
          <Text color="cyan">⏳ {loadingMsg}</Text>
        </Box>
      );
    case "list":
      return (
        <ProblemList
          problems={problems}
          solvedIds={solvedIds}
          onSelect={handleSelect}
          onQuit={() => exit()}
        />
      );
    case "problem":
      if (!selectedProblem) return null;
      return (
        <ProblemView
          problem={selectedProblem}
          onBack={() => setView("list")}
          onEdit={handleEdit}
          onSubmit={handleSubmit}
          onRunTests={handleRunTests}
        />
      );
    case "result":
      if (!result) return null;
      return (
        <SubmissionResultView
          result={result}
          onBack={() => setView("problem")}
        />
      );
  }
}
