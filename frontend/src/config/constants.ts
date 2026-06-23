export const APP_NAME = 'NexusAI';
export const APP_DESCRIPTION = 'Powerful AI tools for your business';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const ROUTE_PATHS = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PRICING: '/pricing',
  DASHBOARD: '/dashboard',
  CHAT: '/chat',
  TEMPLATES: '/templates',
  PROFILE: '/settings/profile',
  API_KEYS: '/settings/api-keys',
  BILLING: '/settings/billing',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',
} as const;

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  popular?: boolean;
  features: PlanFeature[];
  apiCalls: string;
  tokens: string;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Perfect for getting started with AI tools',
    features: [
      { text: '50 API calls per day', included: true },
      { text: '10,000 tokens per month', included: true },
      { text: '5 conversations', included: true },
      { text: 'Basic templates', included: true },
      { text: 'Community support', included: true },
      { text: 'API access', included: false },
      { text: 'Custom templates', included: false },
      { text: 'Priority support', included: false },
      { text: 'Team management', included: false },
      { text: 'SSO & SAML', included: false },
    ],
    apiCalls: '50/day',
    tokens: '10K/mo',
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 29,
    annualPrice: 23,
    description: 'For professionals who need more power',
    popular: true,
    features: [
      { text: '1,000 API calls per day', included: true },
      { text: '500,000 tokens per month', included: true },
      { text: 'Unlimited conversations', included: true },
      { text: 'All templates', included: true },
      { text: 'Email support', included: true },
      { text: 'Full API access', included: true },
      { text: 'Custom templates', included: true },
      { text: 'Priority support', included: true },
      { text: 'Team management', included: false },
      { text: 'SSO & SAML', included: false },
    ],
    apiCalls: '1,000/day',
    tokens: '500K/mo',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 99,
    annualPrice: 79,
    description: 'For teams and organizations at scale',
    features: [
      { text: 'Unlimited API calls', included: true },
      { text: 'Unlimited tokens', included: true },
      { text: 'Unlimited conversations', included: true },
      { text: 'All templates', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'Full API access', included: true },
      { text: 'Custom templates', included: true },
      { text: 'Priority support', included: true },
      { text: 'Team management', included: true },
      { text: 'SSO & SAML', included: true },
    ],
    apiCalls: 'Unlimited',
    tokens: 'Unlimited',
  },
];

export const TEMPLATE_CATEGORIES = [
  'All',
  'Writing',
  'Code',
  'Analysis',
  'Marketing',
  'Custom',
] as const;
