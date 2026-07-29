import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/services")({
  component: Services,
});

function Services() {
  const services = [
    {
      title: "AI Health Twin",
      desc: "Your complete digital health replica. Syncs vitals, runs ML risk predictions for heart disease, diabetes & hypertension, and tracks everything in real time.",
      img: "/AI Twin.png",
      tag: "Real-time ML predictions",
    },
    {
      title: "24/7 Medical AI Assistant",
      desc: "AI chatbot powered by medical LLM — ask health questions, check symptoms, get medication guidance anytime, no appointment needed.",
      img: "/ChatBot.png",
      tag: "Available 24/7",
    },
    {
      title: "Corporate Screening",
      desc: "Comprehensive health checks, vaccinations, and wellness programs delivered directly to your office. Keep your employees healthy and productive.",
      img: "/Screening.png",
      tag: "Tailored to your team",
    },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="uppercase tracking-[0.3em] text-xs mb-4 text-green font-semibold">Our Services</p>
          <h1 className="text-5xl md:text-6xl font-semibold mb-6">Intelligent health, always with you.</h1>
          <p className="text-lg text-ink opacity-70">
            From AI-powered risk prediction to 24/7 medical guidance, MediTwin puts proactive healthcare in your pocket.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((s, idx) => (
            <div key={idx} className="relative overflow-hidden">
              <div className="absolute -top-[18px] -left-[18px] w-[36px] h-[36px] rounded-full bg-transparent pointer-events-none"
                style={{ border: '2px solid rgba(16, 168, 106, 0.5)' }} />
              <div className="absolute -top-[18px] -right-[18px] w-[36px] h-[36px] rounded-full bg-transparent pointer-events-none"
                style={{ border: '2px solid rgba(16, 168, 106, 0.5)' }} />
              <div className="absolute -bottom-[18px] -left-[18px] w-[36px] h-[36px] rounded-full bg-transparent pointer-events-none"
                style={{ border: '2px solid rgba(16, 168, 106, 0.5)' }} />
              <div className="absolute -bottom-[18px] -right-[18px] w-[36px] h-[36px] rounded-full bg-transparent pointer-events-none"
                style={{ border: '2px solid rgba(16, 168, 106, 0.5)' }} />
              <div className="group ticket"
                style={{ border: '2px solid rgba(16, 168, 106, 0.3)' }}>
              <div className="relative h-48 overflow-hidden">
                <img src={s.img} alt={s.title} className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-green">
                  {s.tag}
                </div>
              </div>
              <div className="px-10 py-8">
                <h3 className="text-2xl font-semibold mb-3">{s.title}</h3>
                <p className="text-ink opacity-70 mb-6 leading-relaxed">{s.desc}</p>
                <Link to="/about" hash={`service-${idx}`} className="text-green font-semibold a-underline uppercase text-sm tracking-wider">Learn more</Link>
              </div>
            </div>
          </div>
          ))}
        </div>

        <div className="mt-20 ticket p-12 md:px-[90px] md:py-[50px] text-center max-w-4xl mx-auto relative overflow-hidden"
          style={{ border: '2px solid rgba(16, 168, 106, 0.3)' }}>
          <div className="absolute -top-[18px] -left-[18px] w-[36px] h-[36px] rounded-full bg-transparent pointer-events-none"
            style={{ border: '2px solid rgba(16, 168, 106, 0.5)' }} />
          <div className="absolute -top-[18px] -right-[18px] w-[36px] h-[36px] rounded-full bg-transparent pointer-events-none"
            style={{ border: '2px solid rgba(16, 168, 106, 0.5)' }} />
          <div className="absolute -bottom-[18px] -left-[18px] w-[36px] h-[36px] rounded-full bg-transparent pointer-events-none"
            style={{ border: '2px solid rgba(16, 168, 106, 0.5)' }} />
          <div className="absolute -bottom-[18px] -right-[18px] w-[36px] h-[36px] rounded-full bg-transparent pointer-events-none"
            style={{ border: '2px solid rgba(16, 168, 106, 0.5)' }} />
          <h2 className="text-4xl font-semibold mb-4">Want to see it in action?</h2>
          <p className="text-ink/70 mb-8 max-w-xl mx-auto">
            Try the interactive demo or register for free to start building your own health twin.
          </p>
          <Link to="/register" className="a-button a-button--ghost">
            <span className="a-button__mask">
              <span className="a-button__text" data-text="Get started free">
                Get started free
              </span>
            </span>
          </Link>
        </div>
      </div>
    </Layout>
  );
}