import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import heroImg from "@/assets/hero-hospital.jpg";

export const Route = createFileRoute("/about")({
  component: About,
});

const FEATURES = [
  { 
    k: "01", 
    t: "Real-Time Telemetry Engine", 
    d: "Our vitals monitoring system is built on a high-throughput Node.js and Socket.IO architecture. It establishes persistent, bidirectional WebSockets to stream heart rate, blood pressure, SpO2, and glucose data in milliseconds. A background anomaly detection algorithm continuously evaluates incoming data streams against strict medical thresholds, instantly persisting critical events to our NoSQL MongoDB clusters and pushing zero-latency alerts to the frontend.",
    tech: "Node.js, Express, Socket.IO, WebSockets, MongoDB"
  },
  { 
    k: "02", 
    t: "Explainable AI Risk Models", 
    d: "We don't just predict risk; we explain it. Our machine learning pipeline utilizes state-of-the-art XGBoost and Random Forest classifiers trained on extensive clinical datasets. These models are served via a high-performance Django REST Framework API. More importantly, we integrate SHAP (SHapley Additive exPlanations) values to provide transparent, human-readable insights into exactly which health factors (like BMI or Glucose) are driving your specific risk scores.",
    tech: "Python, Django, Scikit-Learn, XGBoost, SHAP"
  },
  { 
    k: "03", 
    t: "Temporal Digital Twin State Machine", 
    d: "Your digital twin is not a static profile; it's a living temporal state machine. By utilizing MongoDB's flexible schema design, we seamlessly aggregate structured vitals, unstructured lifestyle logs, and historical assessments into a single continuous timeline. This allows our 'What-If' simulator to instantly recalculate and project future health trajectories when you alter variables like weight or sleep patterns.",
    tech: "React, Vite, State Machines, Temporal Data Aggregation"
  },
  { 
    k: "04", 
    t: "NLP Medical Triage Chatbot", 
    d: "Our interactive medical assistant is backed by a robust Natural Language Processing engine. We've indexed over 200,000 verified medical Q&A pairs to provide highly accurate symptom checking. The system uses advanced vector similarity matching to understand user intent, triaging symptoms in real-time before dynamically suggesting whether a doctor consultation is necessary.",
    tech: "NLP, Vector Embeddings, Interactive React UI"
  },
  { 
    k: "05", 
    t: "Automated Clinical Reporting", 
    d: "Bridging the gap between patient data and clinical review, our automated reporting microservice aggregates 30-day telemetry trends, AI risk assessments, and lifestyle logs. It compiles these disparate data sources into universally accessible, standardized PDF reports, allowing doctors to ingest weeks of health context in a 30-second glance.",
    tech: "ReportLab, Data Visualization, PDF Generation"
  },
  { 
    k: "06", 
    t: "Secure Provider Ecosystem", 
    d: "Medi Twin features a strict Role-Based Access Control (RBAC) system separating Patient and Doctor portals. Authenticated via stateless JSON Web Tokens (JWT) using secure HS256 signatures, doctors can safely access assigned patient cohorts, review historical telemetry, and manage their consultation availability without compromising patient privacy or HIPAA guidelines.",
    tech: "JWT Auth, Role-Based Access Control (RBAC), SQLite"
  },
];

function About() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="ticket p-10 md:p-14 mb-16">
          <p className="uppercase tracking-[0.3em] text-xs mb-4 text-green font-semibold">About Us</p>
          <h1 className="text-5xl md:text-6xl font-semibold mb-8">About Medi Twin</h1>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-ink opacity-70 mb-6">
                Founded in 2026, Medi Twin was built on a simple premise: medical care should be proactive, continuous, and highly personalized. We've transformed preventative healthcare by creating a living digital model of your health.
              </p>
              <p className="text-lg text-ink opacity-70 mb-6">
                Our platform brings together continuous vital sign tracking, AI-powered predictive models, and a 24/7 medical knowledge base to simulate health outcomes before they happen.
              </p>
              <div className="mt-8">
                <h3 className="text-2xl font-semibold mb-4">Our Mission</h3>
                <p className="text-ink opacity-70">
                  To eliminate preventable diseases by giving every person access to an AI-powered digital twin that acts as a continuous, proactive health guardian.
                </p>
              </div>
            </div>
            <div>
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl">
                <img src={heroImg} alt="Our medical team" className="w-full h-auto object-cover" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-3xl md:text-5xl font-semibold">Core Technologies</h2>
          <p className="text-ink/70 mt-4 text-lg max-w-2xl">The six technological pillars that power your digital health twin from the backend infrastructure to the front-end visualization.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {FEATURES.map((f) => (
            <article key={f.k} className="ticket p-8 md:p-10 h-full border border-line bg-card flex flex-col">
              <span className="text-6xl text-green font-semibold mb-2">{f.k}</span>
              <h3 className="text-3xl mt-4 font-semibold">{f.t}</h3>
              <p className="mt-5 text-ink/80 leading-relaxed flex-grow">{f.d}</p>
              <div className="mt-8 pt-6 border-t border-line/50">
                <p className="text-xs font-bold uppercase tracking-widest text-green">Tech Stack</p>
                <p className="mt-2 text-sm text-ink/70 font-mono">{f.tech}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Layout>
  );
}
