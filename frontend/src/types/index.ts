export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  is_admin: boolean;
  is_active: boolean;
  plan: 'free' | 'pro' | 'enterprise';
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
}

export interface APIKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at?: string;
  is_active: boolean;
}

export interface APIKeyCreateResponse {
  id: string;
  name: string;
  key: string;
  key_prefix: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used?: number;
  created_at: string;
}

export interface PromptTemplate {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  content: string;
  category: 'Writing' | 'Code' | 'Analysis' | 'Marketing' | 'Custom';
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface UsageRecord {
  id: string;
  user_id: string;
  date: string;
  api_calls: number;
  tokens_used: number;
  endpoint: string;
}

export interface UsageStats {
  total_api_calls: number;
  total_tokens_used: number;
  active_conversations: number;
  current_plan: string;
  api_calls_today: number;
  tokens_this_month: number;
  daily_usage: DailyUsage[];
}

export interface DailyUsage {
  date: string;
  api_calls: number;
  tokens_used: number;
}

export interface DashboardData {
  stats: UsageStats;
  recent_conversations: Conversation[];
  usage_chart: DailyUsage[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AdminStats {
  total_users: number;
  active_subscriptions: number;
  revenue_this_month: number;
  api_calls_today: number;
  user_growth: DailyUsage[];
  recent_signups: User[];
}
