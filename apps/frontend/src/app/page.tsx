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
  const [language, setLanguage] = useState<"python" | "javascript">("python");

  const [result, setResult] = useState<RunResult | null>(null);
  const [runs, setRuns] = useState<RunResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.push("/login");
      return;
    }

    loadHistory(token);
  }, [router]);

  async function loadHistory(token?: string) {
    const accessToken = token ?? localStorage.getItem("accessToken");

    if (!accessToken) {
      return;
    }

    const response = await fetch(`${API_URL}/runs/history`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return;
    }

    const data: RunResult[] = await response.json();
    setRuns(data);
  }

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
          language,
          code,
        }),
      });

      const created: RunResponse = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error("Run creation failed");
      }

      for (let i = 0; i < 60; i++) {
        const resultResponse = await fetch(`${API_URL}/runs/${created.runId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const runResult: RunResult = await resultResponse.json();

        if (
          runResult.status === "completed" ||
          runResult.status === "failed" ||
          runResult.status === "timeout"
        ) {
          setResult(runResult);
          await loadHistory(token);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      throw new Error("Polling timeout exceeded");
    } catch (error) {
      setResult({
        id: "",
        language: language,
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

  function openRun(run: RunResult) {
    setCode(run.code);
    setResult(run);
  }

  function logout() {
    localStorage.removeItem("accessToken");
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
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
              className="rounded-lg bg-neutral-800 px-4 py-2 font-medium hover:bg-neutral-700"
            >
              Profile
            </button>

            <button
              onClick={logout}
              className="rounded-lg bg-red-600 px-4 py-2 font-medium hover:bg-red-500"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-6">
            <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="mb-3 flex items-center justify-between">
                <select
                  value={language}
                  onChange={(event) => {
                    const selectedLanguage = event.target.value as
                      | "python"
                      | "javascript";

                    setLanguage(selectedLanguage);

                    if (selectedLanguage === "python") {
                      setCode(`for i in range(3):
                        print(i)`);
                    }

                    if (selectedLanguage === "javascript") {
                      setCode(`for (let i = 0; i < 3; i++) {
                        console.log(i);
                        }`);
                    }
                  }}
                  className="rounded-lg border border-neutral-700 bg-black px-3 py-2 text-sm text-neutral-100"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                </select>

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
                  language={language}
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

          <aside className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Runs</h2>

              <button
                onClick={() => loadHistory()}
                className="rounded-lg bg-neutral-800 px-3 py-1 text-sm hover:bg-neutral-700"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-3">
              {runs.length === 0 && (
                <p className="text-sm text-neutral-500">No runs yet.</p>
              )}

              {runs.map((run) => (
                <button
                  key={run.id}
                  onClick={() => openRun(run)}
                  className="w-full rounded-lg border border-neutral-800 bg-black p-3 text-left hover:border-blue-600"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium uppercase text-neutral-300">
                      {run.language}
                    </span>

                    <span
                      className={
                        run.status === "completed"
                          ? "text-sm text-green-400"
                          : run.status === "failed" || run.status === "timeout"
                            ? "text-sm text-red-400"
                            : "text-sm text-yellow-400"
                      }
                    >
                      {run.status}
                    </span>
                  </div>

                  <pre className="line-clamp-3 whitespace-pre-wrap text-xs text-neutral-400">
                    {run.code}
                  </pre>

                  <div className="mt-2 text-xs text-neutral-600">
                    {new Date(run.createdAt).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
