import { useState, useEffect } from 'react';
import { Check, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Subscription { id: string; plan_name: string; status: string; current_period_start: string | null; current_period_end: string | null; }
interface Plan { name: string; display_name: string; price_monthly: number; features: { name: string; included: boolean }[]; is_popular: boolean; }

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    api.get<Subscription>('/api/v1/subscriptions/current').then(r => setSub(r.data)).catch(() => {});
    api.get<Plan[]>('/api/v1/subscriptions/plans').then(r => setPlans(r.data || [])).catch(() => {
      setPlans([
        { name: 'free', display_name: 'Free', price_monthly: 0, is_popular: false, features: [{ name: '50 API calls/day', included: true }, { name: '5 conversations', included: true }, { name: '3 templates', included: true }] },
        { name: 'pro', display_name: 'Pro', price_monthly: 29, is_popular: true, features: [{ name: '1,000 API calls/day', included: true }, { name: 'Unlimited conversations', included: true }, { name: 'Unlimited templates', included: true }, { name: 'Priority support', included: true }] },
        { name: 'enterprise', display_name: 'Enterprise', price_monthly: 99, is_popular: false, features: [{ name: '10,000 API calls/day', included: true }, { name: 'Everything in Pro', included: true }, { name: 'Admin dashboard', included: true }, { name: 'SLA guarantee', included: true }] },
      ]);
    });
  }, []);

  const currentPlan = sub?.plan_name || 'free';

  const handleUpgrade = async (planName: string) => {
    try {
      const r = await api.post('/api/v1/subscriptions/checkout', {
        price_id: planName === 'pro' ? 'price_pro' : 'price_enterprise',
        success_url: `${window.location.origin}/settings/billing?success=true`,
        cancel_url: `${window.location.origin}/settings/billing`,
      });
      window.location.href = r.data.checkout_url;
    } catch { toast.error('Failed to start checkout'); }
  };

  const handlePortal = async () => {
    try {
      const r = await api.get('/api/v1/subscriptions/portal');
      window.location.href = r.data.portal_url;
    } catch { toast.error('Failed to open billing portal'); }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Billing & Subscription</h1>

      {/* Current Plan */}
      <Card variant="gradient-border">
        <CardBody className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-900/30">
              <Crown className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-surface-900 dark:text-white">{currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan</h3>
                <Badge variant="success" dot>Active</Badge>
              </div>
              {sub?.current_period_end && (
                <p className="text-sm text-surface-500 mt-0.5">Renews {new Date(sub.current_period_end).toLocaleDateString()}</p>
              )}
            </div>
          </div>
          {currentPlan !== 'free' && <Button variant="secondary" onClick={handlePortal}>Manage Subscription</Button>}
        </CardBody>
      </Card>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <Card key={plan.name} className={plan.is_popular ? 'ring-2 ring-brand-500' : ''}>
            <CardBody className="space-y-4">
              {plan.is_popular && <Badge variant="info">Most Popular</Badge>}
              <h3 className="text-lg font-bold text-surface-900 dark:text-white">{plan.display_name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-surface-900 dark:text-white">${plan.price_monthly}</span>
                <span className="text-surface-500">/mo</span>
              </div>
              <ul className="space-y-2">
                {plan.features.map(f => (
                  <li key={f.name} className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                    <Check className="w-4 h-4 text-accent-500 shrink-0" />
                    {f.name}
                  </li>
                ))}
              </ul>
              {currentPlan === plan.name ? (
                <Button variant="secondary" className="w-full" disabled>Current Plan</Button>
              ) : (
                <Button
                  variant={plan.is_popular ? 'primary' : 'outline'}
                  className="w-full"
                  onClick={() => handleUpgrade(plan.name)}
                >
                  {plan.price_monthly > (plans.find(p => p.name === currentPlan)?.price_monthly || 0) ? 'Upgrade' : 'Switch'}
                </Button>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
