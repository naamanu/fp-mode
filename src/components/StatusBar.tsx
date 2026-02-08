import React from "react";
import { Box, Text } from "ink";

interface KeyBinding {
  key: string;
  label: string;
}

interface StatusBarProps {
  bindings: KeyBinding[];
}

export function StatusBar({ bindings }: StatusBarProps) {
  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1}>
      {bindings.map((b, i) => (
        <Box key={b.key} marginRight={2}>
          <Text color="cyan" bold>
            {b.key}
          </Text>
          <Text color="gray"> {b.label}</Text>
        </Box>
      ))}
    </Box>
  );
}
