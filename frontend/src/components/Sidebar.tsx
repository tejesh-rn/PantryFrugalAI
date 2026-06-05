import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { conversationService } from "../services/api";
import type { ConversationListItem } from "../services/api";

interface SidebarProps {
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeConversationId,
  onSelectConversation,
  onNewChat,
  isOpen,
  setIsOpen,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  const closeMobile = () => {
    if (window.innerWidth < 768) setIsOpen(false);
  };

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

  const handleSelect = (id: string) => {
    onSelectConversation(id);
    closeMobile();
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-40 rounded-xl bg-white p-2.5 text-gray-500 hover:text-gray-800 shadow-md md:hidden border border-gray-200"
        id="sidebar-toggle"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-35 flex w-[270px] flex-col bg-white transition-transform duration-300
          md:static md:translate-x-0 md:z-0 md:rounded-2xl md:shadow-sm md:shrink-0 md:overflow-hidden
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-6 py-5 cursor-pointer shrink-0"
          onClick={() => {
            navigate("/");
            closeMobile();
          }}
        >
          <img
            src="/logo.png"
            alt="PantryFrugalAI"
            className="h-9 w-9 rounded-xl object-cover shadow-sm"
          />
          <span
            className="text-[17px] font-bold text-gray-800 tracking-tight"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            PantryFrugalAI
          </span>
        </div>

        {/* New Chat */}
        <div className="px-4 mb-1 shrink-0">
          <button
            onClick={() => {
              onNewChat();
              closeMobile();
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-emerald-600 font-semibold text-sm hover:text-emerald-700 transition-colors rounded-xl hover:bg-emerald-50 w-full"
            id="new-chat-btn"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New chat
          </button>
        </div>

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto px-3 pt-2 space-y-0.5">
          <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            History
          </h2>

          {loading && conversations.length === 0 && (
            <div className="space-y-2 p-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-full animate-pulse rounded-xl bg-gray-100"
                />
              ))}
            </div>
          )}

          {!loading && conversations.length === 0 && (
            <p className="px-3 py-4 text-xs text-gray-400 text-center italic">
              No conversations yet
            </p>
          )}

          {conversations.map((chat) => {
            const isActive = activeConversationId === chat.id;
            return (
              <div
                key={chat.id}
                onClick={() => handleSelect(chat.id)}
                className={`group flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 transition-all ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-800 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare
                    className={`h-4 w-4 shrink-0 ${isActive ? "text-emerald-500" : "text-gray-400"}`}
                  />
                  <span className="truncate text-sm">
                    {chat.title || "Untitled Chat"}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDelete(e, chat.id)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  title="Delete conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom: User + Logout */}
        <div className="border-t border-gray-100 p-3 space-y-1 shrink-0">
          {user && (
            <div
              onClick={() => {
                navigate("/preferences");
                closeMobile();
              }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer hover:bg-gray-50 transition-all"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-800">
                  {user.name}
                </p>
                <p className="truncate text-xs text-gray-400">{user.email}</p>
              </div>
              <Settings className="h-4 w-4 text-gray-400 shrink-0" />
            </div>
          )}

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all"
            id="sign-out-btn"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl flex flex-col items-center text-center gap-4 border border-gray-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <LogOut className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3
                className="text-lg font-bold text-gray-800"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                Sign Out
              </h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to sign out of PantryFrugalAI?
              </p>
            </div>

            <div className="flex w-full gap-3 mt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-all active:scale-95"
              >
                No, Stay
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                  navigate("/login");
                }}
                className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 py-3 text-sm font-semibold text-white transition-all active:scale-95 shadow-sm"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
