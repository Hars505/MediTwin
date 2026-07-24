import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/Layout";
import { Reveal } from "@/hooks/use-site-motion";
import { mlAPI } from "@/lib/api";
import { toast } from "sonner";
import { Brain, BarChart3, Cpu } from "lucide-react";

export const Route = createFileRoute("/admin/ml")({
  beforeLoad: () => {
    if (!localStorage.getItem("access_token")) {
      throw redirect({ to: "/login" });
    }
  },
  component: AdminML,
});

function AdminML() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    let ignore = false;
    async function fetchMetrics() {
      setLoading(true);
      try {
        const data = await mlAPI.getModelMetrics();
        if (!ignore) setMetrics(data);
      } catch {
        if (!ignore) toast.error("Failed to load model metrics.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchMetrics();
    return () => { ignore = true; };
  }, []);

  return (
    <AppShell active="/admin/ml">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Reveal>
          <div className="mb-8">
            <p className="text-[11px] uppercase tracking-[0.3em] text-green font-semibold mb-2">— admin</p>
            <h1 className="text-4xl md:text-5xl font-semibold">ML Dashboard</h1>
            <p className="mt-2 text-ink/70 text-sm">Model performance metrics and statistics.</p>
          </div>
        </Reveal>

        {loading ? (
          <div className="ticket p-12 text-center text-ink/50">Loading metrics…</div>
        ) : !metrics ? (
          <div className="ticket p-16 text-center text-ink/50">
            <Cpu size={40} className="mx-auto mb-3" />
            <p>No model metrics available.</p>
          </div>
        ) : (
          <Reveal>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Brain size={18} className="text-green" /> Model metrics</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(metrics).map(([k, v]) => {
                const isNum = typeof v === "number";
                const display = isNum ? (v * 100).toFixed(2) + "%" : typeof v === "object" ? JSON.stringify(v) : String(v);
                return (
                  <div key={k} className="ticket p-5 a-hover-tilt">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 size={18} className="text-green" />
                      <span className="font-semibold text-sm capitalize">{k.replace(/_/g, " ")}</span>
                    </div>
                    <div className="text-3xl font-bold">{display}</div>
                    {isNum && (
                      <div className="mt-3 h-1.5 bg-green-soft rounded-full overflow-hidden">
                        <div className="h-full bg-green rounded-full" style={{ width: `${Math.min(v * 100, 100)}%` }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Reveal>
        )}
      </div>
    </AppShell>
  );
}
