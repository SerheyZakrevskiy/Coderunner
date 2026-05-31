"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type Run = {
  id: string;
  language: string;
  code: string;
  stdout: string | null;
  stderr: string | null;
  status: string;
  exitCode: number | null;
  createdAt: string;
};

export default function RunDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const [run, setRun] = useState<Run | null>(null);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    async function loadRun() {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${API_URL}/runs/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        router.push("/");
        return;
      }

      setRun(await response.json());
    }

    loadRun();
  }, [params.id, router]);

  function getStatusClass(status: string) {
    if (status === "completed") {
      return "text-green-400";
    }

    if (status === "failed" || status === "timeout") {
      return "text-red-400";
    }

    return "text-yellow-400";
  }

  async function copyText(label: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);

    setTimeout(() => {
      setCopied("");
    }, 1500);
  }

  if (!run) {
    return (
      <main
        className="min-h-screen p-6"
        style={{
          background: "var(--app-bg)",
          color: "var(--app-text)",
        }}
      >
        <div
          className="mx-auto max-w-5xl rounded-xl border p-6"
          style={{
            background: "var(--app-panel)",
            borderColor: "var(--app-border)",
          }}
        >
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen p-6"
      style={{
        background: "var(--app-bg)",
        color: "var(--app-text)",
      }}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <header
          className="rounded-2xl border p-6"
          style={{
            background: "var(--app-panel)",
            borderColor: "var(--app-border)",
          }}
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full bg-blue-600/10 px-3 py-1 text-sm font-medium text-blue-400">
                Execution details
              </div>

              <h1 className="text-3xl font-bold">Run Details</h1>

              <p
                className="mt-2 break-all font-mono text-sm"
                style={{ color: "var(--app-muted)" }}
              >
                {run.id}
              </p>

              {copied && (
                <p className="mt-3 text-sm text-green-400">Copied {copied}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <ThemeToggle />

              <button
                onClick={() => router.push("/")}
                className="rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-500"
              >
                Back to editor
              </button>

              <button
                onClick={() => router.push("/profile")}
                className="rounded-xl px-4 py-2 font-medium transition"
                style={{
                  background: "var(--app-panel-soft)",
                  color: "var(--app-text)",
                }}
              >
                Profile
              </button>

              <button
                onClick={() => copyText("run ID", run.id)}
                className="rounded-xl px-4 py-2 font-medium transition"
                style={{
                  background: "var(--app-panel-soft)",
                  color: "var(--app-text)",
                }}
              >
                Copy ID
              </button>
            </div>
          </div>
        </header>

        <section
          className="rounded-2xl border p-4"
          style={{
            background: "var(--app-panel)",
            borderColor: "var(--app-border)",
          }}
        >
          <div className="grid gap-4 text-sm md:grid-cols-4">
            <div
              className="rounded-xl border p-4"
              style={{
                background: "var(--app-code-bg)",
                borderColor: "var(--app-border)",
              }}
            >
              <p style={{ color: "var(--app-muted)" }}>Language</p>
              <p className="mt-2 font-semibold uppercase">{run.language}</p>
            </div>

            <div
              className="rounded-xl border p-4"
              style={{
                background: "var(--app-code-bg)",
                borderColor: "var(--app-border)",
              }}
            >
              <p style={{ color: "var(--app-muted)" }}>Status</p>
              <p className={`mt-2 font-semibold ${getStatusClass(run.status)}`}>
                {run.status}
              </p>
            </div>

            <div
              className="rounded-xl border p-4"
              style={{
                background: "var(--app-code-bg)",
                borderColor: "var(--app-border)",
              }}
            >
              <p style={{ color: "var(--app-muted)" }}>Exit code</p>
              <p className="mt-2 font-semibold">{run.exitCode ?? "-"}</p>
            </div>

            <div
              className="rounded-xl border p-4"
              style={{
                background: "var(--app-code-bg)",
                borderColor: "var(--app-border)",
              }}
            >
              <p style={{ color: "var(--app-muted)" }}>Created</p>
              <p className="mt-2 font-semibold">
                {new Date(run.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        <section
          className="rounded-2xl border p-4"
          style={{
            background: "var(--app-panel)",
            borderColor: "var(--app-border)",
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Source code</h2>

            <button
              onClick={() => copyText("code", run.code)}
              className="rounded-lg px-3 py-1 text-sm font-medium transition"
              style={{
                background: "var(--app-panel-soft)",
                color: "var(--app-text)",
              }}
            >
              Copy code
            </button>
          </div>

          <pre
            className="max-h-[420px] overflow-auto rounded-xl p-4 text-sm"
            style={{
              background: "var(--app-code-bg)",
              color: "var(--app-text)",
            }}
          >
            {run.code}
          </pre>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section
            className="rounded-2xl border p-4"
            style={{
              background: "var(--app-panel)",
              borderColor: "var(--app-border)",
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-green-400">STDOUT</h2>

              <button
                onClick={() => copyText("stdout", run.stdout ?? "")}
                className="rounded-lg px-3 py-1 text-sm font-medium transition"
                style={{
                  background: "var(--app-panel-soft)",
                  color: "var(--app-text)",
                }}
              >
                Copy output
              </button>
            </div>

            <pre
              className="min-h-32 overflow-auto rounded-xl p-4 text-sm"
              style={{
                background: "var(--app-code-bg)",
                color: "var(--app-text)",
              }}
            >
              {run.stdout || "(empty)"}
            </pre>
          </section>

          <section
            className="rounded-2xl border p-4"
            style={{
              background: "var(--app-panel)",
              borderColor: "var(--app-border)",
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-red-400">STDERR</h2>

              <button
                onClick={() => copyText("stderr", run.stderr ?? "")}
                className="rounded-lg px-3 py-1 text-sm font-medium transition"
                style={{
                  background: "var(--app-panel-soft)",
                  color: "var(--app-text)",
                }}
              >
                Copy error
              </button>
            </div>

            <pre
              className="min-h-32 overflow-auto rounded-xl p-4 text-sm"
              style={{
                background: "var(--app-code-bg)",
                color: "var(--app-text)",
              }}
            >
              {run.stderr || "(empty)"}
            </pre>
          </section>
        </div>
      </div>
    </main>
  );
}
