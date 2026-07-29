import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/Layout";
import { Reveal } from "@/hooks/use-site-motion";
import { useDemo } from "@/context/DemoContext";
import { mlAPI } from "@/lib/api";
import { toast } from "sonner";
import { Brain, ArrowRightLeft, Beaker, FlaskConical } from "lucide-react";

export const Route = createFileRoute("/whatif")({
  beforeLoad: () => {
    if (!localStorage.getItem("access_token")) {
      throw redirect({ to: "/login" });
    }
  },
  component: WhatIf,
});

function RiskCard({ conditions, label }) {
  const entries = Object.entries(conditions);
  if (entries.length === 0) return <p className="text-sm text-ink/50">No scores available.</p>;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-ink/50 font-semibold mb-3">{label}</p>
      <div className="flex flex-wrap justify-center gap-3">
        {entries.map(([key, val]) => {
          const prob = val.probability || val;
          const level = val.risk_level || (prob > 0.5 ? "high" : prob > 0.25 ? "moderate" : "low");
          const pct = typeof prob === "number" ? (prob * 100).toFixed(0) : prob;
          const colors = { low: "#10a86a", moderate: "#f59e0b", high: "#ef4444", critical: "#dc2626" };
          return (
            <div key={key} className="ticket p-4 min-w-[240px] flex-1 max-w-[320px]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm capitalize">{key.replace(/_/g, " ")}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: `${colors[level]}22`, color: colors[level] }}>{level}</span>
              </div>
              <div className="h-2 bg-green-soft rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-green rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-xl font-bold">{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function randBetween(min, max, decimals = 0) {
  const v = Math.random() * (max - min) + min;
  return decimals > 0 ? parseFloat(v.toFixed(decimals)) : Math.round(v);
}
function level(p) { return p > 0.5 ? "high" : p > 0.25 ? "moderate" : "low"; }
function generateDemoRisk() {
  const dia = randBetween(5, 85, 2) / 100;
  const hrt = randBetween(5, 85, 2) / 100;
  const hyp = randBetween(5, 85, 2) / 100;
  const strk = randBetween(5, 85, 2) / 100;
  const ckd = randBetween(5, 85, 2) / 100;
  return {
    risk_scores: {
      conditions: {
        diabetes: { probability: dia, risk_level: level(dia) },
        heart_disease: { probability: hrt, risk_level: level(hrt) },
        hypertension: { probability: hyp, risk_level: level(hyp) },
        stroke: { probability: strk, risk_level: level(strk) },
        chronic_kidney: { probability: ckd, risk_level: level(ckd) },
      },
    },
  };
}

function WhatIf() {
  const { demoMode } = useDemo();
  const [current, setCurrent] = useState(null);
  const [simulated, setSimulated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [adj, setAdj] = useState({ bmi: "", blood_glucose: "", systolic_bp: "", smoking: false });
  const [demoRisk, setDemoRisk] = useState(null);
  const demoTimer = useRef(null);

  useEffect(() => {
    if (demoMode) {
      setDemoRisk(generateDemoRisk());
      demoTimer.current = setInterval(() => {
        setDemoRisk(generateDemoRisk());
      }, 15000);
    } else {
      clearInterval(demoTimer.current);
      setDemoRisk(null);
    }
    return () => clearInterval(demoTimer.current);
  }, [demoMode]);

  useEffect(() => { 
    if (demoMode) return;
    let ignore = false;
    async function fetchCurrent() {
      setLoading(true);
      try {
        const data = await mlAPI.getRiskScores();
        if (!ignore) setCurrent(data);
      } catch {
        if (!ignore) toast.error("Failed to load current risk scores.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchCurrent();
    return () => { ignore = true; };
  }, [demoMode]);
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setAdj((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  }
  async function handleSimulate(e) {
    e.preventDefault();
    setSimulating(true);
    setSimulated(null);
    try {
      const payload = {};
      if (adj.bmi !== "") payload.bmi = parseFloat(adj.bmi);
      if (adj.blood_glucose !== "") payload.blood_glucose = parseFloat(adj.blood_glucose);
      if (adj.systolic_bp !== "") payload.systolic_bp = parseFloat(adj.systolic_bp);
      payload.smoking = adj.smoking;
      if (Object.keys(payload).length === 1 && payload.smoking === adj.smoking && !adj.smoking && adj.bmi === "" && adj.blood_glucose === "" && adj.systolic_bp === "") {
        toast.error("Adjust at least one parameter before simulating.");
        setSimulating(false);
        return;
      }
      if (demoMode) {
        await new Promise((r) => setTimeout(r, 800));
        const currentRisk = demoRisk || generateDemoRisk();
        const conds = { ...currentRisk.risk_scores.conditions };
        const adjusted = {};
        for (const [key, c] of Object.entries(conds)) {
          const shift = (Math.random() - 0.5) * 0.3;
          const p = Math.max(0.02, Math.min(0.98, c.probability + shift));
          adjusted[key] = { probability: +p.toFixed(4), risk_level: level(p) };
        }
        setSimulated({ simulated: adjusted });
        setSimulating(false);
        return;
      }
      const data = await mlAPI.whatIf({ adjustments: payload });
      setSimulated(data);
    } catch (err) {
      toast.error(err.data?.detail || "Simulation failed.");
    } finally {
      setSimulating(false);
    }
  }
  const displayCurrent = demoMode ? demoRisk : current;
  const currentConds = displayCurrent?.risk_scores?.conditions || displayCurrent?.scores || displayCurrent?.risks || {};
  const simConds = simulated?.simulated?.conditions || simulated?.simulated || {};

  return (
    <AppShell active="/whatif">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Reveal>
          <div className="mb-8">
            <p className="text-[11px] uppercase tracking-[0.3em] text-green font-semibold mb-2">— what-if simulator</p>
            <h1 className="text-4xl md:text-5xl font-semibold">What-If Simulator</h1>
            <p className="mt-2 text-ink/70 text-sm">Adjust health parameters and see predicted risk changes in real-time.</p>
          </div>
        </Reveal>

        <Reveal>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Brain size={18} className={demoMode ? "text-violet-500" : "text-green"} />
            {demoMode ? "Simulated risk scores" : "Current risk scores"}
            {demoMode && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[10px] font-bold uppercase tracking-widest">
                <FlaskConical size={10} /> Demo
              </span>
            )}
          </h2>
          {!demoMode && loading ? (
            <div className="ticket p-12 text-center text-ink/50">Loading…</div>
          ) : (
            <div className="flex justify-center">
              <RiskCard conditions={currentConds} label={demoMode ? "Simulated" : "Current"} />
            </div>
          )}
        </Reveal>

        <Reveal>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Beaker size={18} className="text-green" /> Adjust parameters</h2>
          <form onSubmit={handleSimulate} className="ticket p-6 grid sm:grid-cols-2 gap-4 mb-10">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-green font-semibold mb-1.5">BMI (kg/m²)</label>
              <input type="number" step="0.1" name="bmi" value={adj.bmi} onChange={handleChange} placeholder="e.g. 24.5" className="w-full bg-white border border-line rounded-full px-5 py-3 outline-none text-sm focus:border-green" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-green font-semibold mb-1.5">Blood glucose (mg/dL)</label>
              <input type="number" name="blood_glucose" value={adj.blood_glucose} onChange={handleChange} placeholder="e.g. 110" className="w-full bg-white border border-line rounded-full px-5 py-3 outline-none text-sm focus:border-green" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-green font-semibold mb-1.5">Systolic BP (mmHg)</label>
              <input type="number" name="systolic_bp" value={adj.systolic_bp} onChange={handleChange} placeholder="e.g. 130" className="w-full bg-white border border-line rounded-full px-5 py-3 outline-none text-sm focus:border-green" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-2xl border border-line w-full hover:border-green transition-colors">
                <input type="checkbox" name="smoking" checked={adj.smoking} onChange={handleChange} className="w-5 h-5 accent-green" />
                <span className="text-sm font-semibold">Smoker</span>
              </label>
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={simulating} className="a-button">
                <span className="a-button__mask">
                  <span className="a-button__text" data-text={simulating ? "Simulating..." : "Run simulation →"}>{simulating ? "Simulating..." : "Run simulation →"}</span>
                </span>
              </button>
            </div>
          </form>
        </Reveal>

        {simulated && (
          <Reveal>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><ArrowRightLeft size={18} className="text-green" /> Comparison</h2>
            <div className="flex flex-wrap justify-center gap-6">
              <RiskCard conditions={currentConds} label="Current" />
              <RiskCard conditions={simConds} label="Simulated" />
            </div>
          </Reveal>
        )}
      </div>
    </AppShell>
  );
}
