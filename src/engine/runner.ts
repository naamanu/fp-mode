import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { getDocker } from "./docker.js";
import type { Language, TestCase, SubmissionResult, TestResult } from "../problems/types.js";

const IMAGES: Record<Language, string> = {
  haskell: "fp-mode-haskell",
  ocaml: "fp-mode-ocaml",
};

const TIMEOUT_MS = 10_000;
const MEMORY_LIMIT = 256 * 1024 * 1024; // 256 MB

interface RunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

function generateHaskellHarness(
  functionName: string,
  cases: TestCase[],
): string {
  const caseLines = cases
    .map((c, i) => {
      return `  putStrLn $ "CASE_${i}:" ++ show (${functionName} ${c.input})`;
    })
    .join("\n");

  return `module Main where

import Solution (${functionName})

main :: IO ()
main = do
${caseLines}
`;
}

function generateOCamlHarness(
  functionName: string,
  cases: TestCase[],
): string {
  const caseLines = cases
    .map((c, i) => {
      return `  Printf.printf "CASE_${i}:%s\\n" (string_of_result (Solution.${functionName} ${c.input}))`;
    })
    .join(";\n");

  return `let string_of_result v =
  let buf = Buffer.create 64 in
  let rec pp v =
    match Obj.repr v |> Obj.tag with
    | _ when Obj.repr v |> Obj.is_int ->
      Buffer.add_string buf (string_of_int (Obj.obj (Obj.repr v)))
    | 0 ->
      let size = Obj.repr v |> Obj.size in
      if size = 2 then begin
        let hd = Obj.repr v |> Obj.field 0 in
        let tl = Obj.repr v |> Obj.field 1 in
        Buffer.add_char buf '[';
        pp (Obj.obj hd);
        let rec loop rest =
          if Obj.is_int rest then ()
          else begin
            Buffer.add_string buf ", ";
            pp (Obj.obj (Obj.field rest 0));
            loop (Obj.field rest 1)
          end
        in
        loop tl;
        Buffer.add_char buf ']'
      end else begin
        Buffer.add_char buf '(';
        for i = 0 to size - 1 do
          if i > 0 then Buffer.add_string buf ", ";
          pp (Obj.obj (Obj.repr v |> Obj.field i))
        done;
        Buffer.add_char buf ')'
      end
    | _ -> Buffer.add_string buf "<opaque>"
  in
  pp v;
  Buffer.contents buf

let () =
${caseLines}
`;
}

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "fp-mode-"));
}

async function runContainer(
  image: string,
  workDir: string,
  cmd: string[],
): Promise<RunResult> {
  const docker = getDocker();

  const container = await docker.createContainer({
    Image: image,
    Cmd: cmd,
    WorkingDir: "/workspace",
    HostConfig: {
      Binds: [`${workDir}:/workspace:ro`, `${workDir}/tmp:/tmp:rw`],
      Memory: MEMORY_LIMIT,
      NanoCpus: 1_000_000_000, // 1 CPU
      NetworkMode: "none",
    },
    AttachStdout: true,
    AttachStderr: true,
  });

  await container.start();

  // Wait with timeout
  const result = await Promise.race([
    container.wait(),
    new Promise<{ StatusCode: number }>((_, reject) =>
      setTimeout(async () => {
        try {
          await container.kill();
        } catch {
          // container may have already exited
        }
        reject(new Error("TIME_LIMIT"));
      }, TIMEOUT_MS),
    ),
  ]);

  // Get logs
  const stdoutStream = await container.logs({ stdout: true, stderr: false });
  const stderrStream = await container.logs({ stdout: false, stderr: true });

  const stdout =
    typeof stdoutStream === "string"
      ? stdoutStream
      : demuxDockerOutput(stdoutStream as Buffer);
  const stderr =
    typeof stderrStream === "string"
      ? stderrStream
      : demuxDockerOutput(stderrStream as Buffer);

  await container.remove({ force: true });

  return {
    exitCode: result.StatusCode,
    stdout,
    stderr,
  };
}

function demuxDockerOutput(buffer: Buffer): string {
  // Docker multiplexed stream format: 8-byte header + payload
  let output = "";
  let offset = 0;
  while (offset < buffer.length) {
    if (offset + 8 > buffer.length) break;
    const size = buffer.readUInt32BE(offset + 4);
    offset += 8;
    if (offset + size > buffer.length) break;
    output += buffer.subarray(offset, offset + size).toString("utf-8");
    offset += size;
  }
  return output;
}

export async function runSubmission(
  language: Language,
  solutionCode: string,
  functionName: string,
  cases: TestCase[],
): Promise<SubmissionResult> {
  const image = IMAGES[language];
  const tmpDir = createTempDir();
  const tmpSubDir = path.join(tmpDir, "tmp");
  fs.mkdirSync(tmpSubDir, { recursive: true });

  const startTime = Date.now();

  try {
    if (language === "haskell") {
      return await runHaskell(image, tmpDir, solutionCode, functionName, cases, startTime);
    } else {
      return await runOCaml(image, tmpDir, solutionCode, functionName, cases, startTime);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

async function runHaskell(
  image: string,
  tmpDir: string,
  solutionCode: string,
  functionName: string,
  cases: TestCase[],
  startTime: number,
): Promise<SubmissionResult> {
  fs.writeFileSync(path.join(tmpDir, "Solution.hs"), solutionCode);
  fs.writeFileSync(
    path.join(tmpDir, "Main.hs"),
    generateHaskellHarness(functionName, cases),
  );

  // Compile
  let result: RunResult;
  try {
    result = await runContainer(image, tmpDir, [
      "ghc",
      "-O",
      "-o",
      "/tmp/solution",
      "Solution.hs",
      "Main.hs",
    ]);
  } catch (e) {
    if (e instanceof Error && e.message === "TIME_LIMIT") {
      return {
        status: "time_limit",
        testResults: [],
        totalTimeMs: Date.now() - startTime,
      };
    }
    throw e;
  }

  if (result.exitCode !== 0) {
    return {
      status: "compile_error",
      compileOutput: result.stderr,
      testResults: [],
      totalTimeMs: Date.now() - startTime,
    };
  }

  // Run
  try {
    result = await runContainer(image, tmpDir, ["/tmp/solution"]);
  } catch (e) {
    if (e instanceof Error && e.message === "TIME_LIMIT") {
      return {
        status: "time_limit",
        testResults: [],
        totalTimeMs: Date.now() - startTime,
      };
    }
    throw e;
  }

  if (result.exitCode !== 0) {
    return {
      status: "runtime_error",
      compileOutput: result.stderr,
      testResults: [],
      totalTimeMs: Date.now() - startTime,
    };
  }

  return parseResults(result.stdout, cases, startTime);
}

async function runOCaml(
  image: string,
  tmpDir: string,
  solutionCode: string,
  functionName: string,
  cases: TestCase[],
  startTime: number,
): Promise<SubmissionResult> {
  fs.writeFileSync(path.join(tmpDir, "solution.ml"), solutionCode);
  fs.writeFileSync(
    path.join(tmpDir, "main.ml"),
    generateOCamlHarness(functionName, cases),
  );

  // Compile
  let result: RunResult;
  try {
    result = await runContainer(image, tmpDir, [
      "ocamlfind",
      "ocamlopt",
      "-package",
      "str",
      "-linkpkg",
      "-o",
      "/tmp/solution",
      "solution.ml",
      "main.ml",
    ]);
  } catch (e) {
    if (e instanceof Error && e.message === "TIME_LIMIT") {
      return {
        status: "time_limit",
        testResults: [],
        totalTimeMs: Date.now() - startTime,
      };
    }
    throw e;
  }

  if (result.exitCode !== 0) {
    return {
      status: "compile_error",
      compileOutput: result.stderr,
      testResults: [],
      totalTimeMs: Date.now() - startTime,
    };
  }

  // Run
  try {
    result = await runContainer(image, tmpDir, ["/tmp/solution"]);
  } catch (e) {
    if (e instanceof Error && e.message === "TIME_LIMIT") {
      return {
        status: "time_limit",
        testResults: [],
        totalTimeMs: Date.now() - startTime,
      };
    }
    throw e;
  }

  if (result.exitCode !== 0) {
    return {
      status: "runtime_error",
      compileOutput: result.stderr,
      testResults: [],
      totalTimeMs: Date.now() - startTime,
    };
  }

  return parseResults(result.stdout, cases, startTime);
}

function parseResults(
  stdout: string,
  cases: TestCase[],
  startTime: number,
): SubmissionResult {
  const lines = stdout.trim().split("\n");
  const testResults: TestResult[] = [];
  let allPassed = true;

  for (let i = 0; i < cases.length; i++) {
    const prefix = `CASE_${i}:`;
    const line = lines.find((l) => l.startsWith(prefix));
    const actual = line ? line.slice(prefix.length).trim() : "<no output>";
    const passed = normalizeOutput(actual) === normalizeOutput(cases[i].expected);
    if (!passed) allPassed = false;

    testResults.push({
      caseIndex: i,
      passed,
      input: cases[i].input,
      expected: cases[i].expected,
      actual,
      executionTimeMs: 0,
      hidden: cases[i].hidden,
    });
  }

  return {
    status: allPassed ? "accepted" : "wrong_answer",
    testResults,
    totalTimeMs: Date.now() - startTime,
  };
}

function normalizeOutput(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}
