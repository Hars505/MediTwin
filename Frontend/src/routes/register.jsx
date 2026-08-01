import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { Reveal } from "@/hooks/use-site-motion";
import { toast } from "sonner";
import { User, Mail, Lock, Phone, Calendar, Eye, EyeOff, CheckCircle2 } from "lucide-react";

const GOOGLE_CLIENT_ID = "33056017162-d7v505gald39grpar8o7u7fpo1ei0fui.apps.googleusercontent.com";
import {
  DOB_MIN,
  dobMax,
  calculateAge,
  validateName,
  validateUsername,
  validateEmail,
  validatePhone,
  validatePassword,
  validateDateOfBirth,
  validateGender,
} from "@/lib/utils";

export const Route = createFileRoute("/register")({
  component: Register,
});

function Register() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
    first_name: "",
    last_name: "",
    role: "patient",
    phone: "",
    gender: "",
    date_of_birth: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef(null);

  // Load Google Identity Services script and render the button
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          text: "signup_with",
          shape: "pill",
          logo_alignment: "left",
          width: "700",
        });
      }
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  async function handleGoogleCallback(response) {
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle(response.credential);
      toast.success(result.created ? "Account created with Google!" : "Signed in with Google!");
      navigate({ to: result.created ? "/onboarding" : "/dashboard" });
    } catch (err) {
      toast.error(err.data?.detail || "Google sign-up failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }

  // DOB limits (frontend can only show 1900-01-01..today-10y in the picker).
  const minDob = DOB_MIN;
  const maxDob = dobMax(10);
  // Live age preview as the user types a DOB.
  const agePreview = useMemo(() => calculateAge(form.date_of_birth), [form.date_of_birth]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: "" });
  }

  function validate() {
    const e = {};
    e.username = validateUsername(form.username);
    e.email = validateEmail(form.email);
    e.first_name = validateName(form.first_name, "First name");
    e.last_name = validateName(form.last_name, "Last name");
    const phoneErr = validatePhone(form.phone);
    e.phone = phoneErr;
    e.gender = validateGender(form.gender);
    e.date_of_birth = validateDateOfBirth(form.date_of_birth);
    e.password = validatePassword(form.password);
    e.password2 =
      !form.password2 ? "Please confirm your password."
        : form.password !== form.password2 ? "Passwords don't match."
          : "";
    // Strip empty/optional errors so we only show real problems.
    Object.keys(e).forEach((k) => { if (!e[k]) delete e[k]; });
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await register(form);
      setSuccess(true);
      setTimeout(() => navigate({ to: "/onboarding" }), 1200);
    } catch (err) {
      const data = err.data || {};
      if (typeof data === "object") {
        const fe = {};
        for (const [k, v] of Object.entries(data)) fe[k] = Array.isArray(v) ? v[0] : v;
        setErrors(fe);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-6 py-24 text-center auth-page-wrapper">
          <Reveal>
            <div className="ticket p-10">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-soft grid place-items-center text-green mb-6">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Account created</h2>
              <p className="text-ink/70 text-sm">Taking you to onboarding…</p>
            </div>
          </Reveal>
        </div>
      </Layout>
    );
  }

  const inputCls = "flex items-center gap-3 bg-white border border-line rounded-full px-5 py-3 focus-within:border-green transition-colors";
  const inputInnerCls = "flex-1 outline-none bg-transparent text-sm";

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-12 grid lg:grid-cols-2 gap-10 items-start auth-page-wrapper">
        <Reveal className="ticket p-10 bg-green text-ink dark:text-white relative overflow-hidden hidden lg:block">
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white text-green grid place-items-center mb-6 shadow-[0_8px_24px_rgba(0,0,0,0.15)]">
              <span className="text-2xl">✚</span>
            </div>
            <h2 className="text-3xl font-semibold mb-3">Join Medi Twin.</h2>
            <p className="text-ink/85 dark:text-white/85 leading-relaxed mb-8 max-w-sm">
              Create your account and start building your digital health twin in minutes.
            </p>
            <ul className="space-y-3 text-sm">
              {["Free health risk assessment", "AI-powered health insights", "Auto-generated health reports", "24/7 medical chatbot access"].map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-white text-green grid place-items-center text-[10px] font-bold">✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="absolute -right-12 -bottom-12 w-56 h-56 rounded-full border-2 border-white/15 a-spin" />
        </Reveal>

        <Reveal className="ticket p-8 md:p-10">
          <p className="text-[10px] uppercase tracking-widest text-green font-semibold">— create account</p>
          <h2 className="text-3xl font-semibold mt-1 mb-1">Get started</h2>
          <p className="text-ink/60 text-sm mb-6">Fill in your details to get started.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">First name</label>
                <div className={inputCls}><User size={18} className="text-ink/50" /><input className={inputInnerCls} type="text" name="first_name" value={form.first_name} onChange={handleChange} placeholder="Alice" maxLength={50} /></div>
                {errors.first_name && <p className="text-xs text-red-600 mt-1 px-3">{errors.first_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Last name</label>
                <div className={inputCls}><User size={18} className="text-ink/50" /><input className={inputInnerCls} type="text" name="last_name" value={form.last_name} onChange={handleChange} placeholder="Sharma" maxLength={50} /></div>
                {errors.last_name && <p className="text-xs text-red-600 mt-1 px-3">{errors.last_name}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Username</label>
              <div className={inputCls}><User size={18} className="text-ink/50" /><input className={inputInnerCls} type="text" name="username" value={form.username} onChange={handleChange} placeholder="Choose a username" autoComplete="username" minLength={3} maxLength={30} /></div>
              {errors.username && <p className="text-xs text-red-600 mt-1 px-3">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Email</label>
              <div className={inputCls}><Mail size={18} className="text-ink/50" /><input className={inputInnerCls} type="email" name="email" value={form.email} onChange={handleChange} placeholder="alice@example.com" autoComplete="email" /></div>
              {errors.email && <p className="text-xs text-red-600 mt-1 px-3">{errors.email}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Phone</label>
                <div className={inputCls}><Phone size={18} className="text-ink/50" /><input className={inputInnerCls} type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="9876543210" maxLength={20} /></div>
                {errors.phone && <p className="text-xs text-red-600 mt-1 px-3">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Gender</label>
                <div className={inputCls}>
                  <select className={inputInnerCls} name="gender" value={form.gender} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {errors.gender && <p className="text-xs text-red-600 mt-1 px-3">{errors.gender}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Date of birth</label>
                <div className={inputCls}><Calendar size={18} className="text-ink/50" /><input className={inputInnerCls} type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} min={minDob} max={maxDob} /></div>
                {errors.date_of_birth
                  ? <p className="text-xs text-red-600 mt-1 px-3">{errors.date_of_birth}</p>
                  : agePreview !== null
                    ? <p className="text-xs text-ink/60 mt-1 px-3">Age: {agePreview} years</p>
                    : <p className="text-xs text-ink/40 mt-1 px-3">Between 1900 and {maxDob}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">I am a</label>
                <div className={inputCls}>
                  <select className={inputInnerCls} name="role" value={form.role} onChange={handleChange}>
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Password</label>
              <div className={inputCls}><Lock size={18} className="text-ink/50" /><input className={inputInnerCls} type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="Minimum 8 characters" autoComplete="new-password" /><button type="button" tabIndex={-1} onClick={() => setShowPassword((s) => !s)} className="text-ink/50">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
              {errors.password && <p className="text-xs text-red-600 mt-1 px-3">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Confirm password</label>
              <div className={inputCls}><Lock size={18} className="text-ink/50" /><input className={inputInnerCls} type="password" name="password2" value={form.password2} onChange={handleChange} placeholder="Re-enter password" autoComplete="new-password" /></div>
              {errors.password2 && <p className="text-xs text-red-600 mt-1 px-3">{errors.password2}</p>}
            </div>

            <button type="submit" disabled={loading} className="a-button w-full justify-center mt-2">
              <span className="a-button__mask">
                <span className="a-button__text" data-text={loading ? "Creating account..." : "Create account →"}>
                  {loading ? "Creating account..." : "Create account →"}
                </span>
              </span>
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-line" />
            <span className="text-xs text-ink/40 uppercase tracking-widest font-semibold">or</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          {/* Google Sign-Up Button */}
          <div className="flex justify-center w-full">
            {googleLoading ? (
              <div className="text-sm text-ink/60 py-3 text-center">Signing up with Google...</div>
            ) : (
              <div ref={googleBtnRef} className="flex justify-center" />
            )}
          </div>

          <p className="text-center text-sm text-ink/60 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-green font-semibold a-underline">Sign in</Link>
          </p>
        </Reveal>
      </div>
    </Layout>
  );
}
