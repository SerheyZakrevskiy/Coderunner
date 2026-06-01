"use client";

import { Navbar } from "@/components/Navbar";
import Editor from "@monaco-editor/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Language = "python" | "javascript" | "cpp";

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

type HealthStatus = {
  status: string;
  api: string;
  database: string;
  redis: string;
  timestamp: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export default function Home() {
  const router = useRouter();

  const [language, setLanguage] = useState<Language>("python");
  const [code, setCode] = useState(`for i in range(3):
    print(i)`);
  const [result, setResult] = useState<RunResult | null>(null);
  const [runs, setRuns] = useState<RunResult[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.push("/login");
      return;
    }

    loadHistory(token);
    loadHealth();
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

  async function loadHealth() {
    try {
      const response = await fetch(`${API_URL}/health`);

      if (!response.ok) {
        return;
      }

      const data: HealthStatus = await response.json();
      setHealth(data);
    } catch {
      setHealth(null);
    }
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

    if (nextLanguage === "cpp") {
      setCode(`#include <iostream>

int main() {
    std::cout << "Hello from C++" << std::endl;
    return 0;
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

  function getStatusClass(status: string) {
    if (status === "completed" || status === "connected" || status === "ok") {
      return "text-green-400";
    }

    if (
      status === "failed" ||
      status === "timeout" ||
      status === "disconnected"
    ) {
      return "text-red-400";
    }

    return "text-yellow-400";
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

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_390px]">
        <div className="space-y-6">
          <section
            className="rounded-2xl border p-4"
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
                <option value="cpp">C++</option>
              </select>

              <button
                onClick={runCode}
                disabled={isRunning}
                className="rounded-xl bg-blue-600 px-5 py-2 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-neutral-700"
              >
                {isRunning ? "Running..." : "Run"}
              </button>
            </div>

            <div
              className="overflow-hidden rounded-xl border"
              style={{ borderColor: "var(--app-border)" }}
            >
              <Editor
                height="420px"
                language={language === "cpp" ? "cpp" : language}
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
            className="rounded-2xl border p-5"
            style={{
              background: "var(--app-panel)",
              borderColor: "var(--app-border)",
            }}
          >
            <h2 className="mb-3 text-xl font-bold">Result</h2>

            {!result && (
              <p style={{ color: "var(--app-muted)" }}>
                Run code to see execution result.
              </p>
            )}

            {result && (
              <div className="space-y-4">
                <div className="text-sm" style={{ color: "var(--app-muted)" }}>
                  Run ID: {result.id || "-"} | Status:{" "}
                  <span className={getStatusClass(result.status)}>
                    {result.status}
                  </span>
                </div>

                <div>
                  <h3 className="mb-1 font-medium text-green-400">STDOUT</h3>
                  <pre
                    className="max-h-48 overflow-auto rounded-xl p-3 text-sm"
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
                    className="max-h-48 overflow-auto rounded-xl p-3 text-sm"
                    style={{
                      background: "var(--app-code-bg)",
                      color: "var(--app-text)",
                    }}
                  >
                    {result.stderr || "(empty)"}
                  </pre>
                </div>

                <div className="text-sm" style={{ color: "var(--app-muted)" }}>
                  Exit code: {result.exitCode ?? "-"}
                </div>
              </div>
            )}
          </section>

          <section
            className="rounded-2xl border p-5"
            style={{
              background: "var(--app-panel)",
              borderColor: "var(--app-border)",
            }}
          >
            <h2 className="mb-4 text-xl font-bold">Sandbox Environment</h2>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <h3 className="mb-2 font-semibold text-blue-400">Languages</h3>
                <ul className="space-y-1 text-sm">
                  <li>Python 3</li>
                  <li>JavaScript / Node.js</li>
                  <li>C++17</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-green-400">
                  Resource Limits
                </h3>
                <ul className="space-y-1 text-sm">
                  <li>CPU: 0.5 core</li>
                  <li>RAM: 128–256 MB</li>
                  <li>Timeout: 5–8 sec</li>
                  <li>PIDs: 64</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-purple-400">
                  Isolation
                </h3>
                <ul className="space-y-1 text-sm">
                  <li>Docker container</li>
                  <li>Network disabled</li>
                  <li>Read-only filesystem</li>
                  <li>tmpfs workspace</li>
                </ul>
              </div>
            </div>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section
              className="rounded-2xl border p-5"
              style={{
                background: "var(--app-panel)",
                borderColor: "var(--app-border)",
              }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">System Status</h2>

                <button
                  onClick={loadHealth}
                  className="rounded-lg px-3 py-1 text-sm font-medium"
                  style={{
                    background: "var(--app-panel-soft)",
                    color: "var(--app-text)",
                  }}
                >
                  Refresh
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>API</span>
                  <span className={getStatusClass(health?.api ?? "unknown")}>
                    {health?.api ?? "unknown"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Database</span>
                  <span
                    className={getStatusClass(health?.database ?? "unknown")}
                  >
                    {health?.database ?? "unknown"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Redis</span>
                  <span className={getStatusClass(health?.redis ?? "unknown")}>
                    {health?.redis ?? "unknown"}
                  </span>
                </div>

                <div
                  className="pt-2 text-xs"
                  style={{ color: "var(--app-muted)" }}
                >
                  Last check:{" "}
                  {health?.timestamp
                    ? new Date(health.timestamp).toLocaleString()
                    : "-"}
                </div>
              </div>
            </section>

            <section
              className="rounded-2xl border p-5"
              style={{
                background: "var(--app-panel)",
                borderColor: "var(--app-border)",
              }}
            >
              <h2 className="mb-4 text-xl font-bold">Execution Pipeline</h2>

              <div className="space-y-2 text-sm">
                {[
                  "Frontend",
                  "Backend API",
                  "Redis Queue",
                  "Worker",
                  "Docker Sandbox",
                  "Result",
                ].map((item, index, array) => (
                  <div key={item}>
                    <div
                      className="rounded-lg border px-3 py-2"
                      style={{
                        background: "var(--app-code-bg)",
                        borderColor: "var(--app-border)",
                      }}
                    >
                      {item}
                    </div>

                    {index < array.length - 1 && (
                      <div className="py-1 text-center text-blue-400">↓</div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section
            className="rounded-2xl border p-5"
            style={{
              background: "var(--app-panel)",
              borderColor: "var(--app-border)",
            }}
          >
            <h2 className="mb-4 text-xl font-bold">Project Features</h2>

            <div className="grid gap-3 text-sm md:grid-cols-3">
              {[
                "JWT Authentication",
                "Docker Isolation",
                "Resource Limits",
                "Run History",
                "Swagger API",
                "Health Check",
                "Dark / Light Theme",
                "Multiple Languages",
                "PostgreSQL Storage",
              ].map((feature) => (
                <div
                  key={feature}
                  className="rounded-lg border px-3 py-2"
                  style={{
                    background: "var(--app-code-bg)",
                    borderColor: "var(--app-border)",
                  }}
                >
                  <span className="text-green-400">✓</span> {feature}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside
          className="rounded-2xl border p-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-120px)] lg:overflow-auto"
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
                className="w-full rounded-xl border p-3 text-left transition hover:border-blue-600"
                style={{
                  background: "var(--app-code-bg)",
                  borderColor: "var(--app-border)",
                }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium uppercase">
                    {run.language}
                  </span>

                  <span className={`text-sm ${getStatusClass(run.status)}`}>
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
    </main>
  );
}
