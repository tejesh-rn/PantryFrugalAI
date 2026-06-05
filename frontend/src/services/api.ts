import axios from "axios";

// TypeScript Interfaces for PantryFrugalAI Backend contracts

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Preference {
  id: string | null;
  userId: string;
  monthlyBudget: number | null;
  dietaryPreferences: string[];
  familySize: number;
  favoriteBrands: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  toolCalls: any[] | null;
  metadata: any | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export interface ConversationListItem extends Conversation {
  messages: Message[];
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
}

export interface ChatResponse {
  success: boolean;
  conversationId: string;
  response: string;
  toolCalls: any[];
  metadata: {
    model: string;
    usage: any;
    mcpToolCount: number;
  };
}

export interface HealthResponse {
  success: boolean;
  status: string;
  quickCommerce?: {
    configured: boolean;
    servers: Array<{
      id: string;
      name: string;
      url: string;
    }>;
  };
}

// Token Storage helpers
const TOKEN_KEY = "pantry_frugal_ai_token";

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = (): void => localStorage.removeItem(TOKEN_KEY);

// Create Axios Instance
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach JWT Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global Error Handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      // 401 Unauthorized: Clear session and trigger redirect/reload
      if (status === 401) {
        removeToken();
        // Dispatches global event to notify components to update authentication state
        window.dispatchEvent(new Event("auth-expired"));
      }
      
      // Extract backend error message if available
      const message = data?.message || `Request failed with status code ${status}`;
      return Promise.reject({ ...error, message, status });
    }
    
    if (error.code === "ECONNABORTED") {
      return Promise.reject({
        ...error,
        message: "The live grocery lookup took too long. Try fewer items or fewer platforms.",
        status: 504
      });
    }

    return Promise.reject({
      ...error,
      message: error.message || "Network error. Please verify your connection.",
      status: 500
    });
  }
);

// API Endpoints Services
export const authService = {
  register: async (data: any): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/register", data);
    return response.data;
  },
  login: async (data: any): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", data);
    return response.data;
  },
  me: async (): Promise<{ success: boolean; user: User }> => {
    const response = await api.get<{ success: boolean; user: User }>("/auth/me");
    return response.data;
  },
};

export const preferenceService = {
  get: async (): Promise<{ success: boolean; preference: Preference }> => {
    const response = await api.get<{ success: boolean; preference: Preference }>("/preferences");
    return response.data;
  },
  update: async (data: Partial<Preference>): Promise<{ success: boolean; preference: Preference }> => {
    const response = await api.put<{ success: boolean; preference: Preference }>("/preferences", data);
    return response.data;
  },
};

export const conversationService = {
  list: async (): Promise<{ success: boolean; conversations: ConversationListItem[] }> => {
    const response = await api.get<{ success: boolean; conversations: ConversationListItem[] }>("/conversations");
    return response.data;
  },
  get: async (id: string): Promise<{ success: boolean; conversation: Conversation }> => {
    const response = await api.get<{ success: boolean; conversation: Conversation }>(`/conversations/${id}`);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/conversations/${id}`);
  },
};

export const chatService = {
  send: async (message: string, conversationId?: string): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>("/chat", { message, conversationId });
    return response.data;
  },
};

export const healthService = {
  get: async (): Promise<HealthResponse> => {
    const response = await api.get<HealthResponse>("/health");
    return response.data;
  },
};
