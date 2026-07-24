import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useState } from "react";

export const Route = createFileRoute("/contact")({
  component: Contact,
});

function Contact() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-20">
        <h1 className="text-5xl md:text-6xl font-semibold mb-8 text-center">Contact Us</h1>
        <p className="text-center text-lg text-ink opacity-70 mb-12 max-w-2xl mx-auto">
          Have a question or need to book a unit? Fill out the form below and our team will get back to you within 24 hours. For emergencies, please call 1-800-MEDITWIN immediately.
        </p>

        <div className="max-w-2xl mx-auto border border-line p-8 md:p-12 rounded-[2rem] shadow-xl ticket">
          {submitted ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-green text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-6">✓</div>
              <h3 className="text-2xl font-semibold mb-2">Message Sent!</h3>
              <p className="text-ink opacity-70">Thank you for reaching out. We will contact you shortly.</p>
              <button onClick={() => setSubmitted(false)} className="mt-8 text-green font-medium a-underline">Send another message</button>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="grid gap-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">First Name</label>
                  <input required className="w-full bg-white border border-line rounded-full px-5 py-3 outline-none focus:border-green transition-colors" placeholder="Jane" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Last Name</label>
                  <input required className="w-full bg-white border border-line rounded-full px-5 py-3 outline-none focus:border-green transition-colors" placeholder="Doe" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Email</label>
                <input required type="email" className="w-full bg-white border border-line rounded-full px-5 py-3 outline-none focus:border-green transition-colors" placeholder="jane@example.com" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Inquiry Type</label>
                <select required defaultValue="" className="w-full bg-white border border-line rounded-full px-5 py-3 outline-none focus:border-green transition-colors appearance-none">
                  <option value="" disabled>Select an option</option>
                  <option value="event">Event Care Booking</option>
                  <option value="corporate">Corporate Screening</option>
                  <option value="general">General Inquiry</option>
                  <option value="career">Careers</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Message</label>
                <textarea required rows="4" className="w-full bg-white border border-line rounded-2xl px-5 py-3 outline-none focus:border-green transition-colors resize-none" placeholder="How can we help you?"></textarea>
              </div>

              <button type="submit" className="a-button justify-center mt-4 w-full">
                <span className="a-button__mask">
                  <span className="a-button__text" data-text="Send Message →">
                    Send Message →
                  </span>
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
