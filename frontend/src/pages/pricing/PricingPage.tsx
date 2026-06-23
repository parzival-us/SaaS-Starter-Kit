import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';


const plans = [
  { name: 'Free', price: { monthly: 0, annual: 0 }, features: ['50 API calls/day', '5 conversations', '3 templates', 'Community support', 'Basic analytics'], cta: 'Get Started' },
  { name: 'Pro', price: { monthly: 29, annual: 23 }, features: ['1,000 API calls/day', 'Unlimited conversations', 'Unlimited templates', 'API key management', 'Priority support', 'Advanced analytics', 'Custom models'], cta: 'Start Free Trial', popular: true },
  { name: 'Enterprise', price: { monthly: 99, annual: 79 }, features: ['10,000 API calls/day', 'Everything in Pro', 'Admin dashboard', 'Custom integrations', 'SLA guarantee', 'Dedicated support', 'SSO support', 'Audit logs'], cta: 'Contact Sales' },
];

const faqs = [
  { q: 'Can I switch plans anytime?', a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we prorate the difference.' },
  { q: 'What happens when I exceed my API limit?', a: 'We will notify you when you reach 80% of your limit. If you exceed it, additional requests will be queued until the next day or you upgrade.' },
  { q: 'Is there a free trial for paid plans?', a: 'Yes! Both Pro and Enterprise plans come with a 14-day free trial. No credit card required to start.' },
  { q: 'Can I cancel my subscription?', a: 'Absolutely. You can cancel at any time from your billing settings. Your plan will remain active until the end of the billing period.' },
  { q: 'Do you offer custom enterprise pricing?', a: 'Yes, for teams with specific needs, we offer custom plans. Contact our sales team for a tailored quote.' },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-surface-950 text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-surface-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">NexusAI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm" className="!text-surface-300">Sign In</Button></Link>
            <Link to="/register"><Button size="sm">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-surface-400 max-w-2xl mx-auto mb-8">Choose the plan that fits your needs. Upgrade, downgrade, or cancel anytime.</p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 p-1 bg-white/5 rounded-full border border-white/10">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!annual ? 'bg-brand-600 text-white' : 'text-surface-400 hover:text-white'}`}
            >Monthly</button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${annual ? 'bg-brand-600 text-white' : 'text-surface-400 hover:text-white'}`}
            >Annual <span className="text-accent-400 ml-1">Save 20%</span></button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-24">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all ${
                plan.popular
                  ? 'bg-gradient-to-b from-brand-500/10 to-brand-900/20 border-2 border-brand-500/30 shadow-xl shadow-brand-500/10 scale-105'
                  : 'bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-xs font-semibold">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold">${annual ? plan.price.annual : plan.price.monthly}</span>
                <span className="text-surface-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-surface-300">
                    <Check className="w-4 h-4 text-accent-500 shrink-0" />{f}
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

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="font-medium">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-surface-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-sm text-surface-400 leading-relaxed animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 rounded-3xl bg-gradient-to-r from-brand-600 to-brand-800 p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px]" />
          <h2 className="text-3xl font-bold mb-4 relative z-10">Ready to Get Started?</h2>
          <p className="text-brand-100 max-w-xl mx-auto mb-8 relative z-10">Start for free and upgrade when you need more power.</p>
          <Link to="/register" className="relative z-10 inline-block">
            <Button size="lg" variant="secondary" rightIcon={<ArrowRight className="w-5 h-5" />}>Start Building Free</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
