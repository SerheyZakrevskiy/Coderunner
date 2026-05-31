"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const isLight = theme === "light";

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    const initialTheme = savedTheme ?? "dark";

    setTheme(initialTheme);
    document.documentElement.classList.toggle(
      "light",
      initialTheme === "light",
    );
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.toggle("light", nextTheme === "light");
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative flex h-10 w-[104px] items-center rounded-xl border p-1 transition"
      style={{
        background: "var(--app-panel)",
        borderColor: "var(--app-border)",
        color: "var(--app-text)",
      }}
      aria-label="Toggle theme"
    >
      <span
        className={`absolute h-8 w-12 rounded-lg bg-blue-600 transition-transform duration-200 ${
          isLight ? "translate-x-11" : "translate-x-0"
        }`}
      />

      <span
        className={`relative z-10 flex w-12 justify-center text-xs font-semibold transition ${
          isLight ? "opacity-60" : "text-white"
        }`}
      >
        Dark
      </span>

      <span
        className={`relative z-10 flex w-12 justify-center text-xs font-semibold transition ${
          isLight ? "text-white" : "opacity-60"
        }`}
      >
        Light
      </span>
    </button>
  );
}
