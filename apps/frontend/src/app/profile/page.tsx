"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type Profile = {
  userId: string;
  email: string;
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

  return (
    <main className="min-h-screen bg-neutral-950 p-6 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold">
                {profile?.email?.[0]?.toUpperCase() ?? "U"}
              </div>

              <div>
                <h1 className="text-3xl font-bold">Profile</h1>

                {profile && (
                  <div className="mt-2 space-y-1">
                    <p className="text-lg font-medium text-neutral-100">
                      {profile.email}
                    </p>

                    <p className="text-sm text-neutral-500">
                      CodeRunner account
                    </p>
                  </div>
                )}

                {error && <p className="mt-4 text-red-400">{error}</p>}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push("/")}
                className="rounded-lg bg-neutral-800 px-4 py-2 font-medium text-white transition hover:bg-neutral-700"
              >
                CodeRunner
              </button>

              <button
                onClick={logout}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-500"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-neutral-800 bg-black p-4">
              <p className="text-sm text-neutral-500">Total runs</p>
              <p className="mt-2 text-2xl font-bold">{runs.length}</p>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-black p-4">
              <p className="text-sm text-neutral-500">Completed</p>
              <p className="mt-2 text-2xl font-bold text-green-400">
                {runs.filter((run) => run.status === "completed").length}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-black p-4">
              <p className="text-sm text-neutral-500">Failed</p>
              <p className="mt-2 text-2xl font-bold text-red-400">
                {runs.filter((run) => run.status === "failed").length}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-black p-4">
              <p className="text-sm text-neutral-500">Languages</p>
              <p className="mt-2 text-2xl font-bold">
                {new Set(runs.map((run) => run.language)).size}
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Recent Runs</h2>

            <span className="text-sm text-neutral-500">
              {runs.length} total
            </span>
          </div>

          {runs.length === 0 && (
            <p className="rounded-lg border border-neutral-800 bg-black p-4 text-neutral-500">
              No runs yet.
            </p>
          )}

          <div className="space-y-4">
            {runs.map((run) => (
              <button
                key={run.id}
                onClick={() => router.push(`/runs/${run.id}`)}
                className="w-full rounded-lg border border-neutral-700 bg-black p-4 text-left transition hover:border-blue-600 hover:bg-neutral-800"
              >
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold uppercase text-neutral-200">
                      {run.language}
                    </div>

                    <div className="mt-1 text-xs text-neutral-600">
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

                <div className="rounded-md bg-neutral-950 p-3">
                  <p className="text-xs font-semibold text-green-400">STDOUT</p>

                  <pre className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-neutral-300">
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
