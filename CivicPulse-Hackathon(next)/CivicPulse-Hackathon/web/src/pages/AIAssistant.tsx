import { useState, useRef, useEffect } from "react";
import { Send, Bot, Sparkles, User as UserIcon, Loader2 } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { apiPost } from "../lib/api";

type Message = {
  id: string;
  sender: "user" | "bot";
  text: string;
};

export function AIAssistant() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", sender: "bot", text: "Hi! I'm the CivicPulse Assistant powered by AI. I can help you file reports, understand AI analysis, track status, and explain reputation & badges. What's on your mind?" }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "How do I report a pothole?",
    "What does the AI analyze?",
    "Which city has the most reports?",
    "How are departments assigned?",
    "Tell me about badges and reputation",
    "How does report tracking work?",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMessage: Message = { id: Math.random().toString(36).substr(2, 9), sender: "user", text: text.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const history = messages.filter(m => m.id !== "1").map(m => ({
        role: m.sender === "user" ? "user" : "model",
        text: m.text,
      }));

      const data = await apiPost<{ response: string }>("/api/ai/chat", { message: text.trim(), history });
      const botMessage: Message = { id: Math.random().toString(36).substr(2, 9), sender: "bot", text: data.response };
      setMessages(prev => [...prev, botMessage]);
    } catch {
      setMessages(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9), sender: "bot",
        text: "Sorry, I'm having trouble connecting. Please try again in a moment!",
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([{ id: "1", sender: "bot", text: "Chat cleared. How can I help you?" }]);
  };

  // Simple markdown-like rendering
  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => {
      const formatted = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      return <span key={i} dangerouslySetInnerHTML={{ __html: formatted + (i < text.split('\n').length - 1 ? '<br/>' : '') }} />;
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 flex flex-col h-[calc(100vh-8rem)]">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">AI Assistant</h1>
        <p className="text-muted-foreground">Ask about reporting, AI analysis, status, departments, badges, or city stats.</p>
      </div>
      <div className="flex-1 bg-card border border-white/5 rounded-2xl flex flex-col overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary"><Bot className="w-5 h-5" /></div>
            <div>
              <span className="font-semibold text-foreground">CivicPulse Assistant</span>
              <span className="text-xs text-emerald-400 ml-2">● Online</span>
            </div>
          </div>
          <button onClick={handleClearChat} className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5">Clear Chat</button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === "bot" ? "bg-primary/20 text-primary" : "bg-white/10 text-white"}`}>
                {msg.sender === "bot" ? <Bot className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.sender === "bot" ? "bg-white/5 border border-white/10 rounded-tl-sm text-foreground" : "bg-primary text-primary-foreground rounded-tr-sm"}`}>
                {renderText(msg.text)}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-4 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0"><Bot className="w-5 h-5" /></div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-sm text-sm flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => handleSend(s)} disabled={isTyping}
                className="text-xs px-3 py-1.5 bg-card border border-white/10 rounded-full hover:border-primary/50 hover:text-primary transition-colors text-muted-foreground disabled:opacity-50">{s}</button>
            ))}
          </div>
          <div className="relative flex items-center">
            <Sparkles className="absolute left-4 w-5 h-5 text-primary" />
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(input)} disabled={isTyping}
              placeholder="Ask anything about CivicPulse..."
              className="w-full bg-card border border-white/10 rounded-full pl-12 pr-12 py-3.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground shadow-inner disabled:opacity-50" />
            <button onClick={() => handleSend(input)} disabled={isTyping || !input.trim()}
              className="absolute right-2 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50">
              {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
