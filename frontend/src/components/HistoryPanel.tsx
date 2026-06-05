import React, { useEffect, useState } from "react";
import { FileText, Trash2 } from "lucide-react";
import { conversationService } from "../services/api";
import type { ConversationListItem } from "../services/api";

interface HistoryPanelProps {
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  activeConversationId,
  onSelectConversation,
  onNewChat,
}) => {
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const data = await conversationService.list();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const handleRefresh = () => fetchConversations();
    window.addEventListener("refresh-conversations", handleRefresh);
    return () =>
      window.removeEventListener("refresh-conversations", handleRefresh);
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await conversationService.delete(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        onNewChat();
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  return (
    <div className="hidden lg:flex w-[280px] shrink-0 flex-col bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-5">
        <h2
          className="text-base font-bold text-gray-800"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          History
        </h2>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {loading && conversations.length === 0 && (
          <div className="space-y-2 p-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-14 w-full animate-pulse rounded-xl bg-gray-100"
              />
            ))}
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <p className="px-3 py-8 text-sm text-gray-400 text-center">
            No conversations yet
          </p>
        )}

        {conversations.map((chat) => {
          const isActive = activeConversationId === chat.id;
          const lastMsg = chat.messages?.[chat.messages.length - 1];
          const preview =
            lastMsg?.content?.substring(0, 40) || "No messages yet";
          return (
            <div
              key={chat.id}
              onClick={() => onSelectConversation(chat.id)}
              className={`history-item group ${isActive ? "active" : ""}`}
            >
              <FileText
                className={`h-4 w-4 shrink-0 mt-0.5 ${isActive ? "text-emerald-500" : "text-gray-400"}`}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium truncate ${isActive ? "text-emerald-700" : "text-gray-700"}`}
                >
                  {chat.title || "Untitled Chat"}
                </p>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {preview}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(e, chat.id)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                title="Delete conversation"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Delete All */}
      {conversations.length > 0 && (
        <div className="border-t border-gray-100 p-4">
          <button
            onClick={() => {
              /* placeholder for bulk delete */
            }}
            className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
          >
            <Trash2 className="h-4 w-4" />
            Delete history
          </button>
        </div>
      )}
    </div>
  );
};
