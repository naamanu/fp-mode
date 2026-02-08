import type { TestCase, SubmissionResult, Language } from "../problems/types.js";
import { runSubmission } from "./runner.js";

export async function judgeSubmission(
  language: Language,
  solutionCode: string,
  functionName: string,
  cases: TestCase[],
): Promise<SubmissionResult> {
  return runSubmission(language, solutionCode, functionName, cases);
}

export async function judgeVisibleOnly(
  language: Language,
  solutionCode: string,
  functionName: string,
  cases: TestCase[],
): Promise<SubmissionResult> {
  const visible = cases.filter((c) => !c.hidden);
  return runSubmission(language, solutionCode, functionName, visible);
}
