import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import firetruckImg from "@/assets/firetruck.jpg";
import ambulanceImg from "@/assets/ambulance.jpg";
import doctorImg from "@/assets/doctor.jpg";

export const Route = createFileRoute("/services")({
  component: Services,
});

function Services() {
  const services = [
    {
      title: "Fire Rescue Unit",
      desc: "Rapid on-site fire and trauma response with a fully equipped rescue truck and two paramedics. Ideal for high-risk industrial sites or large scale events.",
      img: firetruckImg,
      tag: "Up to 60 rescues / hour",
    },
    {
      title: "Mobile Ambulance",
      desc: "Advanced life support ambulance, arriving in under 8 minutes anywhere in the metro area. Always ready for dispatch 24/7.",
      img: ambulanceImg,
      tag: "24/7 dispatch",
    },
    {
      title: "Corporate Screening",
      desc: "Comprehensive health checks, vaccinations, and wellness programs delivered directly to your office. Keep your employees healthy and productive.",
      img: doctorImg,
      tag: "Tailored to your team",
    },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="uppercase tracking-[0.3em] text-xs mb-4 text-green font-semibold">Our Fleet & Services</p>
          <h1 className="text-5xl md:text-6xl font-semibold mb-6">Comprehensive care, delivered.</h1>
          <p className="text-lg text-ink opacity-70">
            From emergency response to proactive corporate wellness, our fleet is equipped to handle a wide range of medical needs on-site.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((s, idx) => (
            <div key={idx} className="group ticket border border-line rounded-[2rem] overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-500">
              <div className="relative h-64 overflow-hidden">
                <img src={s.img} alt={s.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-green">
                  {s.tag}
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-semibold mb-3">{s.title}</h3>
                <p className="text-ink opacity-70 mb-6">{s.desc}</p>
                <button className="text-green font-semibold a-underline uppercase text-sm tracking-wider">Learn more</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 ticket text-white p-12 rounded-[2rem] text-center max-w-4xl mx-auto" style={{ background: 'var(--green-soft)' }}>
          <h2 className="text-4xl font-semibold mb-4">Need a custom care plan?</h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            We understand that every event or site has unique requirements. Contact us to discuss a tailored solution.
          </p>
          <a href="/contact" className="a-button a-button--ghost border-white text-black hover:bg-white hover:text-green">
            <span className="a-button__mask">
              <span className="a-button__text" data-text="Get a quote">
                Get a quote
              </span>
            </span>
          </a>
        </div>
      </div>
    </Layout>
  );
}
