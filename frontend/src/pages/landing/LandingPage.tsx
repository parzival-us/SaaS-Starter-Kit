import { Link } from 'react-router-dom';
import { Sparkles, MessageSquare, FileText, Key, BarChart3, CreditCard, Shield, Check, ArrowRight, Github, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const features = [
  { icon: MessageSquare, title: 'AI Chat Interface', desc: 'Real-time streaming conversations with any OpenAI-compatible model. Markdown rendering, code highlighting, and conversation history.' },
  { icon: FileText, title: 'Prompt Templates', desc: 'Create, share, and organize reusable prompt templates. Boost team productivity with a curated library.' },
  { icon: Key, title: 'API Key Management', desc: 'Generate, rotate, and revoke API keys. Secure hashed storage with prefix-based identification.' },
  { icon: BarChart3, title: 'Usage Analytics', desc: 'Track API calls, tokens consumed, and costs. Daily breakdowns and quota enforcement per plan.' },
  { icon: CreditCard, title: 'Stripe Billing', desc: 'Subscription management with checkout, customer portal, and webhook handling out of the box.' },
  { icon: Shield, title: 'Enterprise Security', desc: 'JWT + refresh tokens, Google OAuth, bcrypt hashing, CORS, rate limiting, and admin controls.' },
];

const plans = [
  { name: 'Free', price: '$0', period: '/forever', features: ['50 API calls/day', '5 conversations', '3 templates', 'Community support'], cta: 'Get Started' },
  { name: 'Pro', price: '$29', period: '/month', features: ['1,000 API calls/day', 'Unlimited conversations', 'Unlimited templates', 'API key management', 'Priority support', 'Advanced analytics'], cta: 'Start Free Trial', popular: true },
  { name: 'Enterprise', price: '$99', period: '/month', features: ['10,000 API calls/day', 'Everything in Pro', 'Admin dashboard', 'Custom integrations', 'SLA guarantee', 'Dedicated support'], cta: 'Contact Sales' },
];

const steps = [
  { num: '01', title: 'Clone & Configure', desc: 'Fork the repo, set your environment variables, and customize the branding.' },
  { num: '02', title: 'Build & Deploy', desc: 'Use Docker Compose or deploy to your cloud provider with built-in CI/CD pipelines.' },
  { num: '03', title: 'Launch & Scale', desc: 'Start acquiring users, manage subscriptions, and scale with confidence.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-950 text-white">
      {/* ── Navbar ─────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-surface-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">NexusAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-surface-400 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-surface-400 hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="!text-surface-300 hover:!text-white">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────── */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent-500/15 rounded-full blur-[100px]" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" /> Open Source AI SaaS Starter Kit
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
            Build{' '}
            <span className="bg-gradient-to-r from-brand-400 via-brand-300 to-accent-400 bg-clip-text text-transparent">
              AI-Powered
            </span>{' '}
            SaaS Products Faster
          </h1>
          <p className="text-lg sm:text-xl text-surface-400 max-w-2xl mx-auto mb-10">
            A production-ready starter kit with authentication, billing, AI chat, admin panel, and everything you need to launch your SaaS product in days, not months.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Start Building Free
              </Button>
            </Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" leftIcon={<Github className="w-5 h-5" />} className="!border-white/20 !text-white">
                View on GitHub
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────── */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything You Need to Ship</h2>
            <p className="text-surface-400 max-w-2xl mx-auto">Production-ready features that would take months to build from scratch. Focus on your unique value, not boilerplate.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="group p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4 group-hover:bg-brand-500/20 transition-colors">
                  <f.icon className="w-6 h-6 text-brand-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-surface-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────── */}
      <section className="py-24 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Three Steps to Launch</h2>
            <p className="text-surface-400">From clone to production in record time.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.num} className="relative text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mx-auto mb-4 text-xl font-bold shadow-lg shadow-brand-500/25">
                  {s.num}
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t border-dashed border-white/10" />
                )}
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-surface-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────── */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-surface-400">Start for free. Upgrade when you need more.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map(plan => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 ${
                  plan.popular
                    ? 'bg-gradient-to-b from-brand-500/10 to-brand-900/20 border-2 border-brand-500/30 shadow-xl shadow-brand-500/10'
                    : 'bg-white/[0.03] border border-white/[0.06]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-xs font-semibold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-surface-400">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm text-surface-300">
                      <Check className="w-4 h-4 text-accent-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register">
                  <Button variant={plan.popular ? 'primary' : 'outline'} className={`w-full ${!plan.popular ? '!border-white/20 !text-white' : ''}`}>
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-brand-600 to-brand-800 p-12 sm:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px]" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 relative z-10">Ready to Get Started?</h2>
            <p className="text-brand-100 max-w-xl mx-auto mb-8 relative z-10">
              Join thousands of developers building AI products with NexusAI. Get started in minutes.
            </p>
            <Link to="/register" className="relative z-10 inline-block">
              <Button size="lg" variant="secondary" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Start Building for Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────── */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">NexusAI</span>
              </div>
              <p className="text-sm text-surface-400">The fastest way to build AI-powered SaaS products.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-surface-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-surface-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-surface-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-surface-500">&copy; {new Date().getFullYear()} NexusAI. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="text-surface-400 hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
              <a href="#" className="text-surface-400 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
