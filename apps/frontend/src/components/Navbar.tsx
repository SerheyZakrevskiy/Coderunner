"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { usePathname, useRouter } from "next/navigation";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  function logout() {
    localStorage.removeItem("accessToken");
    router.push("/login");
  }

  function navButtonClass(path: string) {
    const isActive = pathname === path;

    return `rounded-xl px-4 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
        : "hover:opacity-80"
    }`;
  }

  return (
    <div
      className="sticky top-0 z-50 border-b backdrop-blur-xl"
      style={{
        background: "color-mix(in srgb, var(--app-panel) 86%, transparent)",
        borderColor: "var(--app-border)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-600/20">
            CR
          </div>

          <div className="text-left">
            <div
              className="text-lg font-bold"
              style={{ color: "var(--app-text)" }}
            >
              CodeRunner
            </div>
            <div className="text-xs" style={{ color: "var(--app-muted)" }}>
              Secure code execution
            </div>
          </div>
        </button>

        <nav
          className="flex items-center gap-2 rounded-2xl border p-1"
          style={{
            background: "var(--app-code-bg)",
            borderColor: "var(--app-border)",
          }}
        >
          <button
            onClick={() => router.push("/")}
            className={navButtonClass("/")}
            style={
              pathname === "/"
                ? undefined
                : {
                    color: "var(--app-text)",
                    background: "transparent",
                  }
            }
          >
            Editor
          </button>

          <button
            onClick={() => router.push("/profile")}
            className={navButtonClass("/profile")}
            style={
              pathname === "/profile"
                ? undefined
                : {
                    color: "var(--app-text)",
                    background: "transparent",
                  }
            }
          >
            Profile
          </button>

          <div
            className="mx-1 h-6 w-px"
            style={{ background: "var(--app-border)" }}
          />

          <ThemeToggle />

          <button
            onClick={logout}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
          >
            Logout
          </button>
        </nav>
      </div>
    </div>
  );
}
