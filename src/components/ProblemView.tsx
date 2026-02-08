import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { Problem, Language } from "../problems/types.js";
import { colorDifficulty } from "../utils/formatting.js";
import { StatusBar } from "./StatusBar.js";

interface ProblemViewProps {
  problem: Problem;
  onBack: () => void;
  onEdit: (language: Language) => void;
  onSubmit: (language: Language) => void;
  onRunTests: (language: Language) => void;
}

export function ProblemView({
  problem,
  onBack,
  onEdit,
  onSubmit,
  onRunTests,
}: ProblemViewProps) {
  const availableLangs = Object.keys(problem.languages) as Language[];
  const [langIdx, setLangIdx] = useState(0);
  const currentLang = availableLangs[langIdx] ?? "haskell";

  useInput((input, key) => {
    if (input === "q" || key.escape) {
      onBack();
    } else if (input === "e") {
      onEdit(currentLang);
    } else if (input === "s") {
      onSubmit(currentLang);
    } else if (input === "r") {
      onRunTests(currentLang);
    } else if (input === "l" || key.tab) {
      setLangIdx((i) => (i + 1) % availableLangs.length);
    }
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1} flexDirection="column">
        <Box gap={2}>
          <Text bold color="cyan">
            {problem.title}
          </Text>
          <Text>{colorDifficulty(problem.difficulty)}</Text>
          <Text color="gray">[{problem.category}]</Text>
        </Box>
        <Box gap={1}>
          {problem.tags.map((tag) => (
            <Text key={tag} color="gray">
              #{tag}
            </Text>
          ))}
        </Box>
      </Box>

      <Box marginBottom={1}>
        <Text>
          Language:{" "}
          {availableLangs.map((lang, idx) => (
            <Text
              key={lang}
              color={idx === langIdx ? "cyan" : "gray"}
              bold={idx === langIdx}
            >
              {idx > 0 ? " | " : ""}
              {lang}
            </Text>
          ))}
        </Text>
      </Box>

      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
        paddingY={1}
      >
        <Text>{problem.description}</Text>
      </Box>

      <Box marginTop={1}>
        <StatusBar
          bindings={[
            { key: "e", label: "edit" },
            { key: "s", label: "submit" },
            { key: "r", label: "run tests" },
            { key: "l", label: "switch lang" },
            { key: "q", label: "back" },
          ]}
        />
      </Box>
    </Box>
  );
}
