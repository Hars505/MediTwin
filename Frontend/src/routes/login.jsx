import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { Reveal } from "@/hooks/use-site-motion";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

const GOOGLE_CLIENT_ID = "1012276386491-idv7bf254kvlje3p2l6dsluut4g7p7qe.apps.googleusercontent.com";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
          text: "continue_with",
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
      toast.error(err.data?.detail || "Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err.data?.detail || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-10 items-stretch auth-page-wrapper">
        <Reveal className="ticket p-10 bg-green text-ink dark:text-white relative overflow-hidden hidden lg:block">
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white text-green grid place-items-center mb-6 shadow-[0_8px_24px_rgba(0,0,0,0.15)]">
              <span className="text-2xl">✚</span>
            </div>
            <h2 className="text-3xl font-semibold mb-3">Welcome back.</h2>
            <p className="text-ink/85 dark:text-white/85 leading-relaxed mb-8 max-w-sm">
              Sign in to access your digital twin, view risk predictions, and track your vitals in real-time.
            </p>
            <ul className="space-y-3 text-sm">
              {["Real-time vitals monitoring", "AI-powered risk predictions", "Medical AI chatbot", "SHAP explainability"].map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-white text-green grid place-items-center text-[10px] font-bold">✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="absolute -right-12 -bottom-12 w-56 h-56 rounded-full border-2 border-white/15 a-spin" />
          <div className="absolute -right-6 -bottom-6 w-40 h-40 rounded-full border-2 border-white/20 a-spin" style={{ animationDirection: "reverse" }} />
        </Reveal>

        <Reveal className="ticket p-10">
          <p className="text-[10px] uppercase tracking-widest text-green font-semibold">— sign in</p>
          <h2 className="text-3xl font-semibold mt-1 mb-1">Access your twin</h2>
          <p className="text-ink/60 text-sm mb-6">Enter your credentials to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Username</label>
              <div className="flex items-center gap-3 bg-white border border-line rounded-full px-5 py-3 focus-within:border-green transition-colors">
                <Mail size={18} className="text-ink/50" />
                <input className="flex-1 outline-none bg-transparent text-sm" type="text" name="username" value={form.username} onChange={handleChange} placeholder="Enter your username" autoComplete="username" autoFocus />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Password</label>
              <div className="flex items-center gap-3 bg-white border border-line rounded-full px-5 py-3 focus-within:border-green transition-colors">
                <Lock size={18} className="text-ink/50" />
                <input className="flex-1 outline-none bg-transparent text-sm" type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="Enter your password" autoComplete="current-password" />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword((s) => !s)} className="text-ink/50">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="a-button w-full justify-center">
              <span className="a-button__mask">
                <span className="a-button__text" data-text={loading ? "Signing in..." : "Sign in →"}>
                  {loading ? "Signing in..." : "Sign in →"}
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

          {/* Google Sign-In Button */}
          <div className="flex justify-center w-full">
            {googleLoading ? (
              <div className="text-sm text-ink/60 py-3 text-center">Signing in with Google...</div>
            ) : (
              <div ref={googleBtnRef} className="flex justify-center" />
            )}
          </div>

          <p className="text-center text-sm text-ink/60 mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-green font-semibold a-underline">Create one</Link>
          </p>
        </Reveal>
      </div>
    </Layout>
  );
}
