"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Navbar } from "@/components/Navbar";
import Editor from "@monaco-editor/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Language = "python" | "javascript";

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

  const [language, setLanguage] = useState<Language>("python");
  const [code, setCode] = useState(`for i in range(3):
    print(i)`);
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

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);

    if (nextLanguage === "python") {
      setCode(`for i in range(3):
    print(i)`);
    }

    if (nextLanguage === "javascript") {
      setCode(`for (let i = 0; i < 3; i++) {
  console.log(i);
}`);
    }

    setResult(null);
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
        language,
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
    setLanguage(run.language as Language);
    setCode(run.code);
    setResult(run);
  }

  function logout() {
    localStorage.removeItem("accessToken");
    router.push("/login");
  }

  return (
    <main
      className="min-h-screen"
      style={{
        background: "var(--app-bg)",
        color: "var(--app-text)",
      }}
    >
      <Navbar />
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <header
          className="rounded-xl border p-5"
          style={{
            background: "var(--app-panel)",
            borderColor: "var(--app-border)",
          }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">CodeRunner</h1>
              <p className="mt-2" style={{ color: "var(--app-muted)" }}>
                Secure Python and JavaScript execution in Docker sandbox
              </p>
            </div>

            <div className="flex flex-wrap gap-3"></div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-6">
            <section
              className="rounded-xl border p-4"
              style={{
                background: "var(--app-panel)",
                borderColor: "var(--app-border)",
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <select
                  value={language}
                  onChange={(event) =>
                    changeLanguage(event.target.value as Language)
                  }
                  className="rounded-lg border px-3 py-2 text-sm"
                  style={{
                    background: "var(--app-code-bg)",
                    color: "var(--app-text)",
                    borderColor: "var(--app-border)",
                  }}
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                </select>

                <button
                  onClick={runCode}
                  disabled={isRunning}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-neutral-700"
                >
                  {isRunning ? "Running..." : "Run"}
                </button>
              </div>

              <div
                className="overflow-hidden rounded-lg border"
                style={{ borderColor: "var(--app-border)" }}
              >
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

            <section
              className="rounded-xl border p-4"
              style={{
                background: "var(--app-panel)",
                borderColor: "var(--app-border)",
              }}
            >
              <h2 className="mb-3 text-xl font-semibold">Result</h2>

              {!result && (
                <p style={{ color: "var(--app-muted)" }}>
                  Run code to see execution result.
                </p>
              )}

              {result && (
                <div className="space-y-4">
                  <div
                    className="text-sm"
                    style={{ color: "var(--app-muted)" }}
                  >
                    Run ID: {result.id || "-"} | Status: {result.status}
                  </div>

                  <div>
                    <h3 className="mb-1 font-medium text-green-400">STDOUT</h3>
                    <pre
                      className="overflow-auto rounded-lg p-3 text-sm"
                      style={{
                        background: "var(--app-code-bg)",
                        color: "var(--app-text)",
                      }}
                    >
                      {result.stdout || "(empty)"}
                    </pre>
                  </div>

                  <div>
                    <h3 className="mb-1 font-medium text-red-400">STDERR</h3>
                    <pre
                      className="overflow-auto rounded-lg p-3 text-sm"
                      style={{
                        background: "var(--app-code-bg)",
                        color: "var(--app-text)",
                      }}
                    >
                      {result.stderr || "(empty)"}
                    </pre>
                  </div>

                  <div
                    className="text-sm"
                    style={{ color: "var(--app-muted)" }}
                  >
                    Exit code: {result.exitCode ?? "-"}
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside
            className="rounded-xl border p-4"
            style={{
              background: "var(--app-panel)",
              borderColor: "var(--app-border)",
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Runs</h2>

              <button
                onClick={() => loadHistory()}
                className="rounded-lg px-3 py-1 text-sm transition"
                style={{
                  background: "var(--app-panel-soft)",
                  color: "var(--app-text)",
                }}
              >
                Refresh
              </button>
            </div>

            <div className="space-y-3">
              {runs.length === 0 && (
                <p className="text-sm" style={{ color: "var(--app-muted)" }}>
                  No runs yet.
                </p>
              )}

              {runs.map((run) => (
                <button
                  key={run.id}
                  onClick={() => openRun(run)}
                  className="w-full rounded-lg border p-3 text-left transition hover:border-blue-600"
                  style={{
                    background: "var(--app-code-bg)",
                    borderColor: "var(--app-border)",
                  }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium uppercase">
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

                  <pre
                    className="line-clamp-3 whitespace-pre-wrap text-xs"
                    style={{ color: "var(--app-muted)" }}
                  >
                    {run.code}
                  </pre>

                  <div
                    className="mt-2 text-xs"
                    style={{ color: "var(--app-muted)" }}
                  >
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
