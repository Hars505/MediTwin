import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Reveal } from "@/hooks/use-site-motion";
import { useAuth } from "@/context/AuthContext";
import { patientAPI } from "@/lib/api";
import { calculateAge } from "@/lib/utils";
import { toast } from "sonner";
import { Ruler, Weight, Droplet, Heart, AlertCircle, Pill, Phone, User, CheckCircle2, ChevronRight, ChevronLeft, Activity } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

const STEPS = [
  { id: 1, title: "Body Metrics", icon: Ruler },
  { id: 2, title: "Medical History", icon: Heart },
  { id: 3, title: "Emergency Contact", icon: Phone },
];

function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    height_cm: "",
    weight_kg: "",
    blood_group: "",
    chronic_conditions: "",
    allergies: "",
    medications: "",
    smoking: false,
    alcohol: false,
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relation: "",
  });

  // Age is derived from the user's date_of_birth on the account profile.
  // If somehow missing, fall back to a previously saved age on the patient profile.
  const [derivedAge, setDerivedAge] = useState(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let ageFromDob = calculateAge(user?.date_of_birth);
      if (ageFromDob == null) {
        try {
          const p = await patientAPI.getProfile();
          if (!cancelled && p?.age != null) ageFromDob = p.age;
        } catch { /* ignore — onboarding still works without an age */ }
      }
      if (!cancelled) setDerivedAge(ageFromDob);
    })();
    return () => { cancelled = true; };
  }, [user?.date_of_birth]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  function validateStep() {
    if (step === 1) {
      if (!form.height_cm || !form.weight_kg) return "Height and weight are required.";
      if (isNaN(form.height_cm) || isNaN(form.weight_kg)) return "Height and weight must be numbers.";
    }
    if (step === 3) {
      if (!form.emergency_contact_name || !form.emergency_contact_phone) {
        return "Emergency contact name and phone are required.";
      }
    }
    return "";
  }

  function handleNext() {
    const err = validateStep();
    if (err) { toast.error(err); return; }
    setStep((s) => s + 1);
  }
  function handleBack() {
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    const err = validateStep();
    if (err) { toast.error(err); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        // Age is no longer a manual input — always derived from date_of_birth.
        age: derivedAge || user?.age || 30,
        height_cm: Number(form.height_cm),
        weight_kg: Number(form.weight_kg),
        blood_type: form.blood_group,
        medical_conditions: form.chronic_conditions ? form.chronic_conditions.split(",").map((s) => s.trim()).filter(Boolean) : [],
        allergies: form.allergies ? form.allergies.split(",").map((s) => s.trim()).filter(Boolean) : [],
        medications: form.medications ? form.medications.split(",").map((s) => s.trim()).filter(Boolean) : [],
        alcohol: form.alcohol ? "occasional" : "none",
        onboarding_complete: true,
      };
      await patientAPI.saveProfile(payload);
      await refreshProfile();
      navigate({ to: "/dashboard" });
    } catch (err) {
      const data = err.data;
      if (data && typeof data === "object") {
        const k = Object.keys(data)[0];
        const v = data[k];
        toast.error(Array.isArray(v) ? `${k}: ${v[0]}` : `${k}: ${v}`);
      } else {
        toast.error("Failed to save profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.3em] text-green font-semibold mb-3">
            — step {step} of {STEPS.length}
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold">Set up your digital twin</h1>
          <p className="mt-3 text-ink/70 max-w-xl">
            A 3-step intake to baseline your health. Your twin will refine its predictions as you log more data.
          </p>
        </Reveal>

        {/* Stepper */}
        <div className="mt-10 flex items-center ticket p-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex-1 flex items-center">
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-full transition-colors ${
                    isActive ? "bg-green text-white" : isDone ? "bg-green-soft text-green" : "text-ink/40"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-white/20 grid place-items-center">
                    {isDone ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                  </div>
                  <span className="text-sm font-semibold hidden sm:inline">{s.title}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${isDone ? "bg-green" : "bg-line"}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 ticket p-8">
          {step === 1 && (
            <Reveal>
              <h2 className="text-2xl font-semibold mb-2">Body metrics</h2>
              <p className="text-ink/70 text-sm mb-8">These help calculate your BMI and risk baselines.</p>
              {derivedAge !== null && derivedAge !== undefined && (
                <p className="text-sm text-ink/70 mb-4">
                  Age: <span className="font-semibold text-ink">{derivedAge} years</span>
                  <span className="text-ink/50"> — auto-calculated from your date of birth</span>
                </p>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="height_cm" className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Height (cm)</label>
                  <div className="flex items-center gap-3 bg-white border border-line rounded-full px-5 py-3 focus-within:border-green focus-within:ring-2 focus-within:ring-green/20 transition-all">
                    <Ruler size={18} className="text-ink/50" />
                    <input type="number" id="height_cm" name="height_cm" value={form.height_cm} onChange={handleChange} placeholder="170" min="50" max="250" className="flex-1 outline-none bg-transparent" aria-required="true" />
                  </div>
                </div>
                <div>
                  <label htmlFor="weight_kg" className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Weight (kg)</label>
                  <div className="flex items-center gap-3 bg-white border border-line rounded-full px-5 py-3 focus-within:border-green focus-within:ring-2 focus-within:ring-green/20 transition-all">
                    <Weight size={18} className="text-ink/50" />
                    <input type="number" id="weight_kg" name="weight_kg" value={form.weight_kg} onChange={handleChange} placeholder="70" min="20" max="300" step="0.1" className="flex-1 outline-none bg-transparent" aria-required="true" />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="blood_group" className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Blood group</label>
                <div className="flex items-center gap-3 bg-white border border-line rounded-full px-5 py-3 focus-within:border-green focus-within:ring-2 focus-within:ring-green/20 transition-all">
                  <Droplet size={18} className="text-ink/50" />
                  <select id="blood_group" name="blood_group" value={form.blood_group} onChange={handleChange} className="flex-1 outline-none bg-transparent" aria-label="Select blood group">
                    <option value="">Select</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Reveal>
          )}

          {step === 2 && (
            <Reveal>
              <h2 className="text-2xl font-semibold mb-2">Medical history</h2>
              <p className="text-ink/70 text-sm mb-8">Comma-separated. Leave blank if none.</p>
              <div className="grid gap-4">
                <div>
                  <label htmlFor="chronic_conditions" className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Chronic conditions</label>
                  <div className="flex items-center gap-3 bg-white border border-line rounded-full px-5 py-3 focus-within:border-green focus-within:ring-2 focus-within:ring-green/20 transition-all">
                    <Heart size={18} className="text-ink/50" />
                    <input type="text" id="chronic_conditions" name="chronic_conditions" value={form.chronic_conditions} onChange={handleChange} placeholder="diabetes, hypertension, asthma" className="flex-1 outline-none bg-transparent" />
                  </div>
                </div>
                <div>
                  <label htmlFor="allergies" className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Allergies</label>
                  <div className="flex items-center gap-3 bg-white border border-line rounded-full px-5 py-3 focus-within:border-green focus-within:ring-2 focus-within:ring-green/20 transition-all">
                    <AlertCircle size={18} className="text-ink/50" />
                    <input type="text" id="allergies" name="allergies" value={form.allergies} onChange={handleChange} placeholder="penicillin, peanuts" className="flex-1 outline-none bg-transparent" />
                  </div>
                </div>
                <div>
                  <label htmlFor="medications" className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Current medications</label>
                  <div className="flex items-center gap-3 bg-white border border-line rounded-full px-5 py-3 focus-within:border-green focus-within:ring-2 focus-within:ring-green/20 transition-all">
                    <Pill size={18} className="text-ink/50" />
                    <input type="text" id="medications" name="medications" value={form.medications} onChange={handleChange} placeholder="metformin, atorvastatin" className="flex-1 outline-none bg-transparent" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  <label htmlFor="smoking" className="flex items-center gap-3 p-4 rounded-2xl border border-line cursor-pointer hover:border-green focus-within:ring-2 focus-within:ring-green/20 transition-all">
                    <input type="checkbox" id="smoking" name="smoking" checked={form.smoking} onChange={handleChange} className="w-5 h-5 accent-green focus:ring-green" />
                    <span className="text-sm">I smoke or use tobacco</span>
                  </label>
                  <label htmlFor="alcohol" className="flex items-center gap-3 p-4 rounded-2xl border border-line cursor-pointer hover:border-green focus-within:ring-2 focus-within:ring-green/20 transition-all">
                    <input type="checkbox" id="alcohol" name="alcohol" checked={form.alcohol} onChange={handleChange} className="w-5 h-5 accent-green focus:ring-green" />
                    <span className="text-sm">I consume alcohol regularly</span>
                  </label>
                </div>
              </div>
            </Reveal>
          )}

          {step === 3 && (
            <Reveal>
              <h2 className="text-2xl font-semibold mb-2">Emergency contact</h2>
              <p className="text-ink/70 text-sm mb-8">Who should we notify in case of emergency?</p>
              <div className="grid gap-4">
                <div>
                  <label htmlFor="emergency_contact_name" className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Full name</label>
                  <div className="flex items-center gap-3 bg-white border border-line rounded-full px-5 py-3 focus-within:border-green focus-within:ring-2 focus-within:ring-green/20 transition-all">
                    <User size={18} className="text-ink/50" />
                    <input type="text" id="emergency_contact_name" name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} placeholder="Jane Doe" className="flex-1 outline-none bg-transparent" aria-required="true" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="emergency_contact_phone" className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Phone</label>
                    <div className="flex items-center gap-3 bg-white border border-line rounded-full px-5 py-3 focus-within:border-green focus-within:ring-2 focus-within:ring-green/20 transition-all">
                      <Phone size={18} className="text-ink/50" />
                      <input type="tel" id="emergency_contact_phone" name="emergency_contact_phone" value={form.emergency_contact_phone} onChange={handleChange} placeholder="9876543210" className="flex-1 outline-none bg-transparent" aria-required="true" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="emergency_contact_relation" className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Relation</label>
                    <div className="flex items-center gap-3 bg-white border border-line rounded-full px-5 py-3 focus-within:border-green focus-within:ring-2 focus-within:ring-green/20 transition-all">
                      <select id="emergency_contact_relation" name="emergency_contact_relation" value={form.emergency_contact_relation} onChange={handleChange} className="flex-1 outline-none bg-transparent bg-none" aria-label="Select emergency contact relation">
                        <option value="">Select</option>
                        {["spouse", "parent", "sibling", "child", "friend", "other"].map((r) => (
                          <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          <div className="mt-10 flex justify-between gap-3">
            {step > 1 ? (
              <button type="button" onClick={handleBack} className="a-button a-button--ghost">
                <span className="a-button__mask">
                  <span className="a-button__text" data-text="Back">Back</span>
                </span>
              </button>
            ) : <span />}
            {step < STEPS.length ? (
              <button type="button" onClick={handleNext} className="a-button">
                <span className="a-button__mask">
                  <span className="a-button__text" data-text="Next →">Next →</span>
                </span>
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading} className="a-button">
                <span className="a-button__mask">
                  <span className="a-button__text" data-text={loading ? "Saving..." : "Complete setup"}>
                    {loading ? "Saving..." : "Complete setup"}
                  </span>
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
