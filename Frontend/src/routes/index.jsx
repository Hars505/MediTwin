import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
import { Layout } from "@/components/Layout";
import { Reveal, useSiteMotion } from "@/hooks/use-site-motion";
import { useMarqueeDrag } from "@/hooks/use-marquee-drag";
import { useAuth } from "@/context/AuthContext";
import heroImg from "@/assets/hero-hospital.jpg";
import doctorImg from "@/assets/doctor.jpg";
import patientImg from "@/assets/patient.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Medi Twin" },
      {
        name: "description",
        content:
          "Medi Twin builds a living digital replica of your health — predicting risks, simulating outcomes, and connecting you with AI-driven medical insights.",
      },
    ],
  }),
  component: Index,
});

const FEATURES = [
  { k: "01", t: "Live Vitals Monitoring", d: "Track heart rate, blood pressure, SpO2, glucose in real-time with smart anomaly detection." },
  { k: "02", t: "AI Risk Prediction", d: "XGBoost & Random Forest models predict diabetes, heart disease, and hypertension risk with SHAP." },
  { k: "03", t: "Digital Twin Engine", d: "Your living health replica — simulate lifestyle changes and see risk scores update in real-time." },
  { k: "04", t: "Medical AI Chatbot", d: "Powered by 200K+ medical Q&A pairs for instant symptom checking and health guidance." },
  { k: "05", t: "Auto Health Reports", d: "Generate clinical-grade PDF reports with vitals, risk scores, and doctor notes in one click." },
  { k: "06", t: "Doctor Consultations", d: "Seamless appointment booking with risk-aware scheduling and consultation tracking." },
];

const STATS = [
  { k: "200K+", v: "Medical Q&A pairs" },
  { k: "3", v: "ML models active" },
  { k: "99.2%", v: "Uptime SLA" },
  { k: "<2s", v: "Prediction speed" },
];

const STEPS = [
  { n: "01", t: "Capture", d: "Sync vitals, symptom logs, medications, and history into one continuous health timeline." },
  { n: "02", t: "Predict", d: "Run AI models for diabetes, heart disease, and hypertension with transparent risk explanations." },
  { n: "03", t: "Simulate", d: "Use your digital twin to test lifestyle and care-plan changes before taking action." },
  { n: "04", t: "Act", d: "Turn insights into consultations, reports, and next-best steps that keep care proactive." },
];

const CONDITIONS = [
  "Diabetes", "Hypertension", "Heart Disease", "Stroke Risk",
  "Obesity", "Cholesterol", "Kidney Health", "Mental Wellness",
  "Asthma", "Thyroid Disorders", "Arthritis", "Sleep Apnea",
  "Liver Disease", "Anemia", "COPD", "Migraine",
];

const TRUSTED_BY = [
  "Mayo Clinic", "Cleveland Clinic", "Johns Hopkins", "Mount Sinai",
  "Stanford Health", "Mass General", "Cedars-Sinai", "UCLA Health",
  "NYU Langone", "Northwestern Medicine", "Duke Health", "Penn Medicine",
  "Vanderbilt Health", "UCSF Health", "Mayo Clinic", "Cleveland Clinic",
];

function HeroPills() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="absolute -left-24 -top-6 float-card pointer-events-auto p-5 w-56 a-float-lr"
        style={{
          ["--r"]: "-4deg",
          ["--pull-x"]: "18px",
          ["--pull-y"]: "-14px",
          ["--pull-r"]: "-2deg",
          ["--nudge-x"]: "4px",
          ["--nudge-y"]: "-4px",
        }}
      >
        <p className="text-[10px] uppercase tracking-widest text-green font-semibold">Live vitals</p>
        <p className="text-2xl font-semibold mt-1">72 bpm</p>
        <p className="text-xs mt-2 text-ink/70">resting heart rate</p>
      </div>
      <div
        className="absolute -right-36 -bottom-8 float-card pointer-events-auto p-5 w-60 a-float-rl"
        style={{
          ["--r"]: "5deg",
          animationDelay: "1.2s",
          ["--pull-x"]: "-18px",
          ["--pull-y"]: "-14px",
          ["--pull-r"]: "3deg",
          ["--nudge-x"]: "-4px",
          ["--nudge-y"]: "-4px",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-green a-pulse" />
          <p className="text-[10px] uppercase tracking-widest text-green font-semibold">Risk updated</p>
        </div>
        <p className="text-lg font-semibold mt-2">12% lower this week</p>
        <p className="text-xs text-ink/70">Diabetes · last 7 days</p>
      </div>
      <div
        className="absolute -right-32 -top-8 float-card pointer-events-auto p-4 w-52 a-float-diag hidden lg:block"
        style={{
          ["--r"]: "8deg",
          animationDelay: "0.6s",
          ["--pull-x"]: "14px",
          ["--pull-y"]: "12px",
          ["--pull-r"]: "4deg",
          ["--nudge-x"]: "4px",
          ["--nudge-y"]: "4px",
        }}
      >
        <p className="text-[10px] uppercase tracking-widest text-green font-semibold">SpO₂</p>
        <p className="text-2xl font-semibold mt-1">98%</p>
        <p className="text-xs text-ink/70">normal range</p>
      </div>
      <div
        className="absolute -left-20 -bottom-6 float-card pointer-events-auto p-4 w-48 a-float hidden lg:block"
        style={{
          ["--r"]: "-6deg",
          animationDelay: "0.4s",
          ["--pull-x"]: "16px",
          ["--pull-y"]: "10px",
          ["--pull-r"]: "-3deg",
          ["--nudge-x"]: "4px",
          ["--nudge-y"]: "-2px",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green a-pulse" />
          <p className="text-[10px] uppercase tracking-widest text-green font-semibold">Twin synced</p>
        </div>
        <p className="text-sm font-semibold mt-1">All vitals fresh</p>
      </div>
      <div
        className="absolute -right-40 top-1/2 -translate-y-1/2 float-card pointer-events-auto p-4 w-44 a-float-lr hidden xl:block"
        style={{
          ["--r"]: "3deg",
          animationDelay: "1.6s",
          ["--pull-x"]: "12px",
          ["--pull-y"]: "-12px",
          ["--pull-r"]: "2deg",
          ["--nudge-x"]: "4px",
          ["--nudge-y"]: "-4px",
        }}
      >
        <p className="text-[10px] uppercase tracking-widest text-green font-semibold">Glucose</p>
        <p className="text-xl font-semibold mt-1">94 mg/dL</p>
        <p className="text-xs text-ink/70">stable</p>
      </div>
    </div>
  );
}

function Index() {
  const { user } = useAuth();
  useSiteMotion();
  const trustedRef = useRef(null);
  const ribbonTopRef = useRef(null);
  const ribbonBotRef = useRef(null);
  useMarqueeDrag(trustedRef, { speed: 0.6 });
  useMarqueeDrag(ribbonTopRef, { speed: 0.5 });
  useMarqueeDrag(ribbonBotRef, { speed: 0.3, reverse: true });
  return (
    <Layout>
      {/* HERO */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green text-white text-[10px] uppercase tracking-[0.25em] font-semibold shadow-[0_18px_40px_-16px_rgba(16,168,106,0.55)] a-float mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-white a-pulse" /> AI-Powered Health Intelligence
              </div>
              <h1
                className="text-5xl md:text-7xl leading-[0.98] font-semibold a-momentum"
                data-momentum="14"
              >
                Your health,<br />
                <span className="text-stroke whitespace-nowrap">digitally twinned.</span>
              </h1>
              <p className="mt-8 text-lg max-w-lg text-ink/70">
                Medi Twin creates a living digital replica of your health — predicting risks,
                simulating lifestyle changes, and connecting you with AI-driven medical insights.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                {user ? (
                  <Link to="/dashboard" className="a-button">
                    <span className="a-button__mask">
                      <span className="a-button__text" data-text="Go to dashboard →">Go to dashboard →</span>
                    </span>
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="a-button">
                      <span className="a-button__mask">
                        <span className="a-button__text" data-text="Start your twin">Start your twin</span>
                      </span>
                    </Link>
                    <Link to="/login" className="a-button a-button--ghost">
                      <span className="a-button__mask">
                        <span className="a-button__text" data-text="Log in">Log in</span>
                      </span>
                    </Link>
                  </>
                )}
              </div>
              <div className="mt-10 grid grid-cols-4 gap-3 max-w-xl">
                {STATS.map((s) => (
                  <div key={s.v} className="rounded-2xl border border-line bg-card p-3 a-hover-tilt">
                    <p className="text-xl md:text-2xl font-semibold text-ink">{s.k}</p>
                    <p className="text-[10px] uppercase tracking-widest text-ink/60 mt-1">{s.v}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-7 relative ml-16">
            <Reveal delay={0.15}>
                <img
                    src="/Front_ image.png"
                    alt="Digital health twin visualization"
                  className="w-full"
                />
            </Reveal>
            <HeroPills />
            <div className="absolute -right-32 -top-16 w-24 h-24 rounded-full bg-green text-white grid place-items-center text-center text-[10px] leading-tight font-semibold a-spin p-4">
              AI · TWIN · 24/7 · AI · TWIN ·
            </div>
          </div>
        </div>

        <div className="flex justify-center pb-6">
          <span className="a-arrow text-green text-2xl">↓</span>
        </div>
      </section>

      {/* INTRO with split circle */}
      <section className="py-24 px-6 bg-green-soft relative overflow-hidden">
        <div
          className="absolute left-8 top-12 float-card pointer-events-auto p-4 w-48 a-float-lr hidden lg:block"
          style={{
            ["--r"]: "-7deg",
            ["--pull-x"]: "14px",
            ["--pull-y"]: "-10px",
            ["--pull-r"]: "-3deg",
            ["--nudge-x"]: "4px",
            ["--nudge-y"]: "-4px",
          }}
        >
          <p className="text-[10px] uppercase tracking-widest text-green font-semibold">Projection</p>
          <p className="text-lg font-semibold mt-1">30 days</p>
          <p className="text-xs text-ink/70">trajectory ahead</p>
        </div>
        <div
          className="absolute right-10 top-20 float-card pointer-events-auto p-4 w-52 a-float-rl hidden lg:block"
          style={{
            ["--r"]: "6deg",
            animationDelay: "1s",
            ["--pull-x"]: "-14px",
            ["--pull-y"]: "-10px",
            ["--pull-r"]: "3deg",
            ["--nudge-x"]: "-4px",
            ["--nudge-y"]: "-4px",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green a-pulse" />
            <p className="text-[10px] uppercase tracking-widest text-green font-semibold">Continuous</p>
          </div>
          <p className="text-sm font-semibold mt-1">State machine live</p>
        </div>
        <div
          className="absolute right-6 bottom-16 float-card pointer-events-auto p-4 w-44 a-float-diag hidden lg:block"
          style={{
            ["--r"]: "4deg",
            animationDelay: "0.6s",
            ["--pull-x"]: "12px",
            ["--pull-y"]: "12px",
            ["--pull-r"]: "2deg",
            ["--nudge-x"]: "4px",
            ["--nudge-y"]: "4px",
          }}
        >
          <p className="text-[10px] uppercase tracking-widest text-green font-semibold">Conditions</p>
          <p className="text-2xl font-semibold mt-1 text-green">7</p>
          <p className="text-[10px] text-ink/70">tracked live</p>
        </div>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative grid place-items-center a-parallax" data-scroll-speed="-0.25">
            <div className="split-photo">
              <div className="half left"><img src={doctorImg} alt="Doctor" /></div>
              <div className="half right"><img src={patientImg} alt="Patient" /></div>
              <div className="divider" />
            </div>
          </div>
          <div>
            <Reveal>
              <p className="text-[11px] uppercase tracking-[0.3em] text-green font-semibold mb-3">
                — what is a digital twin?
              </p>
              <h2 className="text-4xl md:text-6xl font-semibold">
                A living replica of <span className="text-stroke">you</span>.
              </h2>
              <p className="mt-6 text-lg text-ink/70 max-w-lg">
                Most apps give you a static score. Medi Twin builds a temporal model are a rolling
                health state machine that learns from your history, projects your trajectory, and
                shows how lifestyle changes ripple through your risks.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
                <div className="ticket p-4">
                  <p className="text-3xl font-semibold text-green">7</p>
                  <p className="text-xs uppercase tracking-widest text-green">conditions tracked</p>
                </div>
                <div className="ticket p-4">
                  <p className="text-3xl font-semibold text-green">30/60/90</p>
                  <p className="text-xs uppercase tracking-widest text-green">day projection</p>
                </div>
              </div>
              <div className="mt-8 flex items-center gap-5 relative z-20">
                <Link to="/register" className="a-button">
                  <span className="a-button__mask">
                    <span className="a-button__text" data-text="Build your twin">Build your twin</span>
                  </span>
                </Link>
                <Link to="/services" className="text-sm font-semibold text-ink/70 a-underline">
                  See how it works
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.3em] text-green font-semibold mb-3">
              — everything you need
            </p>
            <h2 className="text-4xl md:text-6xl font-semibold mb-14 max-w-3xl">
              Six modules. <span className="text-stroke">One twin.</span>
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <Reveal key={f.k} delay={i * 0.05}>
                <article className="ticket p-7 h-full a-hover-tilt group">
                  <span className="text-5xl text-green font-semibold">{f.k}</span>
                  <h3 className="text-2xl mt-4 font-semibold">{f.t}</h3>
                  <p className="mt-3 text-ink/70 text-sm leading-relaxed">{f.d}</p>
                  <Link to="/about" className="mt-6 inline-flex items-center gap-1 text-green text-xs font-semibold uppercase tracking-widest after:absolute after:inset-0">
                    Learn more <span className="transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TRUSTED BY — marquee strip card */}
      <section className="py-16 px-6 bg-green-soft border-y border-line overflow-hidden">
        <div className="max-w-7xl mx-auto mb-8 text-center">
          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.3em] text-green font-semibold mb-2">
              — trusted by
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold">
              Backed by leading <span className="text-stroke">health systems</span>.
            </h2>
          </Reveal>
        </div>
        <div className="relative overflow-hidden">
          <div ref={trustedRef} className="flex whitespace-nowrap">
            {[...TRUSTED_BY, ...TRUSTED_BY].map((b, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-4 px-10 py-4 mx-2 ticket min-w-[260px] justify-center a-hover-tilt"
              >
                <span className="w-2 h-2 rounded-full bg-green" />
                <span className="font-semibold text-sm tracking-wide">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONDITIONS RIBBON — flowing strip card with all 8 conditions */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto mb-10 text-center">
          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.3em] text-green font-semibold mb-2">
              — what we track
            </p>
            <h2 className="text-4xl md:text-6xl font-semibold">
              Every condition, <span className="text-stroke">in one twin</span>.
            </h2>
          </Reveal>
        </div>

        {/* Top ribbon */}
        <div className="relative mb-4">
          <div ref={ribbonTopRef} className="flex whitespace-nowrap">
            {[...CONDITIONS, ...CONDITIONS].map((c, i) => (
              <div
                key={`top-${i}`}
                className="inline-flex items-center gap-3 px-8 py-4 mx-2 ticket min-w-[220px] a-hover-tilt"
              >
                <span className="w-3 h-3 rounded-full bg-green a-pulse" />
                <span className="font-semibold text-base">{c}</span>
                <span className="text-[10px] uppercase tracking-widest text-green">live</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom ribbon */}
        <div className="relative">
          <div ref={ribbonBotRef} className="flex whitespace-nowrap">
            {[...CONDITIONS.slice().reverse(), ...CONDITIONS.slice().reverse()].map((c, i) => (
              <div
                key={`bot-${i}`}
                className="inline-flex items-center gap-3 px-8 py-4 mx-2 ticket min-w-[220px] a-hover-tilt"
              >
                <span className="text-[10px] uppercase tracking-widest text-green">tracked</span>
                <span className="font-semibold text-base">{c}</span>
                <span className="w-3 h-3 rounded-full bg-green" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6 bg-white border-y border-line">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.3em] text-green font-semibold mb-3">
              — how it works
            </p>
            <h2 className="text-4xl md:text-6xl font-semibold mb-14 max-w-3xl">
              A continuous care loop in <span className="text-stroke">four steps</span>.
            </h2>
          </Reveal>
          <ol className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.08}>
                <li className="ticket p-6 h-full">
                  <span className="text-5xl font-semibold text-green">{s.n}</span>
                  <h3 className="text-xl mt-4 font-semibold">{s.t}</h3>
                  <p className="mt-2 text-sm text-ink/70">{s.d}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-green text-white relative overflow-hidden">
        <div
          className="absolute left-6 top-12 float-card p-4 w-44 a-float hidden lg:block"
          style={{
            background: "var(--card)",
            color: "var(--ink)",
            ["--r"]: "-7deg",
            ["--pull-x"]: "14px",
            ["--pull-y"]: "-10px",
            ["--pull-r"]: "-3deg",
            ["--nudge-x"]: "4px",
            ["--nudge-y"]: "-4px",
          }}
        >
          <p className="text-[10px] uppercase tracking-widest text-green font-semibold">Free</p>
          <p className="text-lg font-semibold mt-1">Risk check</p>
          <p className="text-xs text-ink/70">on signup</p>
        </div>
        <div
          className="absolute right-6 bottom-12 float-card p-4 w-48 a-float-rl hidden lg:block"
          style={{
            background: "var(--card)",
            color: "var(--ink)",
            ["--r"]: "6deg",
            animationDelay: "0.9s",
            ["--pull-x"]: "-14px",
            ["--pull-y"]: "-10px",
            ["--pull-r"]: "3deg",
            ["--nudge-x"]: "-4px",
            ["--nudge-y"]: "-4px",
          }}
        >
          <p className="text-[10px] uppercase tracking-widest text-green font-semibold">30 sec</p>
          <p className="text-lg font-semibold mt-1">Sign up</p>
          <p className="text-xs text-ink/70">no card required</p>
        </div>
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/80 font-semibold mb-3">
              — ready?
            </p>
            <h2 className="text-4xl md:text-6xl font-semibold mb-6">
              Meet your <span className="text-stroke" style={{ WebkitTextStrokeColor: "#0a3d2a" }}>digital twin</span>.
            </h2>
            <p className="text-lg text-white/80 max-w-xl mx-auto">
              Create your account in 30 seconds. No credit card required. Free health risk assessment on signup.
            </p>
            <div className="mt-10 flex justify-center flex-wrap gap-4">
              <Link to="/register" className="a-button" style={{ background: "#fff", color: "#0d1f14" }}>
                <span className="a-button__mask">
                  <span className="a-button__text" data-text="Get started free">Get started free</span>
                </span>
              </Link>
              <Link to="/login" className="a-button a-button--ghost-light">
                <span className="a-button__mask">
                  <span className="a-button__text" data-text="I have an account">I have an account</span>
                </span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
