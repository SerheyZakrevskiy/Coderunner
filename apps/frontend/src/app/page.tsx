"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";

type RunResponse = {
  status: string;
  runId: string;
};

type RunResult = {
  id: string;
  language: string;
  code: string;
  stdout: string | null;
  stderr: string | null;
  status: string;
  exitCode: number | null;
  createdAt: string;
  userId: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export default function Home() {
  const router = useRouter();

  const [code, setCode] = useState(`for i in range(3):
    print(i)`);

  const [result, setResult] = useState<RunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.push("/login");
    }
  }, [router]);

  async function runCode() {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.push("/login");
      return;
    }

    setIsRunning(true);
    setResult(null);

    try {
      const createResponse = await fetch(`${API_URL}/runs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          language: "python",
          code,
        }),
      });

      const created: RunResponse = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(JSON.stringify(created));
      }

      for (let i = 0; i < 60; i++) {
        const resultResponse = await fetch(`${API_URL}/runs/${created.runId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const runResult: RunResult = await resultResponse.json();

        if (!resultResponse.ok) {
          throw new Error(JSON.stringify(runResult));
        }

        if (
          runResult.status === "completed" ||
          runResult.status === "failed" ||
          runResult.status === "timeout"
        ) {
          setResult(runResult);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      throw new Error("Polling timeout exceeded");
    } catch (error) {
      setResult({
        id: "",
        language: "python",
        code,
        stdout: "",
        stderr: error instanceof Error ? error.message : "Unknown error",
        status: "failed",
        exitCode: 1,
        createdAt: "",
        userId: "",
      });
    } finally {
      setIsRunning(false);
    }
  }

  function logout() {
    localStorage.removeItem("accessToken");
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">CodeRunner</h1>

            <p className="mt-2 text-neutral-400">
              Secure Python execution in Docker sandbox
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/profile")}
              className="rounded-lg bg-neutral-800 px-4 py-2 font-medium text-white hover:bg-neutral-700"
            >
              Profile
            </button>

            <button
              onClick={logout}
              className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-500"
            >
              Logout
            </button>
          </div>
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

          {!result && !isRunning && (
            <p className="text-neutral-500">
              Run code to see execution result.
            </p>
          )}

          {isRunning && (
            <p className="text-blue-400">
              Code is running, waiting for result...
            </p>
          )}

          {result && (
            <div className="space-y-4">
              <div className="text-sm text-neutral-400">
                Run ID: {result.id || "-"} | Status: {result.status}
              </div>

              <div>
                <h3 className="mb-1 font-medium text-green-400">STDOUT</h3>

                <pre className="overflow-auto rounded-lg bg-black p-3 text-sm">
                  {result.stdout || "(empty)"}
                </pre>
              </div>

              <div>
                <h3 className="mb-1 font-medium text-red-400">STDERR</h3>

                <pre className="overflow-auto rounded-lg bg-black p-3 text-sm">
                  {result.stderr || "(empty)"}
                </pre>
              </div>

              <div className="text-sm text-neutral-400">
                Exit code: {result.exitCode ?? "-"}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
