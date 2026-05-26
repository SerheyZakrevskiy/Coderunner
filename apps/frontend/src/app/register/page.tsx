"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function register() {
    setError("");

    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, name, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message ?? "Registration failed");
      return;
    }

    localStorage.setItem("accessToken", data.accessToken);
    router.push("/profile");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
      <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h1 className="mb-6 text-2xl font-bold">Register</h1>

        <div className="space-y-4">
          <input
            className="w-full rounded-lg border border-neutral-700 bg-black p-3"
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <input
            className="w-full rounded-lg border border-neutral-700 bg-black p-3"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <input
            className="w-full rounded-lg border border-neutral-700 bg-black p-3"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            onClick={register}
            className="w-full rounded-lg bg-blue-600 p-3 font-medium hover:bg-blue-500"
          >
            Create account
          </button>
        </div>
      </div>
    </main>
  );
}
