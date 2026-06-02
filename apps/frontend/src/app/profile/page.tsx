"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type Profile = {
  userId: string;
  email: string;
  name?: string | null;
};

type Run = {
  id: string;
  language: string;
  status: string;
  stdout: string | null;
  stderr: string | null;
  createdAt: string;
};

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Failed to load profile");
        localStorage.removeItem("accessToken");
        router.push("/login");
        return;
      }

      setProfile(data);

      const runsResponse = await fetch(`${API_URL}/runs/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (runsResponse.ok) {
        const runsData: Run[] = await runsResponse.json();
        setRuns(runsData);
      }
    }

    loadProfile();
  }, [router]);

  function logout() {
    localStorage.removeItem("accessToken");
    router.push("/login");
  }

  function getStatusClass(status: string) {
    if (status === "completed") {
      return "text-green-400";
    }

    if (status === "failed" || status === "timeout") {
      return "text-red-400";
    }

    return "text-yellow-400";
  }

  function getRunsByLanguage(language: string) {
    return runs.filter((run) => run.language === language).length;
  }

  function getCompletedRuns() {
    return runs.filter((run) => run.status === "completed").length;
  }

  function getFailedRuns() {
    return runs.filter(
      (run) => run.status === "failed" || run.status === "timeout",
    ).length;
  }

  function getSuccessRate() {
    if (runs.length === 0) {
      return 0;
    }

    return Math.round((getCompletedRuns() / runs.length) * 100);
  }

  return (
    <main
      className="min-h-screen p-6"
      style={{
        background: "var(--app-bg)",
        color: "var(--app-text)",
      }}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <header
          className="rounded-2xl border p-6"
          style={{
            background: "var(--app-panel)",
            borderColor: "var(--app-border)",
          }}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white shadow-lg shadow-blue-600/20">
                {(profile?.name || profile?.email)?.[0]?.toUpperCase() ?? "U"}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold leading-none">
                    {profile?.name || "Profile"}
                  </h1>

                  <span className="rounded-full border border-blue-600/40 bg-blue-600/10 px-3 py-1 text-xs font-medium text-blue-400">
                    CodeRunner account
                  </span>
                </div>

                {profile && (
                  <p
                    className="mt-2 truncate text-sm"
                    style={{ color: "var(--app-muted)" }}
                  >
                    {profile.email}
                  </p>
                )}

                {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <ThemeToggle />

              <button
                onClick={() => router.push("/")}
                className="rounded-xl px-4 py-2 font-medium transition"
                style={{
                  background: "var(--app-panel-soft)",
                  color: "var(--app-text)",
                }}
              >
                CodeRunner
              </button>

              <button
                onClick={logout}
                className="rounded-xl bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-500"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div
              className="rounded-xl border p-4"
              style={{
                background: "var(--app-code-bg)",
                borderColor: "var(--app-border)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--app-muted)" }}>
                Total runs
              </p>
              <p className="mt-2 text-2xl font-bold">{runs.length}</p>
            </div>

            <div
              className="rounded-xl border p-4"
              style={{
                background: "var(--app-code-bg)",
                borderColor: "var(--app-border)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--app-muted)" }}>
                Success rate
              </p>
              <p className="mt-2 text-2xl font-bold text-green-400">
                {getSuccessRate()}%
              </p>
            </div>

            <div
              className="rounded-xl border p-4"
              style={{
                background: "var(--app-code-bg)",
                borderColor: "var(--app-border)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--app-muted)" }}>
                Completed
              </p>
              <p className="mt-2 text-2xl font-bold text-green-400">
                {getCompletedRuns()}
              </p>
            </div>

            <div
              className="rounded-xl border p-4"
              style={{
                background: "var(--app-code-bg)",
                borderColor: "var(--app-border)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--app-muted)" }}>
                Failed / Timeout
              </p>
              <p className="mt-2 text-2xl font-bold text-red-400">
                {getFailedRuns()}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div
              className="rounded-xl border p-4"
              style={{
                background: "var(--app-code-bg)",
                borderColor: "var(--app-border)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--app-muted)" }}>
                Python runs
              </p>
              <p className="mt-2 text-2xl font-bold">
                {getRunsByLanguage("python")}
              </p>
            </div>

            <div
              className="rounded-xl border p-4"
              style={{
                background: "var(--app-code-bg)",
                borderColor: "var(--app-border)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--app-muted)" }}>
                JavaScript runs
              </p>
              <p className="mt-2 text-2xl font-bold">
                {getRunsByLanguage("javascript")}
              </p>
            </div>

            <div
              className="rounded-xl border p-4"
              style={{
                background: "var(--app-code-bg)",
                borderColor: "var(--app-border)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--app-muted)" }}>
                C++ runs
              </p>
              <p className="mt-2 text-2xl font-bold">
                {getRunsByLanguage("cpp")}
              </p>
            </div>
          </div>
        </header>

        <section
          className="rounded-2xl border p-6"
          style={{
            background: "var(--app-panel)",
            borderColor: "var(--app-border)",
          }}
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Recent Runs</h2>

            <span className="text-sm" style={{ color: "var(--app-muted)" }}>
              {runs.length} total
            </span>
          </div>

          {runs.length === 0 && (
            <p
              className="rounded-lg border p-4"
              style={{
                background: "var(--app-code-bg)",
                borderColor: "var(--app-border)",
                color: "var(--app-muted)",
              }}
            >
              No runs yet.
            </p>
          )}

          <div className="space-y-4">
            {runs.map((run) => (
              <button
                key={run.id}
                onClick={() => router.push(`/runs/${run.id}`)}
                className="w-full rounded-xl border p-4 text-left transition hover:border-blue-600"
                style={{
                  background: "var(--app-code-bg)",
                  borderColor: "var(--app-border)",
                }}
              >
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold uppercase">
                      {run.language}
                    </div>

                    <div
                      className="mt-1 text-xs"
                      style={{ color: "var(--app-muted)" }}
                    >
                      {new Date(run.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <span
                    className={`text-sm font-medium ${getStatusClass(
                      run.status,
                    )}`}
                  >
                    {run.status}
                  </span>
                </div>

                <div
                  className="rounded-lg p-3"
                  style={{ background: "var(--app-panel)" }}
                >
                  <p className="text-xs font-semibold text-green-400">STDOUT</p>

                  <pre
                    className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm"
                    style={{ color: "var(--app-text)" }}
                  >
                    {run.stdout || "(empty)"}
                  </pre>

                  {run.stderr && (
                    <>
                      <p className="mt-3 text-xs font-semibold text-red-400">
                        STDERR
                      </p>

                      <pre className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-red-300">
                        {run.stderr}
                      </pre>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
