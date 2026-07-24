import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/Layout";
import { Reveal } from "@/hooks/use-site-motion";
import { patientAPI } from "@/lib/api";
import { toast } from "sonner";
import { Moon, Footprints, Droplets, Brain, Dumbbell, Plus, RefreshCw, BarChart3, Calendar, ClipboardList, Target, Award } from "lucide-react";

export const Route = createFileRoute("/lifestyle")({
  beforeLoad: () => {
    if (!localStorage.getItem("access_token")) {
      throw redirect({ to: "/login" });
    }
  },
  component: Lifestyle,
});

function stressColor(level) {
  if (level <= 3) return "#10a86a";
  if (level <= 6) return "#f59e0b";
  return "#ef4444";
}

function Lifestyle() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [history, setHistory] = useState([]);
  const [knownBadges, setKnownBadges] = useState([]);
  const [form, setForm] = useState({
    sleep_hours: "",
    steps: "",
    water_intake_ml: "",
    meals: "",
    stress_level: 5,
    exercise_minutes: "",
    notes: "",
  });

  const ignoreRef = useRef(false);

  useEffect(() => {
    ignoreRef.current = false;
    fetchHistory();
    fetchProfile();
    return () => { ignoreRef.current = true; };
  }, []);

  async function fetchHistory() {
    setLoading(true);
    try {
      const data = await patientAPI.getLifestyle(30);
      if (!ignoreRef.current) setHistory(data?.results || data || []);
    } catch {
      if (!ignoreRef.current) toast.error("Failed to load lifestyle history.");
    } finally {
      if (!ignoreRef.current) setLoading(false);
    }
  }

  async function fetchProfile() {
    try {
      const p = await patientAPI.getProfile();
      if (!ignoreRef.current && p?.achievements) setKnownBadges(p.achievements);
    } catch (e) {
      // ignore
    }
  }
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await patientAPI.logLifestyle({
        sleep_hours: form.sleep_hours ? parseFloat(form.sleep_hours) : null,
        steps: form.steps ? parseInt(form.steps) : null,
        water_intake_ml: form.water_intake_ml ? parseInt(form.water_intake_ml) : null,
        meals: form.meals ? form.meals.split(",").map((m) => m.trim()).filter(Boolean) : [],
        stress_level: parseInt(form.stress_level),
        exercise_minutes: form.exercise_minutes ? parseInt(form.exercise_minutes) : null,
        notes: form.notes || "",
      });
      toast.success("Lifestyle entry logged.");
      setForm({ sleep_hours: "", steps: "", water_intake_ml: "", meals: "", stress_level: 5, exercise_minutes: "", notes: "" });
      fetchHistory();
      
      // Check for new badges
      if (res?.achievements) {
        const newEarned = res.achievements.filter(b => !knownBadges.includes(b));
        if (newEarned.length > 0) {
          newEarned.forEach(badge => {
            toast.custom((t) => (
              <div className="ticket p-4 bg-yellow-50 border-yellow-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-400 text-white flex items-center justify-center shadow-inner shadow-yellow-600/20">
                  <Award size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-yellow-900 text-sm">Achievement Unlocked!</h4>
                  <p className="text-yellow-800 text-xs font-semibold">{badge}</p>
                </div>
              </div>
            ));
          });
          setKnownBadges(res.achievements);
        }
      }
    } catch {
      toast.error("Failed to save entry.");
    } finally {
      setSaving(false);
    }
  }
  function formatDate(s) {
    if (!s) return "--";
    return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  return (
    <AppShell active="/lifestyle">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <Reveal>
          <div className="mb-6">
            <p className="text-[11px] uppercase tracking-[0.3em] text-green font-semibold mb-2">— daily log</p>
            <h1 className="text-4xl md:text-5xl font-semibold">Lifestyle Tracker</h1>
            <p className="mt-2 text-ink/70 text-sm">Log your daily activity, sleep, nutrition, and stress to track health patterns.</p>
          </div>
        </Reveal>

        <div className="grid lg:grid-cols-2 gap-6">
          <Reveal>
            <form onSubmit={handleSubmit} className="ticket p-7 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Plus size={18} /> Log today's entry</h2>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-ink/50 font-semibold flex items-center gap-1 mb-1.5"><Moon size={11} /> Sleep (hours)</label>
                <input type="number" name="sleep_hours" value={form.sleep_hours} onChange={handleChange} placeholder="7.5" min="0" max="24" step="0.5" className="w-full bg-white border border-line rounded-full px-5 py-3 outline-none text-sm focus:border-green" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-ink/50 font-semibold flex items-center gap-1 mb-1.5"><Footprints size={11} /> Steps</label>
                <input type="number" name="steps" value={form.steps} onChange={handleChange} placeholder="8000" min="0" className="w-full bg-white border border-line rounded-full px-5 py-3 outline-none text-sm focus:border-green" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-ink/50 font-semibold flex items-center gap-1 mb-1.5"><Droplets size={11} /> Water intake (ml)</label>
                <input type="number" name="water_intake_ml" value={form.water_intake_ml} onChange={handleChange} placeholder="2000" min="0" className="w-full bg-white border border-line rounded-full px-5 py-3 outline-none text-sm focus:border-green" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-ink/50 font-semibold flex items-center gap-1 mb-1.5"><ClipboardList size={11} /> Meals (comma separated)</label>
                <input type="text" name="meals" value={form.meals} onChange={handleChange} placeholder="Oatmeal, Salad, Chicken" className="w-full bg-white border border-line rounded-full px-5 py-3 outline-none text-sm focus:border-green" />
                <p className="text-xs text-ink/40 mt-1 px-3">Separate meals with commas</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-ink/50 font-semibold flex items-center gap-1 mb-1.5"><Brain size={11} /> Stress level ({form.stress_level}/10)</label>
                <div className="flex items-center gap-3">
                  <input type="range" name="stress_level" min="1" max="10" value={form.stress_level} onChange={handleChange} className="flex-1" style={{ accentColor: stressColor(parseInt(form.stress_level)) }} />
                  <span className="font-bold text-xl w-8 text-center" style={{ color: stressColor(parseInt(form.stress_level)) }}>{form.stress_level}</span>
                </div>
                <div className="flex justify-between text-[10px] text-ink/40 mt-0.5 px-1"><span>Low</span><span>High</span></div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-ink/50 font-semibold flex items-center gap-1 mb-1.5"><Dumbbell size={11} /> Exercise (minutes)</label>
                <input type="number" name="exercise_minutes" value={form.exercise_minutes} onChange={handleChange} placeholder="30" min="0" className="w-full bg-white border border-line rounded-full px-5 py-3 outline-none text-sm focus:border-green" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-ink/50 font-semibold flex items-center gap-1 mb-1.5"><ClipboardList size={11} /> Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="How are you feeling today?" rows={3} className="w-full bg-white border border-line rounded-2xl px-5 py-3 outline-none text-sm focus:border-green resize-none" />
              </div>
              <button type="submit" disabled={saving} className="a-button w-full justify-center">
                <span className="a-button__mask">
                  <span className="a-button__text" data-text={saving ? "Saving..." : "Log entry"}>{saving ? "Saving..." : "Log entry"}</span>
                </span>
              </button>
            </form>
          </Reveal>

          <Reveal>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Calendar size={18} /> Last 30 days</h2>
              <button onClick={fetchHistory} className="text-xs text-green font-semibold a-underline flex items-center gap-1"><RefreshCw size={12} /> Refresh</button>
            </div>
            {loading ? (
              <div className="ticket p-12 text-center text-ink/50">Loading history…</div>
            ) : history.length === 0 ? (
              <div className="ticket p-12 text-center text-ink/50">
                <BarChart3 size={32} className="mx-auto mb-3" />
                <p>No lifestyle entries yet. Start logging above!</p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Today's Goals Progress */}
                {history[0] && (
                  <div className="ticket p-5 bg-gradient-to-br from-green-soft to-emerald-50 mb-4">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-green">
                      <Target size={16} /> Latest Log Progress
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      {/* Steps Goal (10,000) */}
                      <div>
                        <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-ink/60 mb-1.5">
                          <span>Steps</span>
                          <span>{Math.min(history[0].steps || 0, 10000)} / 10k</span>
                        </div>
                        <div className="h-1.5 bg-white rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(((history[0].steps || 0) / 10000) * 100, 100)}%` }} />
                        </div>
                      </div>
                      {/* Water Goal (2500ml) */}
                      <div>
                        <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-ink/60 mb-1.5">
                          <span>Water</span>
                          <span>{Math.min(history[0].water_intake_ml || 0, 2500)} / 2.5L</span>
                        </div>
                        <div className="h-1.5 bg-white rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(((history[0].water_intake_ml || 0) / 2500) * 100, 100)}%` }} />
                        </div>
                      </div>
                      {/* Sleep Goal (8h) */}
                      <div>
                        <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-ink/60 mb-1.5">
                          <span>Sleep</span>
                          <span>{Math.min(history[0].sleep_hours || 0, 8)} / 8h</span>
                        </div>
                        <div className="h-1.5 bg-white rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-400 rounded-full transition-all duration-1000" style={{ width: `${Math.min(((history[0].sleep_hours || 0) / 8) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {history.map((e, i) => (
                  <div key={e.id || i} className="ticket p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-ink/50 flex items-center gap-1"><Calendar size={11} /> {formatDate(e.date || e.created_at)}</span>
                      {e.stress_level && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${stressColor(e.stress_level)}22`, color: stressColor(e.stress_level) }}>
                          Stress: {e.stress_level}/10
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-ink/70">
                      <span className="flex items-center gap-1"><Moon size={11} /> {e.sleep_hours ?? "--"}h</span>
                      <span className="flex items-center gap-1"><Footprints size={11} /> {e.steps ?? "--"}</span>
                      <span className="flex items-center gap-1"><Droplets size={11} /> {e.water_intake_ml ?? "--"}ml</span>
                      <span className="flex items-center gap-1"><Dumbbell size={11} /> {e.exercise_minutes ?? "--"}m</span>
                    </div>
                    {e.meals?.length > 0 && <p className="text-xs text-ink/60 mt-2"><ClipboardList size={11} className="inline mr-1" />{e.meals.join(", ")}</p>}
                    {e.notes && <p className="text-xs text-ink/50 italic mt-1.5">"{e.notes}"</p>}
                  </div>
                ))}
              </div>
              </div>
            )}
          </Reveal>
        </div>
      </div>
    </AppShell>
  );
}
