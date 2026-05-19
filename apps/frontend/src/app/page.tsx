"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";

type RunResponse = {
  status: string;
  jobId: string;
};

type RunResult = {
  jobId: string;
  status: string;
  result: {
    status: string;
    stdout: string;
    stderr: string;
    exitCode: number;
  } | null;
  failedReason: string | null;
};

const API_URL = "http://localhost:3000";

export default function Home() {
  const [code, setCode] = useState(`for i in range(3):
    print(i)`);

  const [result, setResult] = useState<RunResult | null>(null);

  const [isRunning, setIsRunning] = useState(false);

  async function runCode() {
    setIsRunning(true);
    setResult(null);

    try {
      const createResponse = await fetch(`${API_URL}/runs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: "python",
          code,
        }),
      });

      const created: RunResponse = await createResponse.json();

      for (let i = 0; i < 20; i++) {
        const resultResponse = await fetch(`${API_URL}/runs/${created.jobId}`);

        const runResult: RunResult = await resultResponse.json();

        if (runResult.status === "completed" || runResult.status === "failed") {
          setResult(runResult);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setResult({
        jobId: created.jobId,
        status: "timeout",
        result: null,
        failedReason: "Polling timeout exceeded",
      });
    } catch (error) {
      setResult({
        jobId: "",
        status: "failed",
        result: null,
        failedReason: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
        <header>
          <h1 className="text-3xl font-bold">CodeRunner</h1>

          <p className="mt-2 text-neutral-400">
            Secure Python execution in Docker sandbox
          </p>
        </header>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-neutral-400">Language: Python</span>

            <button
              onClick={runCode}
              disabled={isRunning}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-neutral-700"
            >
              {isRunning ? "Running..." : "Run"}
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-neutral-800">
            <Editor
              height="420px"
              defaultLanguage="python"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value ?? "")}
              options={{
                minimap: {
                  enabled: false,
                },
                fontSize: 14,
                automaticLayout: true,
              }}
            />
          </div>
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <h2 className="mb-3 text-xl font-semibold">Result</h2>

          {!result && (
            <p className="text-neutral-500">
              Run code to see execution result.
            </p>
          )}

          {result && (
            <div className="space-y-4">
              <div className="text-sm text-neutral-400">
                Job ID: {result.jobId}
              </div>

              {result.result && (
                <>
                  <div>
                    <h3 className="mb-1 font-medium text-green-400">STDOUT</h3>

                    <pre className="overflow-auto rounded-lg bg-black p-3 text-sm">
                      {result.result.stdout || "(empty)"}
                    </pre>
                  </div>

                  <div>
                    <h3 className="mb-1 font-medium text-red-400">STDERR</h3>

                    <pre className="overflow-auto rounded-lg bg-black p-3 text-sm">
                      {result.result.stderr || "(empty)"}
                    </pre>
                  </div>

                  <div className="text-sm text-neutral-400">
                    Exit code: {result.result.exitCode}
                  </div>
                </>
              )}

              {result.failedReason && (
                <pre className="rounded-lg bg-black p-3 text-sm text-red-400">
                  {result.failedReason}
                </pre>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
