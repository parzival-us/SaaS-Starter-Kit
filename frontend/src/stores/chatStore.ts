import { create } from 'zustand';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import type { Conversation, Message } from '@/types';
import { API_BASE_URL } from '@/config/constants';

interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isStreaming: boolean;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  streamingContent: string;

  fetchConversations: () => Promise<void>;
  createConversation: (title?: string) => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;
  setActiveConversation: (id: string) => Promise<void>;
  sendMessage: (content: string, templateId?: string) => Promise<void>;
  clearActiveConversation: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  isStreaming: false,
  isLoadingConversations: false,
  isLoadingMessages: false,
  streamingContent: '',

  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const data = await apiGet<Conversation[]>('/conversations');
      set({ conversations: data });
    } catch {
      // Silently handle error for demo
      set({ conversations: [] });
    } finally {
      set({ isLoadingConversations: false });
    }
  },

  createConversation: async (title?: string) => {
    const conversation = await apiPost<Conversation>('/conversations', {
      title: title || 'New Conversation',
    });
    set((state) => ({
      conversations: [conversation, ...state.conversations],
      activeConversation: conversation,
      messages: [],
    }));
    return conversation;
  },

  deleteConversation: async (id: string) => {
    await apiDelete(`/conversations/${id}`);
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversation: state.activeConversation?.id === id ? null : state.activeConversation,
      messages: state.activeConversation?.id === id ? [] : state.messages,
    }));
  },

  setActiveConversation: async (id: string) => {
    const conversation = get().conversations.find((c) => c.id === id);
    if (!conversation) return;

    set({ activeConversation: conversation, isLoadingMessages: true });
    try {
      const messages = await apiGet<Message[]>(`/conversations/${id}/messages`);
      set({ messages });
    } catch {
      set({ messages: [] });
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (content: string, templateId?: string) => {
    const { activeConversation } = get();
    let conversation = activeConversation;

    // Auto-create conversation if none active
    if (!conversation) {
      conversation = await get().createConversation(content.slice(0, 50));
    }

    // Add user message to UI immediately
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversation.id,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    set((state) => ({
      messages: [...state.messages, userMessage],
      isStreaming: true,
      streamingContent: '',
    }));

    try {
      const tokensRaw = localStorage.getItem('auth-tokens');
      const tokens = tokensRaw ? JSON.parse(tokensRaw) : null;

      const response = await fetch(`${API_BASE_URL}/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tokens?.access_token ? { Authorization: `Bearer ${tokens.access_token}` } : {}),
        },
        body: JSON.stringify({
          content,
          template_id: templateId,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let assistantContent = '';

      // Create placeholder assistant message
      const assistantMessage: Message = {
        id: `temp-assistant-${Date.now()}`,
        conversation_id: conversation.id,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
      };
      set((state) => ({
        messages: [...state.messages, assistantMessage],
      }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantContent += parsed.content;
                set((state) => ({
                  streamingContent: assistantContent,
                  messages: state.messages.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: assistantContent }
                      : m,
                  ),
                }));
              }
            } catch {
              // Non-JSON data, treat as plain text
              assistantContent += data;
              set((state) => ({
                streamingContent: assistantContent,
                messages: state.messages.map((m) =>
                  m.id === assistantMessage.id
                    ? { ...m, content: assistantContent }
                    : m,
                ),
              }));
            }
          }
        }
      }

      // Refresh conversations to get updated title/count
      get().fetchConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        conversation_id: conversation.id,
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        created_at: new Date().toISOString(),
      };
      set((state) => ({
        messages: [...state.messages.filter((m) => !m.id.startsWith('temp-assistant')), errorMessage],
      }));
    } finally {
      set({ isStreaming: false, streamingContent: '' });
    }
  },

  clearActiveConversation: () => {
    set({ activeConversation: null, messages: [] });
  },
}));
