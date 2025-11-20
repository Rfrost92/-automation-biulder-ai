"use client";

import { useState } from "react";

type AutomationPlan = {
  services: string[];
  trigger: {
    service: string;
    event: string;
    sample_payload: any;
  };
  steps: {
    service: string;
    action: string;
    description: string;
    mapping: any;
  }[];
  zapier_json: any;
};

export default function Home() {
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState("Zapier");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AutomationPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!description.trim()) {
      setError("Please describe your automation.");
      return;
    }

    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, style }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Request failed");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
      <main className="min-h-screen bg-zinc-950 text-zinc-50 px-4 py-8 flex justify-center">
        <div className="w-full max-w-5xl space-y-8">
          {/* Header */}
          <header className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              AI-powered workflow designer
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              AI Automation Builder
            </h1>
            <p className="text-sm md:text-base text-zinc-400 max-w-2xl mx-auto">
              Describe what should happen in your business, and the assistant
              designs a Zapier / Make / API workflow with triggers, steps,
              mappings and example payloads.
            </p>
          </header>

          {/* Input card */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 md:p-7 shadow-[0_22px_60px_rgba(0,0,0,0.65)] space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200">
                Describe your automation
              </label>
              <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-2xl px-3 py-3 h-28 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Example: When a Stripe payment succeeds, create an Asana task and post a Slack notification."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200">
                Workflow style
              </label>
              <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 rounded-2xl px-3 py-2.5 text-sm text-zinc-100 w-52 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="Zapier">Zapier</option>
                <option value="Make">Make.com</option>
                <option value="Custom">Custom API</option>
              </select>
              <p className="text-xs text-zinc-500">
                This only changes how the plan is phrased, not the logic itself.
              </p>
            </div>

            {error && (
                <div className="text-sm text-red-300 bg-red-950/40 border border-red-700/50 rounded-2xl px-3 py-2">
                  {error}
                </div>
            )}

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button
                  onClick={generate}
                  disabled={loading}
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-2xl bg-emerald-500 text-zinc-950 font-semibold text-sm hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Generating…" : "Generate automation plan"}
              </button>
              <p className="text-xs text-zinc-500">
                The plan is generated with OpenAI and not stored on the server.
              </p>
            </div>
          </section>

          {loading && (
              <section className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 text-sm text-zinc-300 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Thinking through your automation…
              </section>
          )}

          {/* Results */}
          {result && (
              <div className="space-y-6">
                <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-5">
                  <h2 className="text-base font-semibold text-zinc-100 mb-1">
                    Detected services
                  </h2>
                  <p className="text-sm text-zinc-300">
                    {result.services.join(", ")}
                  </p>
                </section>

                <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-5 space-y-3">
                  <h2 className="text-base font-semibold text-zinc-100">Trigger</h2>
                  <p className="text-sm text-zinc-300">
                    {result.trigger.service} → {result.trigger.event}
                  </p>
                  <p className="text-xs text-zinc-500">Example payload</p>
                  <pre className="text-xs bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3 mt-1 max-h-64 overflow-auto">
                {JSON.stringify(result.trigger.sample_payload, null, 2)}
              </pre>
                </section>

                <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-5 space-y-4">
                  <h2 className="text-base font-semibold text-zinc-100">
                    Steps & field mapping
                  </h2>
                  {result.steps.map((step, i) => (
                      <div
                          key={i}
                          className="border border-zinc-800 rounded-2xl p-3 space-y-2 bg-zinc-950/40"
                      >
                        <p className="text-sm font-semibold text-zinc-100">
                          {step.service} → {step.action}
                        </p>
                        <p className="text-sm text-zinc-400">{step.description}</p>
                        <p className="text-xs text-zinc-500">Field mapping</p>
                        <pre className="text-xs bg-zinc-950 border border-zinc-900 rounded-xl p-3 max-h-52 overflow-auto">
                    {JSON.stringify(step.mapping, null, 2)}
                  </pre>
                      </div>
                  ))}
                </section>

                <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-5">
                  <h2 className="text-base font-semibold text-zinc-100">
                    Zapier-style JSON config
                  </h2>
                  <pre className="text-xs bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3 mt-2 max-h-80 overflow-auto">
                {JSON.stringify(result.zapier_json, null, 2)}
              </pre>
                </section>
              </div>
          )}
        </div>
      </main>
  );
}
