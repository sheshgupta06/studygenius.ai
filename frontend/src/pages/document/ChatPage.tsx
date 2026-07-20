import { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Bot, User as UserIcon, Quote, Copy, RefreshCcw, ArrowDown, Check } from "lucide-react";

import type { Document, Message, SourceChunk } from "@/types";

export default function ChatPage() {
  const { document } = useOutletContext<{ document: Document }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // Show button if we are scrolled up more than 100px from the bottom
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      sources: null,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Placeholder for assistant message to update while streaming
    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", sources: null, created_at: new Date().toISOString(), isStreaming: true }
    ]);

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(import.meta.env.PROD ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/chat/stream` : `/api/v1/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          document_id: document.id,
          message: userMsg.content,
        })
      });

      if (!res.ok) {
        throw new Error(`Chat request failed: ${res.statusText}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) throw new Error("No reader available");

      let currentContent = "";
      let currentSources: SourceChunk[] | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") {
              setMessages((prev) => 
                prev.map(m => m.id === assistantId ? { ...m, isStreaming: false } : m)
              );
              break;
            }

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === "sources") {
                currentSources = parsed.data;
                setMessages((prev) => 
                  prev.map(m => m.id === assistantId ? { ...m, sources: currentSources } : m)
                );
              } else if (parsed.type === "token") {
                currentContent += parsed.data;
                setMessages((prev) => 
                  prev.map(m => m.id === assistantId ? { ...m, content: currentContent } : m)
                );
              } else if (parsed.type === "done") {
                setMessages((prev) => 
                  prev.map(m => m.id === assistantId ? { ...m, isStreaming: false } : m)
                );
                break;
              } else if (parsed.type === "error") {
                setMessages((prev) => 
                  prev.map(m => m.id === assistantId ? { ...m, content: parsed.data, isStreaming: false, isError: true } : m)
                );
                break;
              }
            } catch (e) {
              console.error("Failed to parse SSE JSON", e);
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => 
        prev.map(m => m.id === assistantId ? { ...m, content: "Sorry, I encountered an error. Please try again.", isStreaming: false, isError: true } : m)
      );
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-base)] relative">
      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto opacity-70 animate-fade-in-up">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent-muted)] flex items-center justify-center mb-6 shadow-[var(--shadow-glow)]">
              <Bot className="w-8 h-8 text-[var(--brand-from)]" />
            </div>
            <h3 className="text-xl font-bold mb-2">Hello! I'm your AI Assistant.</h3>
            <p className="text-[var(--text-secondary)]">
              I've read "{document.title}". Ask me anything about it, and I'll find the answers for you along with exact citations.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 max-w-4xl mx-auto group ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {/* Avatar */}
              <div className="flex-shrink-0">
                {msg.role === "user" ? (
                  <div className="w-8 h-8 rounded-full bg-[var(--brand-from)] text-white flex items-center justify-center">
                    <UserIcon className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--accent)]">
                    <Bot className="w-5 h-5" />
                  </div>
                )}
              </div>

              {/* Message Bubble */}
              <div className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} max-w-[85%]`}>
                <div className={`
                  ${msg.role === "user" ? "msg-user text-white" : "msg-assistant"}
                  ${msg.isError ? "border-red-500/50 bg-red-500/5 text-red-500" : ""}
                `}>
                  {msg.role === "assistant" && msg.content === "" && msg.isStreaming ? (
                    <div className="flex gap-1 py-1">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  ) : (
                    <div className="prose-content text-sm sm:text-base">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
                
                {/* Sources block for AI replies */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.sources.map((src, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-muted)] cursor-help hover:text-[var(--text-primary)] hover:border-[var(--border-accent)] transition-colors" title={src.content}>
                        <Quote className="w-3 h-3" />
                        <span>Page {src.page_number}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Action Buttons for Assistant Message */}
                {msg.role === "assistant" && !msg.isStreaming && (
                  <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="p-1.5 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button 
                      className="p-1.5 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      title="Regenerate response"
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollButton && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
          <button 
            onClick={scrollToBottom}
            className="w-8 h-8 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] shadow-md flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors animate-fade-in"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="max-w-4xl mx-auto relative">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about this document..."
              className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] pl-5 pr-14 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-shadow"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 p-2.5 bg-[var(--brand-from)] text-white rounded-xl hover:bg-[var(--brand-to)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-[var(--text-muted)]">StudyGenius AI can make mistakes. Consider verifying important information.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
