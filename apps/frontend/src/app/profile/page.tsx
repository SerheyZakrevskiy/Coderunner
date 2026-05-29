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
        return;
      }

      setProfile(data);
      const runsResponse = await fetch(`${API_URL}/runs/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (runsResponse.ok) {
        const runsData = await runsResponse.json();
        setRuns(runsData);
      }
    }

    loadProfile();
  }, [router]);

  function logout() {
    localStorage.removeItem("accessToken");
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-neutral-950 p-6 text-white">
      <div className="mx-auto max-w-3xl rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h1 className="mb-6 text-2xl font-bold">Profile</h1>

        {error && <p className="text-red-400">{error}</p>}

        {profile && (
          <div className="space-y-3">
            <p>
              <span className="text-neutral-400">User ID:</span>{" "}
              {profile.userId}
            </p>

            <p>
              <span className="text-neutral-400">Email:</span> {profile.email}
            </p>

            <button
              onClick={logout}
              className="rounded-lg bg-red-600 px-4 py-2 font-medium hover:bg-red-500"
            >
              Logout
            </button>
            <div className="mt-8">
              <h2 className="mb-4 text-xl font-bold">Recent Runs</h2>

              <div className="space-y-4">
                {runs.map((run) => (
                  <div
                    key={run.id}
                    className="rounded-lg border border-neutral-700 p-4"
                  >
                    <div className="mb-2 flex justify-between">
                      <span>{run.language}</span>

                      <span>{run.status}</span>
                    </div>

                    <div className="text-sm text-green-400">
                      {run.stdout || "(empty)"}
                    </div>

                    {run.stderr && (
                      <div className="mt-2 text-sm text-red-400">
                        {run.stderr}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
