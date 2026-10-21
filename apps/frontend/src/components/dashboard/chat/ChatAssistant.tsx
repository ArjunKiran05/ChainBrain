import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Sparkles,
  X,
  Minimize2,
  Maximize2,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";
import { useScanStore } from "../../../store/useScanStore";
import { sendChatMessage, type ChatMessage as ChatMessageType } from "../../../api/chatApi";
import ChatMessage from "../../chat/ChatMessage";

const QUICK_PROMPTS = [
  {
    icon: "🚨",
    label: "Safe to deploy?",
    prompt: "Is this project safe to deploy to production with the current dependencies?",
  },
  {
    icon: "🔍",
    label: "Explain critical CVEs",
    prompt: "Explain the highest severity vulnerabilities found in my project and their impact.",
  },
  {
    icon: "🛠️",
    label: "Show fix commands",
    prompt: "Show me the exact bash commands to fix and upgrade the vulnerable packages.",
  },
  {
    icon: "📦",
    label: "Priority packages",
    prompt: "Which packages should our security team prioritize updating first and why?",
  },
];

export const ChatAssistant = () => {
  const { scanResult } = useScanStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const projectName = scanResult?.projects?.[0]?.name || "Active Project";
  const vulnerableCount = scanResult?.scanResults?.summary?.vulnerablePackages ?? 0;
  const securityScore = scanResult?.scanResults?.summary?.securityScore ?? 100;

  useEffect(() => {
    if (messages.length === 0) {
      const initialGreeting: ChatMessageType = {
        id: "msg-init",
        role: "assistant",
        content: scanResult
          ? `👋 **Hello! I'm your ChainBrain AI Security Assistant.**\n\nI have loaded the scan results for **${projectName}** (Security Score: \`${securityScore}/100\`, **${vulnerableCount}** vulnerable packages detected).\n\nAsk me anything about your dependencies, CVE advisories, or click a quick prompt below to get started!`
          : `👋 **Hello! I'm your ChainBrain AI Security Assistant.**\n\nUpload a project in the scanner to get real-time vulnerability remediation and dependency risk analysis.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([initialGreeting]);
    }
  }, [scanResult, projectName, securityScore, vulnerableCount]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (userPrompt?: string) => {
    const textToSend = userPrompt || input.trim();
    if (!textToSend || loading) return;

    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!userPrompt) setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Filter to packages with vulnerabilities to keep payload light, performant, and under size limits
      const vulnerableResults = scanResult?.scanResults?.results
        ? scanResult.scanResults.results
            .filter((r) => r.vulnerabilities && r.vulnerabilities.length > 0)
            .slice(0, 50)
        : [];

      const reply = await sendChatMessage({
        message: textToSend,
        history,
        context: scanResult
          ? {
              projectName,
              summary: scanResult.scanResults.summary,
              results:
                vulnerableResults.length > 0
                  ? vulnerableResults
                  : scanResult.scanResults.results.slice(0, 20),
              recommendations: scanResult.recommendations?.slice(0, 20),
              aiReport: scanResult.aiReport,
            }
          : undefined,
      });

      const assistantMessage: ChatMessageType = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: ChatMessageType = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "⚠️ **Connection Error:** Unable to reach the AI chat service. Please ensure the backend server is running.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        role: "assistant",
        content: `Chat history reset. How can I assist you with **${projectName}**?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-2xl shadow-indigo-500/40 hover:shadow-cyan-500/50 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20 cursor-pointer"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400"></span>
          </span>

          <Bot className="w-5 h-5 text-white animate-pulse" />
          <span className="font-bold text-sm tracking-wide text-white">
            Ask AI Security
          </span>

          {vulnerableCount > 0 && (
            <span className="ml-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white shadow-sm">
              {vulnerableCount} CVEs
            </span>
          )}
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          className={`flex flex-col rounded-3xl bg-white/95 dark:bg-[#0c1220]/95 border border-slate-200/90 dark:border-slate-800/90 shadow-2xl shadow-slate-900/20 dark:shadow-black/80 backdrop-blur-2xl transition-all duration-300 ${
            isExpanded
              ? "w-[90vw] md:w-[720px] h-[85vh]"
              : "w-[92vw] sm:w-[450px] md:w-[490px] h-[600px]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/90 rounded-t-3xl">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                <Bot className="w-5 h-5" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white dark:border-slate-900 rounded-full"></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-[15px] tracking-tight">
                    ChainBrain Security AI
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                    Live Context
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  {vulnerableCount > 0 ? (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500 inline" />
                      <span className="font-medium">{vulnerableCount} vulnerabilities loaded</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 inline" />
                      <span className="font-medium">Clean project baseline</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Window controls */}
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={handleResetChat}
                className="p-2 rounded-xl hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
                title="Reset conversation"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-xl hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors hidden sm:block"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/40 dark:bg-transparent">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {loading && (
              <div className="flex items-start gap-3 my-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 rounded-tl-sm shadow-md">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce"></span>
                    <span
                      className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></span>
                    <span
                      className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></span>
                    <span className="ml-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                      Analyzing dependency graph & CVE advisories...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          {messages.length <= 2 && (
            <div className="px-4 py-2.5 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-100/60 dark:bg-[#090e1a]/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-cyan-400" />
                <span>Suggested Questions:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((qp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(qp.prompt)}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-slate-800/90 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700/80 shadow-sm transition-all"
                  >
                    <span>{qp.icon}</span>
                    <span>{qp.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Box Footer */}
          <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 rounded-b-3xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about CVEs, fixes, upgrade safety..."
                disabled={loading}
                className="flex-1 bg-slate-100 dark:bg-[#090e1a] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-cyan-500/20 transition-all font-normal"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-600 dark:to-cyan-500 text-white hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Press Enter to send
              </span>
              <span>ChainBrain AI Security Assistant</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;
