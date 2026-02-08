import { spawn } from "node:child_process";
import { getConfig } from "../state/config.js";

export function getEditorCommand(): string {
  const config = getConfig();
  return config.editor ?? process.env.EDITOR ?? process.env.VISUAL ?? "vim";
}

export function openInEditor(filePath: string): Promise<void> {
  const editor = getEditorCommand();
  const parts = editor.split(/\s+/);
  const cmd = parts[0];
  const args = [...parts.slice(1), filePath];

  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
    });

    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Editor exited with code ${code}`));
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to open editor "${editor}": ${err.message}`));
    });
  });
}
