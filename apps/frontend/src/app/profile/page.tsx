"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type Profile = {
  userId: string;
  email: string;
};

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
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
          </div>
        )}
      </div>
    </main>
  );
}
