"use client";

import { useEffect, useState } from "react";
import { SUPPORTED_CATEGORIES, type Category } from "@/lib/categoryTypes";

type PreferencesResponse = {
  preferredCategories?: Category[];
  error?: string;
};

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }

  const token = window.localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function PreferenceSettings({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(initialCategories);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSelectedCategories(initialCategories);
  }, [initialCategories]);

  function toggleCategory(category: Category) {
    setStatus("idle");
    setMessage("");
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  }

  async function savePreferences() {
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        credentials: "same-origin",
        body: JSON.stringify({ preferredCategories: selectedCategories }),
      });
      const data = (await response.json().catch(() => null)) as PreferencesResponse | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to save preferences");
      }

      setSelectedCategories(data?.preferredCategories ?? selectedCategories);
      setStatus("success");
      setMessage("Preferences saved.");
    } catch {
      setStatus("error");
      setMessage("Unable to save preferences right now.");
    }
  }

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-6 shadow-glow sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
        Preferences
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        Tune your discovery feed
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
        Pick the categories you want MultiContent to prioritize while still keeping a healthy mix of trending coverage.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {SUPPORTED_CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category);

          return (
            <button
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
              className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                isSelected
                  ? "border-cyan-300/50 bg-cyan-300 text-ink-950"
                  : "border-white/10 bg-slate-950/70 text-slate-300 hover:border-cyan-300/40 hover:text-white"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => void savePreferences()}
          disabled={status === "loading"}
          className="rounded-lg bg-cyan-300 px-5 py-3 text-sm font-bold text-ink-950 transition hover:bg-white disabled:cursor-wait disabled:opacity-70"
        >
          {status === "loading" ? "Saving..." : "Save preferences"}
        </button>

        {message ? (
          <p
            className={`text-sm font-medium ${
              status === "error" ? "text-red-200" : "text-emerald-200"
            }`}
          >
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
