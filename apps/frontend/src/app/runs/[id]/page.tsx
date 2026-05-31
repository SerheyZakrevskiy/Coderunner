"use client";

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

  if (!run) {
    return (
      <main className="min-h-screen bg-neutral-950 p-6 text-white">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 p-6 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Run Details</h1>
            <p className="text-neutral-400">{run.id}</p>
          </div>

          <button
            onClick={() => router.push("/")}
            className="rounded-lg bg-neutral-800 px-4 py-2 hover:bg-neutral-700"
          >
            Back to editor
          </button>
        </header>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="grid gap-3 text-sm text-neutral-300 md:grid-cols-4">
            <div>Language: {run.language}</div>
            <div>Status: {run.status}</div>
            <div>Exit code: {run.exitCode ?? "-"}</div>
            <div>{new Date(run.createdAt).toLocaleString()}</div>
          </div>
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <h2 className="mb-2 text-xl font-semibold">Code</h2>
          <pre className="overflow-auto rounded-lg bg-black p-4 text-sm">
            {run.code}
          </pre>
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <h2 className="mb-2 text-xl font-semibold text-green-400">STDOUT</h2>
          <pre className="overflow-auto rounded-lg bg-black p-4 text-sm">
            {run.stdout || "(empty)"}
          </pre>
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <h2 className="mb-2 text-xl font-semibold text-red-400">STDERR</h2>
          <pre className="overflow-auto rounded-lg bg-black p-4 text-sm">
            {run.stderr || "(empty)"}
          </pre>
        </section>
      </div>
    </main>
  );
}
