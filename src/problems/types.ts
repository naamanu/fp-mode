export type Difficulty = "easy" | "medium" | "hard";
export type Language = "haskell" | "ocaml";

export interface LanguageConfig {
  functionName: string;
  moduleName?: string;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: Difficulty;
  category: string;
  tags: string[];
  description: string;
  languages: Partial<Record<Language, LanguageConfig>>;
  path: string;
}

export interface TestCase {
  input: string;
  expected: string;
  hidden: boolean;
}

export interface TestSuite {
  cases: TestCase[];
}

export interface TestResult {
  caseIndex: number;
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  executionTimeMs: number;
  hidden: boolean;
}

export type SubmissionStatus =
  | "accepted"
  | "wrong_answer"
  | "compile_error"
  | "runtime_error"
  | "time_limit"
  | "memory_limit";

export interface SubmissionResult {
  status: SubmissionStatus;
  compileOutput?: string;
  testResults: TestResult[];
  totalTimeMs: number;
}

export interface SolvedEntry {
  language: Language;
  solvedAt: string;
  attempts: number;
}

export interface DifficultyStats {
  solved: number;
  total: number;
}

export interface Progress {
  solved: Record<string, SolvedEntry>;
  stats: Record<Difficulty, DifficultyStats>;
}
