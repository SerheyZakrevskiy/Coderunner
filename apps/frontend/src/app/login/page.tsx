"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");

  async function login() {
    setError("");

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message ?? "Login failed");
      return;
    }

    localStorage.setItem("accessToken", data.accessToken);
    router.push("/profile");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
      <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h1 className="mb-6 text-2xl font-bold">Login</h1>

        <div className="space-y-4">
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
            onClick={login}
            className="w-full rounded-lg bg-blue-600 p-3 font-medium hover:bg-blue-500"
          >
            Login
          </button>
          <button
            onClick={() => router.push("/register")}
            className="w-full text-sm text-blue-400 hover:text-blue-300"
          >
            Don't have an account? Register
          </button>
        </div>
      </div>
    </main>
  );
}
