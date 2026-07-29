import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/Layout";
import { Reveal } from "@/hooks/use-site-motion";
import { reportsAPI } from "@/lib/api";
import { toast } from "sonner";
import { FileText, Download, FileDown, Plus, Eye } from "lucide-react";

export const Route = createFileRoute("/reports")({
  beforeLoad: () => {
    if (!localStorage.getItem("access_token")) {
      throw redirect({ to: "/login" });
    }
  },
  component: Reports,
});

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const ignoreRef = useRef(false);

  useEffect(() => {
    ignoreRef.current = false;
    fetchReports();
    return () => { ignoreRef.current = true; };
  }, []);

  async function fetchReports() {
    setLoading(true);
    try {
      const data = await reportsAPI.list();
      if (!ignoreRef.current) setReports(data || []);
    } catch {
      if (!ignoreRef.current) toast.error("Failed to load reports.");
    } finally {
      if (!ignoreRef.current) setLoading(false);
    }
  }
  async function handleGenerate() {
    setGenerating(true);
    try {
      await reportsAPI.generate({ report_type: "full" });
      await fetchReports();
    } catch (err) {
      toast.error(err.data?.detail || "Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <AppShell active="/reports">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Reveal>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-green font-semibold mb-2">— pdf reports</p>
              <h1 className="text-4xl md:text-5xl font-semibold">Health Reports</h1>
              <p className="mt-2 text-ink/70 text-sm">Generate and download clinical-grade health reports.</p>
            </div>
            <button onClick={handleGenerate} disabled={generating} className="a-button">
              <span className="a-button__mask">
                <span className="a-button__text" data-text={generating ? "Generating..." : "+ New report"}>{generating ? "Generating..." : "+ New report"}</span>
              </span>
            </button>
          </div>
        </Reveal>

        {loading ? (
          <div className="ticket p-12 text-center text-ink/50">Loading reports…</div>
        ) : reports.length === 0 ? (
          <Reveal>
            <div className="ticket p-16 text-center text-ink/50">
              <FileText size={40} className="mx-auto mb-3" />
              <p>No reports yet. Click "New report" to generate one.</p>
            </div>
          </Reveal>
        ) : (
          <Reveal>
            <div className="space-y-3">
              {reports.map((r, i) => (
                <div key={r.id || i} className="ticket p-5 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-green-soft text-green grid place-items-center shrink-0">
                      <FileDown size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{r.filename || `Report ${i + 1}`}</p>
                      <p className="text-xs text-ink/60 flex gap-3 flex-wrap">
                        <span>Type: {r.report_type || "Full"}</span>
                        {r.generated_at && <span>{new Date(r.generated_at).toLocaleString()}</span>}
                      </p>
                    </div>
                  </div>
                  {r.filename && (
                    <div className="flex gap-2">
                      <a href={reportsAPI.reportUrl(r.filename)} target="_blank" rel="noreferrer" className="a-button a-button--ghost">
                        <span className="a-button__mask">
                          <span className="a-button__text" data-text="View"><Eye size={14} className="inline mr-1" />View</span>
                        </span>
                      </a>
                      <a href={reportsAPI.reportUrl(r.filename, true)} download className="a-button a-button--ghost">
                        <span className="a-button__mask">
                          <span className="a-button__text" data-text="Download"><Download size={14} className="inline mr-1" />Download</span>
                        </span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        )}
      </div>
    </AppShell>
  );
}
