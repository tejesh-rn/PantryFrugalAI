import React, { useEffect, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { ChatArea } from "../components/ChatArea";
import {
  conversationService,
  chatService,
  healthService,
} from "../services/api";
import type { Message } from "../services/api";

export const ChatDashboard: React.FC = () => {
  const [activeConversationId, setActiveConversationId] = useState<
    string | undefined
  >(undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationTitle, setConversationTitle] = useState<string>("");
  const [quickCommerceConfigured, setQuickCommerceConfigured] = useState<
    boolean | null
  >(null);

  // Loaders
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Errors
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    healthService
      .get()
      .then((data) => {
        setQuickCommerceConfigured(Boolean(data.quickCommerce?.configured));
      })
      .catch((err) => {
        console.error("Failed to load QuickCommerce MCP status:", err);
        setQuickCommerceConfigured(false);
      });
  }, []);

  // Load conversation messages history
  const loadConversationHistory = async (id: string) => {
    setLoadingHistory(true);
    setChatError(null);
    try {
      const data = await conversationService.get(id);
      if (data.success && data.conversation) {
        setMessages(data.conversation.messages || []);
        setActiveConversationId(id);
        setConversationTitle(data.conversation.title || "Untitled Chat");
      }
    } catch (err: any) {
      console.error("Failed to load chat history:", err);
      setChatError(
        "Unable to retrieve previous messages. Please try again."
      );
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelectConversation = (id: string) => {
    loadConversationHistory(id);
  };

  const handleNewChat = () => {
    setActiveConversationId(undefined);
    setMessages([]);
    setChatError(null);
    setConversationTitle("");
  };

  const handleSendMessage = async (text: string) => {
    setSendingChat(true);
    setChatError(null);

    // Immediately append user message locally
    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      conversationId: activeConversationId || "temp",
      role: "user",
      content: text,
      toolCalls: null,
      metadata: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const result = await chatService.send(text, activeConversationId);

      if (result.success && result.conversationId) {
        const isNewChat = !activeConversationId;
        setActiveConversationId(result.conversationId);

        if (isNewChat) {
          window.dispatchEvent(new Event("refresh-conversations"));
        }

        // Sync messages from backend
        const data = await conversationService.get(result.conversationId);
        if (data.success && data.conversation) {
          setMessages(data.conversation.messages || []);
          setConversationTitle(data.conversation.title || "");
        }
      }
    } catch (err: any) {
      console.error("Failed to compile AI response:", err);
      setChatError(
        err.message || "Something went wrong while communicating with the AI."
      );
      setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp-")));
    } finally {
      setSendingChat(false);
    }
  };

  return (
    <div
      className="h-screen w-screen flex p-2 md:p-3 gap-2 md:gap-3 overflow-hidden"
      style={{ background: "#ece8f4" }}
    >
      {/* Left Sidebar (nav + history) */}
      <Sidebar
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Chat Area */}
      <main className="flex-1 min-w-0 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <ChatArea
          messages={messages}
          isLoading={sendingChat}
          isHistoryLoading={loadingHistory}
          error={chatError}
          quickCommerceConfigured={quickCommerceConfigured}
          onSendMessage={handleSendMessage}
          conversationTitle={conversationTitle}
        />
      </main>
    </div>
  );
};
