import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/Layout";
import { Reveal } from "@/hooks/use-site-motion";
import { chatbotAPI } from "@/lib/api";
import { toast } from "sonner";
import { MessageCircle, Send, Bot, User, AlertCircle, Stethoscope } from "lucide-react";

export const Route = createFileRoute("/chatbot")({
  beforeLoad: () => {
    if (!localStorage.getItem("access_token")) {
      throw redirect({ to: "/login" });
    }
  },
  component: Chatbot,
});

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [symptoms, setSymptoms] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => { init(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function init() {
    setLoading(true);
    try {
      const session = await chatbotAPI.startSession();
      setSessionId(session.session_id);
      try {
        const sym = await chatbotAPI.getSymptoms();
        setSymptoms(sym.symptoms || sym || []);
      } catch {}
      setMessages([{
        role: "assistant",
        content: "Hello! I'm MediBot, your medical AI assistant. I can help you understand symptoms, medications, and general health information. How can I help you today?",
        timestamp: new Date(),
      }]);
    } catch {
      toast.error("Failed to start chat session.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || sending || !sessionId) return;
    const text = input.trim();
    setInput("");
    setMessages((p) => [...p, { role: "user", content: text, timestamp: new Date() }]);
    setSending(true);
    try {
      const res = await chatbotAPI.sendMessage({ session_id: sessionId, message: text });
      const reply = res.response || res.message || res.reply || "No response.";
      setMessages((p) => [...p, { role: "assistant", content: reply, timestamp: new Date() }]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: "Sorry, I encountered an error. Please try again.", timestamp: new Date() }]);
    } finally {
      setSending(false);
    }
  }

  const fmtTime = (d) => d?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "";

  return (
    <AppShell active="/chatbot">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Reveal>
          <div className="mb-6">
            <p className="text-[11px] uppercase tracking-[0.3em] text-green font-semibold mb-2">— medical ai</p>
            <h1 className="text-4xl md:text-5xl font-semibold">MediBot</h1>
            <p className="mt-2 text-ink/70 text-sm">Ask questions about symptoms, medications, and general health information.</p>
          </div>
        </Reveal>

        {symptoms.length > 0 && (
          <div className="ticket p-4 mb-4 flex items-center gap-3 flex-wrap">
            <Stethoscope size={18} className="text-green" />
            <span className="text-sm font-semibold">Previous symptoms:</span>
            <span className="text-sm text-ink/60">{symptoms.map(s => typeof s === 'object' ? s.symptom : s).join(", ")}</span>
          </div>
        )}

        <Reveal>
          <div className="ticket p-6 flex flex-col" style={{ height: "calc(100vh - 380px)", minHeight: 420 }}>
            <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-3">
              {loading && (
                <div className="text-center text-ink/50 py-12">Starting chat session…</div>
              )}
              {messages.map((m, i) => {
                const isUser = m.role === "user";
                return (
                  <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[78%] p-4 ${isUser ? "rounded-2xl rounded-br-md bg-green text-white" : "rounded-2xl rounded-bl-md bg-green-soft text-ink"}`}
                    >
                      <div className={`flex items-center gap-1.5 text-[10px] mb-1 ${isUser ? "text-white/80" : "text-ink/50"}`}>
                        {isUser ? <User size={12} /> : <Bot size={12} />}
                        {isUser ? "You" : "MediBot"}
                        <span className="ml-auto">{fmtTime(m.timestamp)}</span>
                      </div>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
                    </div>
                  </div>
                );
              })}
              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-green-soft text-ink/60 px-4 py-3 text-sm flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 mt-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-green animate-bounce" style={{ animationDuration: "1s" }} />
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-green animate-bounce" style={{ animationDelay: "0.2s", animationDuration: "1s" }} />
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-green animate-bounce" style={{ animationDelay: "0.4s", animationDuration: "1s" }} />
                    </span>
                    Thinking…
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="flex gap-2 pt-3 mt-2 border-t border-line">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your health question..."
                disabled={sending || loading}
                className="flex-1 bg-white border border-line rounded-full px-5 py-3 outline-none text-sm focus:border-green transition-colors"
              />
              <button type="submit" disabled={!input.trim() || sending || loading} className="a-button">
                <span className="a-button__mask">
                  <span className="a-button__text" data-text="Send">Send</span>
                </span>
              </button>
            </form>
          </div>
        </Reveal>

        <div className="mt-4 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2 dark:bg-amber-900/15 dark:border-amber-800/40 dark:text-amber-300">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          This AI assistant provides informational guidance only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult your healthcare provider.
        </div>
      </div>
    </AppShell>
  );
}
