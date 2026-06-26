import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Plus, Send, Search, Trash2, MessageSquare, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

interface Conversation { id: string; title: string; model: string; created_at: string; updated_at: string; message_count: number; }
interface Message { id: string; role: string; content: string; tokens: number; created_at: string; }

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadConversations = async () => {
    try { const r = await api.get('/api/v1/chat/conversations'); setConversations(r.data.conversations || []); } catch { /* silently ignore */ }
  };

  const loadMessages = async (id: string) => {
    setActiveId(id);
    try { const r = await api.get(`/api/v1/chat/conversations/${id}`); setMessages(r.data.messages || []); } catch { /* silently ignore */ }
  };

  const createConversation = async () => {
    try {
      const r = await api.post('/api/v1/chat/conversations', { title: 'New Conversation' });
      setConversations(prev => [r.data, ...prev]);
      setActiveId(r.data.id);
      setMessages([]);
    } catch { toast.error('Failed to create conversation'); }
  };

  const deleteConversation = async (id: string) => {
    try {
      await api.delete(`/api/v1/chat/conversations/${id}`);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeId === id) { setActiveId(null); setMessages([]); }
    } catch { toast.error('Failed to delete conversation'); }
  };

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeId || streaming) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: input.trim(), tokens: 0, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setStreaming(true);

    const assistantId = crypto.randomUUID();

    try {
      const response = await fetch(`/api/v1/chat/conversations/${activeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify({ content: userMsg.content }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', tokens: 0, created_at: new Date().toISOString() }]);

      if (reader) {
        let buffer = '';
        let done = false;
        while (!done) {
          const result = await reader.read();
          if (result.done) break;
          buffer += decoder.decode(result.value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // keep incomplete line in buffer

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') { done = true; break; }
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) { toast.error(parsed.error); done = true; break; }
              const chunk = parsed.content || parsed.delta || '';
              if (chunk) {
                assistantContent += chunk;
                setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m));
              }
            } catch {
              // skip unparseable chunks
            }
          }
        }
      }
      loadConversations();
    } catch (err) { toast.error('Failed to get response'); console.error('Chat error:', err); }
    finally { setStreaming(false); }
  };

  const filtered = conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-[calc(100vh-7rem)] -m-4 lg:-m-6 rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700">
      {/* Sidebar */}
      <div className="w-72 border-r border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 flex flex-col hidden md:flex">
          <div className="p-3 space-y-2">
            <Button onClick={createConversation} className="w-full" leftIcon={<Plus className="w-4 h-4" />}>New Chat</Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                placeholder="Search conversations..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
            {filtered.map(c => (
              <div
                key={c.id}
                onClick={() => loadMessages(c.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  activeId === c.id ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300' : 'hover:bg-surface-50 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="text-sm truncate">{c.title}</span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteConversation(c.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-surface-400 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-surface-50 dark:bg-surface-950">
        {!activeId ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={Sparkles}
              title="Start a new conversation"
              description="Create a new chat or select an existing one to begin."
              action={{ label: 'New Chat', onClick: createConversation }}
            />
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white'
                      : 'bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-200 border border-surface-200 dark:border-surface-700'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium opacity-70">{m.role === 'user' ? 'You' : 'AI'}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    {streaming && m === messages[messages.length - 1] && m.role === 'assistant' && (
                      <span className="inline-block w-2 h-4 bg-brand-500 animate-pulse ml-0.5" />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
              <form onSubmit={sendMessage} className="flex gap-3">
                <textarea
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
                  placeholder="Type a message..."
                  className="flex-1 resize-none rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-4 py-3 text-sm text-surface-800 dark:text-surface-200 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
                <Button type="submit" disabled={streaming || !input.trim()} isLoading={streaming}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
