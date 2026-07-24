import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { AppShell } from "@/components/Layout";
import { Reveal } from "@/hooks/use-site-motion";
import { patientAPI, mlAPI } from "@/lib/api";
import { toast } from "sonner";
import { UserCircle, HeartPulse, Activity, AlertTriangle, Brain, Shield, TrendingUp, FlaskConical, X, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDemo } from "@/context/DemoContext";

export const Route = createFileRoute("/twin")({
  beforeLoad: () => {
    if (!localStorage.getItem("access_token")) {
      throw redirect({ to: "/login" });
    }
  },
  component: Twin,
});

// ── Helpers & Generators ─────────────────────────────────────────────────────
function getRiskColor(score) {
  if (score < 0.3) return "#10a86a"; // green
  if (score < 0.6) return "#f59e0b"; // amber
  return "#ef4444"; // red
}

function formatRisk(s) {
  if (s == null) return "--";
  return (s * 100).toFixed(1) + "%";
}

function randBetween(min, max, decimals = 0) {
  const v = Math.random() * (max - min) + min;
  return decimals > 0 ? parseFloat(v.toFixed(decimals)) : Math.round(v);
}

function generateDemoProfile() {
  return {
    age: 45,
    gender: "Male",
    height: 178,
    weight: 82,
    bmi: 25.9,
    blood_type: "O+",
  };
}

function generateDemoVitals() {
  return {
    heart_rate: randBetween(62, 98),
    systolic_bp: randBetween(110, 138),
    diastolic_bp: randBetween(70, 88),
    spo2: randBetween(96, 100, 1),
    temperature: randBetween(36.2, 37.4, 1),
    blood_sugar: randBetween(78, 130, 1),
  };
}

function generateDemoRisk() {
  const hrt = randBetween(0.05, 0.45, 3);
  const hyp = randBetween(0.08, 0.38, 3);
  const dia = randBetween(0.05, 0.35, 3);
  return {
    scores: {
      "Heart Disease": hrt,
      "Hypertension": hyp,
      "Diabetes": dia,
    },
    shap: [
      { feature: "Systolic BP", impact: randBetween(0.05, 0.25, 3) },
      { feature: "Heart Rate", impact: randBetween(0.01, 0.15, 3) },
      { feature: "BMI", impact: randBetween(0.02, 0.1, 3) },
      { feature: "Exercise Level", impact: randBetween(-0.15, -0.05, 3) },
    ]
  };
}

// ── Components ───────────────────────────────────────────────────────────────

function VitalGauge({ label, value, unit, min, max, icon: Icon, color, isDemo, pulse }) {
  const pct = value != null ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;
  const display = value != null ? value : "--";
  const ringColor = isDemo ? "#8b5cf6" : color; // violet in demo
  return (
    <div className={`ticket p-5 text-center transition-transform duration-300 ${pulse ? 'scale-105 shadow-lg' : ''} ${isDemo ? 'ring-1 ring-violet-300/40' : ''}`}>
      <div className="flex items-center justify-center gap-2 mb-3">
        <Icon size={18} style={{ color: ringColor }} />
        <span className="text-xs font-semibold text-ink/70">{label}</span>
      </div>
      <div className="relative w-24 h-24 mx-auto mb-2 rounded-full grid place-items-center" style={{ background: `conic-gradient(${ringColor} ${pct}%, rgba(150,150,150,0.1) ${pct}% 100%)`, boxShadow: `0 0 20px ${ringColor}22` }}>
        <div className="w-[78px] h-[78px] rounded-full bg-white grid place-items-center flex-col">
          <div className="text-lg font-bold leading-none" style={{ color: ringColor }}>{display}</div>
          {unit && <div className="text-[9px] text-ink/50 mt-0.5">{unit}</div>}
        </div>
      </div>
    </div>
  );
}

function ShapBar({ feature, impact, isDemo }) {
  const positive = impact >= 0;
  const w = Math.min(Math.abs(impact) * 100, 100);
  const colorStr = isDemo ? (positive ? "rgba(139,92,246,0.8)" : "rgba(167,139,250,0.4)") : (positive ? "rgba(239,68,68,0.6)" : "rgba(16,168,106,0.7)");
  const textColor = isDemo ? (positive ? "text-violet-600" : "text-violet-400") : (positive ? "text-red-500" : "text-green");
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-ink/70">{feature}</span>
        <span className={`font-semibold ${textColor}`}>
          {positive ? "+" : ""}{impact?.toFixed(3)}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden flex bg-green-soft">
        <div className="h-full" style={{ width: "50%" }} />
        <div className="h-full transition-all duration-700" style={{ width: `${w}%`, background: colorStr }} />
      </div>
    </div>
  );
}

// Interactive 3D stacked horizontal curve lines model
function DigitalTwinVisual({ isDemo, pulse }) {
  const colorRGB = isDemo ? "139, 92, 246" : "16, 168, 106";
  const hexHeart = isDemo ? "#a78bfa" : "#10a86a";

  const meshElements = useMemo(() => {
    const elements = [];
    
    // Stacked horizontal slices
    for (let y = 20; y <= 390; y += 6) {
      let segments = [];
      
      if (y >= 20 && y < 55) { // Head
        let w = 18;
        if (y < 28) w = 18 - (28 - y)*1.2;
        if (y > 45) w = 18 - (y - 45)*1.2;
        segments.push([100 - w, 100 + w]);
      } 
      else if (y >= 55 && y < 65) { // Neck
        segments.push([90, 110]);
      }
      else if (y >= 65 && y < 210) { // Torso & Arms
        let w = 55; // total width 45 to 155 (Wider arms)
        if (y < 75) w = 25 + (y - 65) * 3; 
        
        if (y < 100) {
          // Solid upper chest and shoulders
          segments.push([100 - w, 100 + w]);
        } else {
          // Arms detach from torso (Torso is 68 to 132, Arms are 17px wide)
          segments.push([100 - w, 100 - w + 17]); // Left Arm (45 to 62)
          segments.push([68, 132]); // Torso
          segments.push([100 + w - 17, 100 + w]); // Right Arm (138 to 155)
        }
      }
      else if (y >= 210 && y <= 390) { // Slimmer Legs
        let gap = 6;
        if (y < 225) gap = 1 + (y - 210) * (5/15); 
        let w = 32 - gap; // Outer edge stays locked at 32 (aligns perfectly with Torso)
        segments.push([100 - gap - w, 100 - gap]); // Left leg
        segments.push([100 + gap, 100 + gap + w]); // Right leg
      }
      
      segments.forEach(([x1, x2]) => {
        const w = x2 - x1;
        const cx = (x1 + x2) / 2;
        const depth = w * 0.15; // 3D cylinder bulge
        
        // Front curve (solid)
        elements.push({ d: `M ${x1} ${y} Q ${cx} ${y + depth} ${x2} ${y}`, type: 'front' });
        // Back curve (translucent)
        elements.push({ d: `M ${x1} ${y} Q ${cx} ${y - depth} ${x2} ${y}`, type: 'back' });
      });
    }

    // Structural vertical grid lines
    const verticals = [
      `M 100 20 L 100 210`,   // Spine center
      
      // Arms (Moved outwards and wider)
      `M 45 75 L 45 210`,     // Left arm outer
      `M 62 100 L 62 210`,    // Left arm inner
      `M 155 75 L 155 210`,   // Right arm outer
      `M 138 100 L 138 210`,  // Right arm inner
      
      // Torso (Remains unchanged)
      `M 68 100 L 68 210`,    // Left torso outer
      `M 132 100 L 132 210`,  // Right torso outer

      // Legs
      `M 68 210 L 68 390`,    // Left leg outer
      `M 132 210 L 132 390`,  // Right leg outer
      `M 94 225 L 94 390`,    // Left leg inner
      `M 106 225 L 106 390`,  // Right leg inner
      
      `M 81 225 L 81 390`,    // Left leg center
      `M 119 225 L 119 390`,  // Right leg center
      
      `M 82 25 L 82 45`,      // Left head outer
      `M 118 25 L 118 45`,    // Right head outer
    ];
    verticals.forEach(d => elements.push({ d, type: 'vertical' }));

    return elements;
  }, []);

  return (
    <div className={`relative w-full h-[500px] flex items-center justify-center transition-all duration-500`}>
      <div className={`absolute inset-0 bg-gradient-radial ${isDemo ? 'from-violet-500/10' : 'from-green-500/10'} to-transparent blur-[60px] rounded-full`}></div>
      
      <svg viewBox="0 0 200 420" className="w-full h-full z-10" style={{ filter: `drop-shadow(0 0 8px rgba(${colorRGB}, 0.8))` }}>
        
        {/* Back Curves */}
        <g stroke={`rgba(${colorRGB}, 0.15)`} strokeWidth="1" fill="none">
          {meshElements.filter(e => e.type === 'back').map((e, i) => (
            <path key={'b'+i} d={e.d} />
          ))}
        </g>
        
        {/* Vertical Grid Lines */}
        <g stroke={`rgba(${colorRGB}, 0.3)`} strokeWidth="0.75" fill="none">
          {meshElements.filter(e => e.type === 'vertical').map((e, i) => (
            <path key={'v'+i} d={e.d} />
          ))}
        </g>

        {/* Front Curves */}
        <g stroke={`rgba(${colorRGB}, 0.85)`} strokeWidth="1.2" fill="none" className={pulse ? "animate-pulse" : ""}>
          {meshElements.filter(e => e.type === 'front').map((e, i) => (
            <path key={'f'+i} d={e.d} />
          ))}
        </g>
        
        {/* Glowing Nodes (Vital Organs & Joints) */}
        <g fill={`rgba(${colorRGB}, 1)`}>
          {/* Brain */}
          <circle cx="100" cy="35" r="4.5" className={pulse ? "animate-ping" : ""} />
          <circle cx="100" cy="35" r="3" fill="#fff" />
          
          {/* Heart */}
          <circle cx="115" cy="110" r="5.5" className={isDemo || pulse ? "animate-ping" : ""} fill={hexHeart} />
          <circle cx="115" cy="110" r="3" fill="#fff" />
          
          {/* Lungs */}
          <circle cx="85" cy="120" r="3" />
          <circle cx="115" cy="120" r="3" />
          
          {/* Core */}
          <circle cx="100" cy="170" r="3.5" />
          
          {/* Major Joints */}
          {[
            [146, 75], [54, 75],    // Shoulders
            [146, 140], [54, 140],  // Elbows
            [146, 200], [54, 200],  // Hands
            [119, 215], [81, 215],  // Hips
            [119, 300], [81, 300],  // Knees
            [119, 390], [81, 390],  // Ankles/Feet
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.5" />
          ))}
        </g>
      </svg>
    </div>
  );
}


// ── Main View ────────────────────────────────────────────────────────────────

function Twin() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Real Data
  const [profile, setProfile] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [riskScores, setRiskScores] = useState(null);
  const [shap, setShap] = useState(null);

  // Demo Mode
  const { demoMode, setDemoMode } = useDemo();
  const [demoVitals, setDemoVitals] = useState(null);
  const [demoRisk, setDemoRisk] = useState(null);
  const [demoPulse, setDemoPulse] = useState(false);
  const demoTimer = useRef(null);

  useEffect(() => {
    let ignore = false;

    async function fetchData() {
      if (demoMode) { setLoading(false); return; }
      setLoading(true);
      try {
        const [p, v, r] = await Promise.all([
          patientAPI.getProfile(),
          patientAPI.getLatestVitals(),
          mlAPI.getRiskScores(),
        ]);
        if (!ignore) {
          setProfile(p); setVitals(v); setRiskScores(r);
          if (r?.shap) setShap(r.shap);
          else if (r?.explanations) setShap(r.explanations);
        }
      } catch {
        if (!ignore) toast.error("Failed to load digital twin data.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchData();
    return () => { ignore = true; };
  }, [demoMode]);

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

  const displayProfile = demoMode ? generateDemoProfile() : profile;
  const displayVitals = demoMode ? demoVitals : vitals;
  const displayRisk = demoMode ? demoRisk?.scores : (riskScores?.risks || riskScores?.scores || Object.fromEntries(Object.entries(riskScores || {}).filter(([k]) => k !== "shap" && k !== "explanations")));
  const displayShap = demoMode ? demoRisk?.shap : shap;

  const noData = !displayVitals && !displayRisk && !displayProfile;

  return (
    <AppShell active="/twin">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header */}
        <Reveal>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <div>
              <p className={`text-[11px] uppercase tracking-[0.3em] ${demoMode ? 'text-violet-600' : 'text-green'} font-semibold mb-2`}>
                — digital twin
              </p>
              <h1 className="text-4xl md:text-5xl font-semibold">My Health Twin</h1>
              <p className="mt-2 text-ink/70 text-sm">Your health profile, vitals, risk assessment, and AI insights.</p>
            </div>
            
            <div className="flex gap-3 items-center">
              {demoMode && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-violet-300 bg-violet-50 text-violet-700">
                  <span className="relative flex h-2 w-2 mr-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                  </span>
                  Twin Simulation Active
                </span>
              )}

              {!demoMode ? (
                <button
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

              <Link to="/whatif" className="a-button">
                <span className="a-button__mask">
                  <span className="a-button__text" data-text="Run simulation →">Run simulation →</span>
                </span>
              </Link>
            </div>
          </div>
        </Reveal>

        {loading && !demoMode ? (
          <div className="ticket p-16 text-center text-ink/50">Loading your digital twin…</div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Left Column: 3D Twin Visual */}
            <div className="lg:w-1/3 flex flex-col">
              <Reveal>
                <div className={`ticket p-6 flex-1 flex flex-col items-center justify-center min-h-[550px] ${demoMode ? 'ring-1 ring-violet-300/40 bg-gradient-to-b from-violet-50/30 to-transparent' : ''}`}>
                  <h2 className="text-lg font-semibold w-full text-center mb-2 flex items-center justify-center gap-2">
                    <UserCircle size={20} className={demoMode ? "text-violet-500" : "text-green"} /> 
                    {demoMode ? "Simulated Twin" : "Your Digital Body"}
                  </h2>
                  <p className="text-xs text-ink/50 text-center w-full mb-4">Interactive physiological map</p>
                  
                  <DigitalTwinVisual isDemo={demoMode} pulse={demoPulse} />
                </div>
              </Reveal>
            </div>

            {/* Right Column: Data */}
            <div className="lg:w-2/3 flex flex-col gap-6">
              {!noData ? (
                <>
                  {displayProfile && (
                    <Reveal>
                      <div className={`ticket p-6 ${demoMode ? 'ring-1 ring-violet-300/40' : ''}`}>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <UserCircle size={20} className={demoMode ? "text-violet-500" : "text-green"} /> 
                          Health profile
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                          {[
                            ["Age", displayProfile.age],
                            ["Gender", displayProfile.gender],
                            ["Height", displayProfile.height ? `${displayProfile.height} cm` : "--"],
                            ["Weight", displayProfile.weight ? `${displayProfile.weight} kg` : "--"],
                            ["BMI", displayProfile.bmi],
                            ["Blood type", displayProfile.blood_type],
                          ].map(([k, v]) => (
                            <div key={k}>
                              <p className={`text-[10px] uppercase tracking-widest ${demoMode ? 'text-violet-600/70' : 'text-ink/50'} font-semibold`}>{k}</p>
                              <p className="text-lg font-bold mt-1">{v ?? "--"}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Reveal>
                  )}

                  {displayVitals && (
                    <Reveal>
                      <div className="flex items-center justify-between mb-4 mt-2">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          <HeartPulse size={20} className={demoMode ? "text-violet-500" : "text-green"} /> 
                          Latest vitals
                          {demoMode && (
                            <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[10px] font-bold uppercase tracking-widest transition-opacity ${demoPulse ? "opacity-100" : "opacity-60"}`}>
                              <Zap size={10} /> live
                            </span>
                          )}
                        </h2>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-2">
                        <VitalGauge label="Heart rate" value={displayVitals.heart_rate} unit="bpm" min={40} max={120} icon={HeartPulse} color="#ef4444" isDemo={demoMode} pulse={demoPulse} />
                        <VitalGauge label="Systolic" value={displayVitals.systolic_bp} unit="mmHg" min={80} max={200} icon={Activity} color="#f59e0b" isDemo={demoMode} pulse={demoPulse} />
                        <VitalGauge label="Diastolic" value={displayVitals.diastolic_bp} unit="mmHg" min={50} max={130} icon={Activity} color="#f59e0b" isDemo={demoMode} pulse={demoPulse} />
                        <VitalGauge label="SpO₂" value={displayVitals.spo2} unit="%" min={70} max={100} icon={Activity} color="#10a86a" isDemo={demoMode} pulse={demoPulse} />
                        <VitalGauge label="Temperature" value={displayVitals.temperature} unit="°C" min={35} max={42} icon={Activity} color="#10a86a" isDemo={demoMode} pulse={demoPulse} />
                        <VitalGauge label="Glucose" value={displayVitals.blood_sugar || displayVitals.glucose} unit="mg/dL" min={60} max={200} icon={Activity} color="#10a86a" isDemo={demoMode} pulse={demoPulse} />
                      </div>
                    </Reveal>
                  )}

                  {displayRisk && (
                    <div className="grid md:grid-cols-2 gap-6 mt-2">
                      <Reveal>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Shield size={20} className={demoMode ? "text-violet-500" : "text-green"} /> 
                          Risk assessment
                        </h2>
                        <div className={`ticket p-6 space-y-4 ${demoMode ? 'ring-1 ring-violet-300/40' : ''}`}>
                          {Object.entries(displayRisk).map((entry, i) => {
                            const name = entry[0];
                            const score = entry[1];
                            const color = demoMode 
                              ? (score > 0.3 ? "#8b5cf6" : "#a78bfa")
                              : getRiskColor(typeof score === "number" ? score : parseFloat(score));
                            return (
                              <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-ink/70">{name}</span>
                                  <span className="font-bold" style={{ color }}>{formatRisk(score)}</span>
                                </div>
                                <div className="h-2 rounded-full bg-green-soft overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (score || 0) * 100)}%`, background: color }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Reveal>

                      <Reveal>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Brain size={20} className={demoMode ? "text-violet-500" : "text-green"} /> 
                          SHAP explanations
                        </h2>
                        <div className={`ticket p-6 h-[calc(100%-2.5rem)] ${demoMode ? 'ring-1 ring-violet-300/40' : ''}`}>
                          {displayShap ? (
                            Array.isArray(displayShap)
                              ? displayShap.map((item, i) => <ShapBar key={i} feature={item.feature || item.name} impact={item.impact ?? item.shap_value ?? 0} isDemo={demoMode} />)
                              : typeof displayShap === "object"
                                ? Object.entries(displayShap).map(([k, v], i) => <ShapBar key={i} feature={k} impact={typeof v === "object" ? (v.impact ?? v.shap_value ?? 0) : (typeof v === "number" ? v : 0)} isDemo={demoMode} />)
                                : <p className="text-sm text-ink/60">No SHAP data available.</p>
                          ) : (
                            <p className="text-sm text-ink/60">SHAP explanations not yet available.</p>
                          )}
                        </div>
                      </Reveal>
                    </div>
                  )}
                </>
              ) : (
                <div className="ticket p-12 text-center h-full flex flex-col items-center justify-center">
                  <UserCircle size={40} className="mx-auto mb-3 text-ink/30" />
                  <p className="text-ink/60">No digital twin data available. Complete your health profile to get started.</p>
                  <Link to="/profile" className="a-button inline-flex mt-6">
                    <span className="a-button__mask">
                      <span className="a-button__text" data-text="Complete profile">Complete profile</span>
                    </span>
                  </Link>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </AppShell>
  );
}
