import React, { useRef, useEffect, useState, useMemo } from "react";
import { Send, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { Message } from "../services/api";

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  isHistoryLoading?: boolean;
  error: string | null;
  quickCommerceConfigured: boolean | null;
  onSendMessage: (message: string) => void;
  conversationTitle?: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isLoading,
  isHistoryLoading = false,
  error,
  quickCommerceConfigured,
  onSendMessage,
  conversationTitle,
}) => {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const visibleMessages = messages.filter((message) => {
    if (message.role === "user") return true;
    return Boolean(message.content.trim() || message.toolCalls?.length);
  });

  // Simple markdown parser
  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      const isBullet = trimmed.startsWith("* ") || trimmed.startsWith("- ");
      const isOrdered = /^\d+\.\s/.test(trimmed);

      let cleanLine = trimmed;
      if (isBullet) cleanLine = cleanLine.substring(2);
      else if (isOrdered) cleanLine = cleanLine.replace(/^\d+\.\s/, "");

      const parseInline = (textSegment: string) => {
        const pattern = /(\*\*.*?\*\*|`.*?`)/g;
        const matches = textSegment.split(pattern);
        return matches.map((match, mIdx) => {
          if (match.startsWith("**") && match.endsWith("**")) {
            return (
              <strong key={mIdx} className="text-emerald-600 font-semibold">
                {match.slice(2, -2)}
              </strong>
            );
          }
          if (match.startsWith("`") && match.endsWith("`")) {
            return (
              <code
                key={mIdx}
                className="rounded-md bg-gray-100 border border-gray-200 px-1.5 py-0.5 text-xs text-emerald-700 font-mono"
              >
                {match.slice(1, -1)}
              </code>
            );
          }
          return match;
        });
      };

      if (isBullet)
        return (
          <li
            key={idx}
            className="ml-5 list-disc text-sm text-gray-700 mb-1.5 leading-relaxed"
          >
            {parseInline(cleanLine)}
          </li>
        );

      if (isOrdered)
        return (
          <li
            key={idx}
            className="ml-5 list-decimal text-sm text-gray-700 mb-1.5 leading-relaxed"
            style={{ listStyleType: "decimal" }}
          >
            {parseInline(cleanLine)}
          </li>
        );

      if (trimmed === "") return <div key={idx} className="h-3" />;

      if (trimmed.startsWith("### "))
        return (
          <h4
            key={idx}
            className="text-sm font-bold text-emerald-700 mt-3 mb-1.5"
          >
            {parseInline(trimmed.substring(4))}
          </h4>
        );
      if (trimmed.startsWith("## "))
        return (
          <h3
            key={idx}
            className="text-base font-bold text-emerald-600 mt-4 mb-2"
          >
            {parseInline(trimmed.substring(3))}
          </h3>
        );
      if (trimmed.startsWith("# "))
        return (
          <h2
            key={idx}
            className="text-lg font-bold text-gray-800 mt-5 mb-2.5"
          >
            {parseInline(trimmed.substring(2))}
          </h2>
        );

      return (
        <p key={idx} className="text-sm text-gray-700 mb-2 leading-relaxed">
          {parseInline(line)}
        </p>
      );
    });
  };

  // Friendly tool call label
  const getToolCallLabel = (toolName: string, args: any) => {
    let display = toolName;
    if (toolName.startsWith("mcp_")) {
      const parts = toolName.split("_");
      if (parts.length >= 3) {
        display = parts.slice(2, parts.length - 1).join(" ");
      }
    }

    const query =
      args?.query ||
      args?.searchTerm ||
      args?.productName ||
      args?.category ||
      "";
    const store = args?.store || args?.shop || "";
    if (display.includes("search") || display.includes("query"))
      return `Queried inventory for "${query}"${store ? ` at ${store}` : ""}`;
    if (display.includes("compare") || display.includes("price"))
      return `Compared grocery prices for "${query}"`;
    if (display.includes("recommend") || display.includes("suggest"))
      return `Requested optimized meal options`;
    return `Executed agent tool: ${display}`;
  };

  const suggestions = [
    "Compare biryani ingredient prices near me",
    "Best-rated protein under \u20B9200",
    "Build a monthly grocery list for 4 under \u20B91,500",
    "Compare milk, egg & bread prices near me",
  ];

  const quotes = [
    { text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" },
    { text: "A penny saved is a penny earned.", author: "Benjamin Franklin" },
    { text: "Beware of little expenses; a small leak will sink a great ship.", author: "Benjamin Franklin" },
    { text: "Money grows on the tree of persistence.", author: "Japanese Proverb" },
    { text: "It's not your salary that makes you rich, it's your spending habits.", author: "Charles A. Jaffe" },
  ];

  const randomQuote = useMemo(() => quotes[Math.floor(Math.random() * quotes.length)], []);

  const categoryPills = [
    { label: "Meal Plans", prompt: "Help me plan a week of budget-friendly meals" },
    { label: "Compare Prices", prompt: "Compare prices for " },
    { label: "Find Deals", prompt: "Find the best deals on " },
    { label: "More", prompt: "What can you help me with?" },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Top Title Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2
          className="text-lg font-bold text-gray-800 truncate"
          style={{ fontFamily: "'Lato', sans-serif" }}
        >
          {conversationTitle || "New Conversation"}
        </h2>
        <div className="text-xs text-gray-400 shrink-0 ml-4">
          {quickCommerceConfigured === false
            ? "MCP not configured"
            : "Powered by live QuickCommerce MCP"}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 chat-gradient-bg">
        {isHistoryLoading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <RefreshCw className="h-6 w-6 text-emerald-500 animate-spin" />
            <p className="text-sm text-gray-400">Loading conversation...</p>
          </div>
        ) : visibleMessages.length === 0 ? (
          /* Welcome empty state */
          <div className="flex h-full flex-col items-center justify-center text-center p-6 max-w-lg mx-auto">
            <h3
              className="text-xl font-bold text-gray-800 mb-2"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
            </h3>
            <p className="text-sm text-pink-500 italic leading-relaxed mb-1" style={{ fontFamily: "'Lato', sans-serif" }}>
              {randomQuote.text}
            </p>
            <p className="text-xs text-pink-400 mb-8" style={{ fontFamily: "'Lato', sans-serif" }}>
              — {randomQuote.author}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setInput(s)}
                  className="rounded-2xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all text-left group"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Render messages */
          visibleMessages.map((message) => {
            const isUser = message.role === "user";
            const assistantContent =
              message.content.trim() ||
              "Live lookup completed, but no text response was returned. Try narrowing the request.";
            const timestamp = new Date(message.createdAt).toLocaleTimeString(
              [],
              { hour: "2-digit", minute: "2-digit" }
            );

            if (isUser) {
              return (
                <div
                  key={message.id}
                  className="flex justify-end animate-fade-in"
                >
                  <div className="user-bubble max-w-[70%] px-5 py-3.5">
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={message.id}
                className="max-w-[80%] animate-fade-in"
              >
                {/* Tool Calls */}
                {message.toolCalls && message.toolCalls.length > 0 && (
                  <div className="mb-3 space-y-1.5 pb-3">
                    <p className="text-xs uppercase tracking-wider text-gray-500/70 font-semibold flex items-center gap-1.5">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-blue-400" />
                      MCP Integrations
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {message.toolCalls.map((t: any, tIdx: number) => (
                        <span
                          key={tIdx}
                          className="inline-flex items-center gap-1.5 rounded-full bg-white/40 backdrop-blur-sm border border-white/30 px-3 py-1 text-xs text-gray-600 font-medium"
                        >
                          <span className="h-1 w-1 rounded-full bg-emerald-400" />
                          {getToolCallLabel(t.toolName, t.arguments)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="prose-chat">
                  {renderMarkdown(assistantContent)}
                </div>
              </div>
            );
          })
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/30">
              <RefreshCw className="h-4 w-4 text-emerald-500 animate-spin" />
              <span className="text-sm text-gray-600">
                Searching best deals...
              </span>
              <div className="flex items-center gap-1 ml-1">
                <div
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-600">
                Communication Error
              </p>
              <p className="text-xs text-red-400 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="border-t border-gray-100 px-6 py-4">
        {/* Category Pills */}
        {visibleMessages.length === 0 && !isHistoryLoading && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            {categoryPills.map((pill, i) => (
              <button
                key={i}
                onClick={() => setInput(pill.prompt)}
                className="category-pill"
              >
                {pill.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="flex gap-2.5 items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder={
              isLoading
                ? "Waiting for response..."
                : "Ask about products, stores, price comparison..."
            }
            className="flex-1 glass-input px-5 py-3.5 text-sm"
            id="chat-input"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white transition-all hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 hover:shadow-md active:scale-95"
            id="chat-send-btn"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
