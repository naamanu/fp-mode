import React from "react";
import { Box, Text, useInput } from "ink";
import type { SubmissionResult as Result } from "../problems/types.js";
import { StatusBar } from "./StatusBar.js";

interface SubmissionResultProps {
  result: Result;
  onBack: () => void;
}

function statusColor(status: Result["status"]): string {
  switch (status) {
    case "accepted":
      return "green";
    case "wrong_answer":
      return "red";
    case "compile_error":
      return "yellow";
    case "runtime_error":
      return "red";
    case "time_limit":
      return "yellow";
    case "memory_limit":
      return "yellow";
  }
}

function statusLabel(status: Result["status"]): string {
  switch (status) {
    case "accepted":
      return "Accepted";
    case "wrong_answer":
      return "Wrong Answer";
    case "compile_error":
      return "Compile Error";
    case "runtime_error":
      return "Runtime Error";
    case "time_limit":
      return "Time Limit Exceeded";
    case "memory_limit":
      return "Memory Limit Exceeded";
  }
}

export function SubmissionResultView({
  result,
  onBack,
}: SubmissionResultProps) {
  useInput((input, key) => {
    if (input === "q" || key.escape || key.return) {
      onBack();
    }
  });

  const passed = result.testResults.filter((r) => r.passed).length;
  const total = result.testResults.length;

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color={statusColor(result.status)}>
          {statusLabel(result.status)}
        </Text>
        <Text color="gray">
          {" "}
          — {passed}/{total} tests passed ({result.totalTimeMs}ms)
        </Text>
      </Box>

      {result.compileOutput && (
        <Box
          flexDirection="column"
          borderStyle="single"
          borderColor="yellow"
          paddingX={1}
          marginBottom={1}
        >
          <Text color="yellow" bold>
            Compiler Output:
          </Text>
          <Text>{result.compileOutput}</Text>
        </Box>
      )}

      <Box flexDirection="column">
        {result.testResults.map((tr) => (
          <Box key={tr.caseIndex} flexDirection="column" marginBottom={1}>
            <Box>
              <Text color={tr.passed ? "green" : "red"}>
                {tr.passed ? "✓" : "✗"}
              </Text>
              <Text>
                {" "}
                Test {tr.caseIndex + 1}
                {tr.hidden ? " (hidden)" : ""}
              </Text>
            </Box>
            {!tr.hidden && (
              <Box flexDirection="column" marginLeft={2}>
                <Text color="gray">Input: {tr.input}</Text>
                <Text color="gray">Expected: {tr.expected}</Text>
                {!tr.passed && (
                  <Text color="red">Actual: {tr.actual}</Text>
                )}
              </Box>
            )}
            {tr.hidden && !tr.passed && (
              <Box marginLeft={2}>
                <Text color="gray">Hidden test case failed</Text>
              </Box>
            )}
          </Box>
        ))}
      </Box>

      <StatusBar
        bindings={[
          { key: "q/Enter", label: "back" },
        ]}
      />
    </Box>
  );
}
