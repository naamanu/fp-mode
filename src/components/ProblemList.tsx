import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { Problem } from "../problems/types.js";
import { colorDifficulty, statusIcon } from "../utils/formatting.js";
import { StatusBar } from "./StatusBar.js";

interface ProblemListProps {
  problems: Problem[];
  solvedIds: Set<string>;
  onSelect: (problem: Problem) => void;
  onQuit: () => void;
}

export function ProblemList({
  problems,
  solvedIds,
  onSelect,
  onQuit,
}: ProblemListProps) {
  const [cursor, setCursor] = useState(0);
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = filter
    ? problems.filter((p) => p.difficulty === filter)
    : problems;

  useInput((input, key) => {
    if (key.upArrow || input === "k") {
      setCursor((c) => Math.max(0, c - 1));
    } else if (key.downArrow || input === "j") {
      setCursor((c) => Math.min(filtered.length - 1, c + 1));
    } else if (key.return) {
      if (filtered[cursor]) {
        onSelect(filtered[cursor]);
      }
    } else if (input === "1") {
      setFilter(filter === "easy" ? null : "easy");
      setCursor(0);
    } else if (input === "2") {
      setFilter(filter === "medium" ? null : "medium");
      setCursor(0);
    } else if (input === "3") {
      setFilter(filter === "hard" ? null : "hard");
      setCursor(0);
    } else if (input === "q") {
      onQuit();
    }
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="magenta">
          {"  fp-mode"}
        </Text>
        <Text color="gray"> — Functional Programming Challenges</Text>
      </Box>

      <Box marginBottom={1} gap={2}>
        <Text color={filter === null ? "white" : "gray"}>
          [All]
        </Text>
        <Text color={filter === "easy" ? "green" : "gray"}>
          [1] Easy
        </Text>
        <Text color={filter === "medium" ? "yellow" : "gray"}>
          [2] Medium
        </Text>
        <Text color={filter === "hard" ? "red" : "gray"}>
          [3] Hard
        </Text>
      </Box>

      <Box flexDirection="column">
        {filtered.map((problem, idx) => (
          <Box key={problem.id}>
            <Text color={idx === cursor ? "cyan" : undefined}>
              {idx === cursor ? "❯ " : "  "}
              {statusIcon(solvedIds.has(problem.id))}{" "}
              {colorDifficulty(problem.difficulty)}{" "}
              <Text bold={idx === cursor}>{problem.title}</Text>
              <Text color="gray"> [{problem.category}]</Text>
            </Text>
          </Box>
        ))}
      </Box>

      {filtered.length === 0 && (
        <Box marginY={1}>
          <Text color="gray">No problems found.</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <StatusBar
          bindings={[
            { key: "↑/↓", label: "navigate" },
            { key: "Enter", label: "select" },
            { key: "1/2/3", label: "filter" },
            { key: "q", label: "quit" },
          ]}
        />
      </Box>
    </Box>
  );
}
