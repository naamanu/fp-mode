import fs from "node:fs";
import path from "node:path";

export interface FpModeConfig {
  editor?: string;
  defaultLanguage?: string;
  repoUrl?: string;
  problemsDir?: string;
}

function getConfigPath(): string {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? ".";
  return path.join(home, ".fp-mode", "config.json");
}

export function getConfig(): FpModeConfig {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch {
    return {};
  }
}

export function saveConfig(config: FpModeConfig): void {
  const configPath = getConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
}

export function getDataDir(): string {
  return path.join(
    process.env.HOME ?? process.env.USERPROFILE ?? ".",
    ".fp-mode",
  );
}

export function getWorkspaceDir(): string {
  return path.join(getDataDir(), "workspace");
}
