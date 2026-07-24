import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/Layout";
import { Reveal } from "@/hooks/use-site-motion";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useDemo } from "@/context/DemoContext";
import { patientAPI, mlAPI } from "@/lib/api";
import { toast } from "sonner";
import { HeartPulse, Activity, Thermometer, Droplets, TrendingUp, AlertTriangle, RefreshCw, Brain, Wifi, WifiOff, Zap, FlaskConical, X, Award, BookOpen } from "lucide-react";
import { Tour } from "@/components/ui/Tour";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    if (!localStorage.getItem("access_token")) {
      throw redirect({ to: "/login" });
    }
  },
  component: Dashboard,
});

// ── Demo data helpers ────────────────────────────────────────────────────────
function randBetween(min, max, decimals = 0) {
  const v = Math.random() * (max - min) + min;
  return decimals > 0 ? parseFloat(v.toFixed(decimals)) : Math.round(v);
}

function generateDemoVitals() {
  return {
    heart_rate: randBetween(62, 98),
    systolic_bp: randBetween(108, 138),
    diastolic_bp: randBetween(68, 88),
    spo2: randBetween(96, 100, 1),
    blood_glucose: randBetween(78, 130, 1),
    temperature: randBetween(36.2, 37.4, 1),
    respiratory_rate: randBetween(13, 19),
  };
}

function generateDemoRisk() {
  const dia  = parseFloat((Math.random() * 0.38 + 0.05).toFixed(3));
  const hrt  = parseFloat((Math.random() * 0.45 + 0.05).toFixed(3));
  const hyp  = parseFloat((Math.random() * 0.30 + 0.08).toFixed(3));
  const strk = parseFloat((Math.random() * 0.20 + 0.03).toFixed(3));
  const ckd  = parseFloat((Math.random() * 0.25 + 0.04).toFixed(3));
  const level = (p) => p > 0.5 ? "high" : p > 0.25 ? "moderate" : "low";
  return {
    risk_scores: {
      conditions: {
        diabetes:       { probability: dia,  risk_level: level(dia)  },
        heart_disease:  { probability: hrt,  risk_level: level(hrt)  },
        hypertension:   { probability: hyp,  risk_level: level(hyp)  },
        stroke:         { probability: strk, risk_level: level(strk) },
        chronic_kidney: { probability: ckd,  risk_level: level(ckd)  },
      },
    },
    shap_explanations: {
      diabetes: {
        overall_risk: dia, risk_level: level(dia),
        top_factors: [
          { feature: "blood_glucose", impact_pct: randBetween(30, 55) },
          { feature: "bmi",           impact_pct: randBetween(15, 35) },
          { feature: "age",           impact_pct: randBetween(8, 20)  },
          { feature: "smoking",       impact_pct: randBetween(3, 12)  },
        ],
      },
      heart_disease: {
        overall_risk: hrt, risk_level: level(hrt),
        top_factors: [
          { feature: "systolic_bp",  impact_pct: randBetween(25, 50) },
          { feature: "heart_rate",   impact_pct: randBetween(10, 30) },
          { feature: "cholesterol",  impact_pct: randBetween(8, 22)  },
          { feature: "age",          impact_pct: randBetween(5, 18)  },
        ],
      },
    },
    cascade_effects: [],
  };
}

const DEMO_ALERTS = [
  { message: "Heart rate slightly elevated — consider resting for a moment", severity: "warning" },
  { message: "SpO₂ reading excellent at 98% — lungs are well-oxygenated",   severity: "info"    },
  { message: "Blood glucose within normal fasting range (< 100 mg/dL)",     severity: "info"    },
];

// ── Sub-components ───────────────────────────────────────────────────────────
function RiskBadge({ level }) {
  const colors = {
    low:      { bg: "bg-green-soft", text: "text-green"     },
    moderate: { bg: "bg-amber-50",   text: "text-amber-700" },
    high:     { bg: "bg-red-50",     text: "text-red-600"   },
    critical: { bg: "bg-red-100",    text: "text-red-700"   },
  };
  const c = colors[level] || colors.low;
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${c.bg} ${c.text}`}>
      {level}
    </span>
  );
}

function VitalsGauge({ label, value, unit, icon, normal, color = "text-green", isLive, isDemo, pulse }) {
  const isNormal = !normal || value == null || (value >= normal[0] && value <= normal[1]);
  const ringColor = isNormal ? color : "text-red-500";
  return (
    <div className={`ticket p-4 text-center transition-all duration-300 hover:-translate-y-0.5 ${!isNormal ? "border-red-300 bg-red-50/50" : ""} ${isDemo ? "ring-1 ring-violet-300/40" : ""} ${pulse ? "scale-[1.03] shadow-md" : ""}`}>
      <div className={`mb-1 inline-flex ${ringColor}`}>{icon}</div>
      <div className="text-2xl font-bold leading-tight">{value ?? "--"}</div>
      <div className="text-[9px] text-ink/50 uppercase tracking-widest">{unit}</div>
      <div className="text-xs text-ink/70 font-semibold mt-1 flex items-center justify-center gap-1">
        {label}
        {isLive && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
        )}
        {isDemo && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
function Dashboard() {
  const { user } = useAuth();
  const { liveVitals, anomalyAlerts, connected } = useSocket();

  const [vitals,     setVitals]     = useState(null);
  const [riskScores, setRiskScores] = useState(null);
  const [profile,    setProfile]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [tourOpen,   setTourOpen]   = useState(false);

  // Demo mode
  const { demoMode, setDemoMode } = useDemo();
  const [demoVitals, setDemoVitals] = useState(null);
  const [demoRisk,   setDemoRisk]   = useState(null);
  const [demoPulse,  setDemoPulse]  = useState(false);
  const demoTimer = useRef(null);



  useEffect(() => {
    if (demoMode) {
      setDemoVitals(generateDemoVitals());
      setDemoRisk(generateDemoRisk());
      demoTimer.current = setInterval(() => {
        setDemoVitals(generateDemoVitals());
        setDemoPulse(true);
        setTimeout(() => setDemoPulse(false), 400);
      }, 3000);
    } else {
      clearInterval(demoTimer.current);
      setDemoVitals(null);
      setDemoRisk(null);
    }
    return () => clearInterval(demoTimer.current);
  }, [demoMode]);

  const displayVitals = demoMode ? demoVitals : (liveVitals || vitals);
  const displayRisk   = demoMode ? demoRisk   : riskScores;
  const isLive        = !demoMode && !!liveVitals && connected;
  const alerts        = demoMode ? DEMO_ALERTS : anomalyAlerts;
  const ignoreRef = useRef(false);

  useEffect(() => {
    ignoreRef.current = false;
    fetchData();
    return () => { ignoreRef.current = true; };
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [v, r, p] = await Promise.allSettled([
        patientAPI.getLatestVitals(),
        mlAPI.getRiskScores(),
        patientAPI.getProfile(),
      ]);
      if (!ignoreRef.current) {
        if (v.status === "fulfilled") setVitals(v.value);
        if (r.status === "fulfilled") setRiskScores(r.value);
        if (p.status === "fulfilled") setProfile(p.value);
      }
    } catch { 
      if (!ignoreRef.current) toast.error("Failed to load dashboard data."); 
    }
    finally  { 
      if (!ignoreRef.current) setLoading(false); 
    }
  }

  useEffect(() => {
    if (profile && !profile.tour_completed && !needsOnboarding) {
      // Small delay to ensure elements are rendered
      setTimeout(() => setTourOpen(true), 500);
    }
  }, [profile]);

  async function handleTourComplete() {
    try {
      await patientAPI.request('/api/patient/tour-complete/', { method: 'POST' });
      setProfile(p => ({ ...p, tour_completed: true }));
    } catch (e) {
      console.error('Failed to save tour completion', e);
    }
  }

  async function handleRecalculate() {
    if (demoMode) { setDemoRisk(generateDemoRisk()); return; }
    try { const d = await mlAPI.calculateRisk(); setRiskScores(d); }
    catch { toast.error("Failed to recalculate risk scores."); }
  }

  const conditions      = displayRisk?.risk_scores?.conditions || displayRisk?.scores || {};
  const shap            = displayRisk?.shap_explanations;
  const needsOnboarding = !user?.onboarding_complete && !profile && !demoMode;

  return (
    <AppShell active="/dashboard">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <Reveal>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-green font-semibold mb-2">— dashboard</p>
              <h1 className="text-4xl md:text-5xl font-semibold">
                Welcome back, {user?.first_name || user?.username}
              </h1>
              <p className="mt-2 text-ink/70 text-sm">Your live vitals, risk scores, and AI insights.</p>
            </div>
            <div className="flex gap-3 items-center flex-wrap">
              {/* Connection badge (real mode only) */}
              {!demoMode && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                  connected ? "border-green-300 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-600"
                }`}>
                  {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
                  {connected ? "Live" : "Offline"}
                </span>
              )}

              {/* Demo badge */}
              {demoMode && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-violet-300 bg-violet-50 text-violet-700">
                  <span className="relative flex h-2 w-2 mr-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                  </span>
                  Demo — live simulation
                </span>
              )}

              {needsOnboarding && (
                <Link to="/onboarding" className="a-button">
                  <span className="a-button__mask">
                    <span className="a-button__text" data-text="Complete onboarding">Complete onboarding</span>
                  </span>
                </Link>
              )}

              {/* Demo / Exit Demo button */}
              {!demoMode ? (
                <button
                  id="demo-mode-btn"
                  onClick={() => setDemoMode(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-200 hover:shadow-violet-300 hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  <FlaskConical size={16} />
                  Demo Mode
                </button>
              ) : (
                <button
                  onClick={() => setDemoMode(false)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm bg-violet-100 text-violet-700 border border-violet-300 hover:bg-violet-200 transition-all duration-200"
                >
                  <X size={16} />
                  Exit Demo
                </button>
              )}

              {!demoMode && (
                <button onClick={fetchData} className="a-button a-button--ghost">
                  <span className="a-button__mask">
                    <span className="a-button__text" data-text="Refresh">Refresh</span>
                  </span>
                </button>
              )}
            </div>
          </div>
        </Reveal>

        {/* Demo banner */}
        {demoMode && (
          <Reveal>
            <div className="mb-6 px-5 py-4 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 flex items-start gap-3">
              <FlaskConical size={20} className="text-violet-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-violet-800 text-sm">Demo Mode active</p>
                <p className="text-violet-600 text-xs mt-0.5">
                  Realistic simulated vitals refreshing every 3 seconds. Risk scores and SHAP explanations are AI-generated for demonstration purposes only.
                </p>
              </div>
            </div>
          </Reveal>
        )}

        {needsOnboarding && (
          <Reveal>
            <div className="ticket p-7 mb-8 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-semibold">Welcome to MediTwin!</h3>
                <p className="text-ink/70 text-sm mt-1">Complete your health profile to unlock AI-powered risk predictions.</p>
              </div>
              <Link to="/onboarding" className="a-button">
                <span className="a-button__mask">
                  <span className="a-button__text" data-text="Get started →">Get started →</span>
                </span>
              </Link>
            </div>
          </Reveal>
        )}

        {/* Vitals */}
        <Reveal>
          <h2 id="vitals-section" className="text-xl font-semibold mb-4 flex items-center gap-2">
            <HeartPulse size={20} className={demoMode ? "text-violet-500" : "text-green"} />
            {demoMode ? "Simulated vitals" : isLive ? "Live vitals" : "Latest vitals"}
            {demoMode && (
              <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[10px] font-bold uppercase tracking-widest transition-opacity ${demoPulse ? "opacity-100" : "opacity-60"}`}>
                <Zap size={10} /> updating
              </span>
            )}
            {isLive && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-widest">
                <Zap size={10} /> streaming
              </span>
            )}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-10">
            <VitalsGauge label="Heart rate"  value={displayVitals?.heart_rate}       unit="bpm"   icon={<HeartPulse size={22}/>}  normal={[60,100]}  color="text-red-500"   isLive={isLive} isDemo={demoMode} pulse={demoPulse} />
            <VitalsGauge label="Systolic"    value={displayVitals?.systolic_bp}      unit="mmHg"  icon={<Activity size={22}/>}    normal={[90,140]}  color="text-amber-500" isLive={isLive} isDemo={demoMode} pulse={demoPulse} />
            <VitalsGauge label="Diastolic"   value={displayVitals?.diastolic_bp}     unit="mmHg"  icon={<Activity size={22}/>}    normal={[60,90]}   color="text-amber-500" isLive={isLive} isDemo={demoMode} pulse={demoPulse} />
            <VitalsGauge label="SpO₂"        value={displayVitals?.spo2}             unit="%"     icon={<Droplets size={22}/>}    normal={[95,100]}  color="text-green"     isLive={isLive} isDemo={demoMode} pulse={demoPulse} />
            <VitalsGauge label="Glucose"     value={displayVitals?.blood_glucose}    unit="mg/dL" icon={<Droplets size={22}/>}    normal={[70,140]}  color="text-green"     isLive={isLive} isDemo={demoMode} pulse={demoPulse} />
            <VitalsGauge label="Temp"        value={displayVitals?.temperature}      unit="°C"    icon={<Thermometer size={22}/>} normal={[36,37.5]} color="text-green"     isLive={isLive} isDemo={demoMode} pulse={demoPulse} />
            <VitalsGauge label="Resp Rate"   value={displayVitals?.respiratory_rate} unit="/min"  icon={<Activity size={22}/>}    normal={[12,20]}   color="text-blue-500"  isLive={isLive} isDemo={demoMode} pulse={demoPulse} />
          </div>
        </Reveal>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Reveal>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-500" /> Recent alerts
            </h2>
            <div className="space-y-2 mb-10">
              {alerts.slice(0, 5).map((alert, i) => (
                <div key={i} className={`ticket px-5 py-3 flex items-center gap-3 ${
                  alert.severity === "critical" ? "border-red-300 bg-red-50/60" : "border-amber-200 bg-amber-50/60"
                }`}>
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${alert.severity === "critical" ? "bg-red-500" : "bg-amber-500"}`} />
                  <span className="text-sm font-semibold flex-1">{alert.message}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    alert.severity === "critical" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                  }`}>{alert.severity}</span>
                </div>
              ))}
            </div>
          </Reveal>
        )}

        {/* Risk scores */}
        <Reveal>
          <div id="risk-section" className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp size={20} className={demoMode ? "text-violet-500" : "text-green"} />
              {demoMode ? "Simulated risk predictions" : "Risk predictions"}
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-medium text-ink/60 flex items-center gap-1.5 bg-green-soft px-3 py-1.5 rounded-full border border-green/20" title="Models trained on Framingham, UKPDS, and KDIGO validated datasets">
                <BookOpen size={14} className="text-green"/> Clinical Evidence
              </span>
              <button onClick={handleRecalculate} className={`text-sm font-semibold a-underline flex items-center gap-1 ${demoMode ? "text-violet-600" : "text-green"}`}>
                <RefreshCw size={14} /> {demoMode ? "Randomize" : "Recalculate"}
              </button>
            </div>
          </div>
          {Object.keys(conditions).length === 0 ? (
            <div className="ticket p-12 text-center text-ink/50">
              <AlertTriangle size={32} className="mx-auto mb-3" />
              <p>No risk scores yet. {demoMode ? "Click Randomize above." : "Submit vitals or recalculate."}</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {Object.entries(conditions).map(([key, val]) => {
                const prob  = val.probability ?? val;
                const level = val.risk_level || (prob > 0.5 ? "high" : prob > 0.25 ? "moderate" : "low");
                const pct   = typeof prob === "number" ? (prob * 100).toFixed(0) : prob;
                const barColor = level === "high"
                  ? "bg-gradient-to-r from-orange-400 to-red-500"
                  : level === "moderate"
                  ? "bg-gradient-to-r from-yellow-400 to-amber-500"
                  : "bg-gradient-to-r from-green-400 to-emerald-500";
                return (
                  <div key={key} className={`ticket p-5 a-hover-tilt ${demoMode ? "ring-1 ring-violet-200/60" : ""}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-sm capitalize">{key.replace(/_/g, " ")}</span>
                      <RiskBadge level={level} />
                    </div>
                    <div className="h-2.5 bg-green-soft rounded-full overflow-hidden mb-2">
                      <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-2xl font-bold">{pct}%</div>
                  </div>
                );
              })}
            </div>
          )}
        </Reveal>

        {/* SHAP */}
        {shap && (
          <Reveal>
            <h2 id="shap-section" className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Brain size={20} className={demoMode ? "text-violet-500" : "text-green"} />
              {demoMode ? "Simulated SHAP explanations" : "SHAP explanations"}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {Object.entries(shap).map(([condition, exp]) => (
                <div key={condition} className={`ticket p-5 ${demoMode ? "ring-1 ring-violet-200/60" : ""}`}>
                  <h4 className="font-semibold capitalize">{condition.replace(/_/g, " ")}</h4>
                  <p className="text-xs text-ink/60 mt-1 mb-3">
                    Risk: {(exp.overall_risk * 100).toFixed(0)}% — <span className="capitalize">{exp.risk_level}</span>
                  </p>
                  {exp.top_factors?.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 mb-1.5 text-xs">
                      <div className="w-28 text-ink/70 truncate capitalize">{f.feature.replace(/_/g, " ")}</div>
                      <div className="flex-1 h-1.5 bg-green-soft rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-red-500 rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(f.impact_pct, 100)}%` }}
                        />
                      </div>
                      <div className="w-10 text-right font-semibold text-ink/70">+{f.impact_pct}%</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Reveal>
        )}

        {/* Achievements & Badges */}
        {profile?.achievements && profile.achievements.length > 0 && (
          <Reveal>
            <h2 className="text-xl font-semibold mt-10 mb-4 flex items-center gap-2">
              <Award size={20} className="text-yellow-500" />
              Achievements
            </h2>
            <div className="flex flex-wrap gap-4 mb-10">
              {profile.achievements.map((badge, i) => (
                <div key={i} className="ticket p-4 flex items-center gap-3 bg-gradient-to-br from-yellow-50 to-amber-50 border-amber-200">
                  <div className="w-10 h-10 rounded-full bg-yellow-400 text-white flex items-center justify-center shadow-inner shadow-yellow-600/20">
                    <Award size={20} />
                  </div>
                  <span className="font-semibold text-amber-900">{badge}</span>
                </div>
              ))}
            </div>
          </Reveal>
        )}

      </div>
      
      <Tour 
        isOpen={tourOpen} 
        onClose={() => setTourOpen(false)} 
        onComplete={handleTourComplete}
        steps={[
          {
            target: '#vitals-section',
            title: 'Live Vitals',
            content: 'Your core metrics tracked in real-time. If you have wearables connected, they stream here directly.'
          },
          {
            target: '#risk-section',
            title: 'AI Risk Predictions',
            content: 'Our ML models continuously analyze your vitals and lifestyle logs to predict potential health risks.'
          },
          {
            target: '#shap-section',
            title: 'Explainable AI (SHAP)',
            content: 'We don\'t just give you a score. We explain exactly which factors (like BMI or Glucose) contributed to it.'
          },
          {
            target: '#demo-mode-btn',
            title: 'Try Demo Mode',
            content: 'No smart devices? No problem! Activate demo mode to simulate live vitals and see the AI react in real-time.'
          }
        ]}
      />
    </AppShell>
  );
}
