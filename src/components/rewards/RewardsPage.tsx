import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Reward } from '../../types';
import { useApp } from '../../store/AppContext';
import { getXpBalance } from '../../lib/xpEngine';
import { formatRelativeDate, toDateKey } from '../../lib/dateUtils';
import { cn } from '../../lib/utils';
import { Button, Card, EmptyState } from '../ui/Primitives';
import { RewardFormModal } from './RewardFormModal';

export function RewardsPage() {
  const { state, redeemReward } = useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | undefined>(undefined);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const balance = getXpBalance(state);

  function handleRedeem(id: string) {
    const result = redeemReward(id);
    if (!result.success) {
      setRedeemError(result.error ?? 'Could not redeem this reward.');
      setTimeout(() => setRedeemError(null), 3500);
    }
  }

  function openEdit(reward: Reward) {
    setEditingReward(reward);
    setFormOpen(true);
  }
  function openNew() {
    setEditingReward(undefined);
    setFormOpen(true);
  }

  const recentTransactions = [...state.rewardTransactions]
    .sort((a, b) => b.redeemedAt.localeCompare(a.redeemedAt))
    .slice(0, 20);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-sm font-semibold text-[var(--text)]">Reward Shop</h2>
            <p className="font-mono text-xs text-[var(--text-muted)]">{balance} XP available</p>
          </div>
          <Button onClick={openNew} icon={<Plus size={15} />} size="sm">
            New reward
          </Button>
        </div>

        {redeemError && (
          <div className="mb-3 rounded-[var(--radius-md)] border border-[rgba(var(--danger-rgb),0.35)] bg-[rgba(var(--danger-rgb),0.08)] px-3 py-2 text-sm text-[var(--danger)]">
            {redeemError}
          </div>
        )}

        {state.rewards.length === 0 ? (
          <EmptyState
            icon="🎁"
            title="No rewards yet"
            description="Set up real-life rewards you can redeem with the XP you earn."
            action={
              <Button onClick={openNew} icon={<Plus size={15} />}>
                Create reward
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {state.rewards.map((reward) => {
              const affordable = balance >= reward.cost;
              return (
                <Card key={reward.id} padding="sm" className="flex flex-col gap-2">
                  <button onClick={() => openEdit(reward)} className="flex flex-col items-start gap-1 text-left">
                    <span className="text-2xl">{reward.icon}</span>
                    <span className="text-sm font-medium text-[var(--text)]">{reward.name}</span>
                    {reward.description && (
                      <span className="text-xs text-[var(--text-muted)]">{reward.description}</span>
                    )}
                  </button>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-[var(--text-muted)]">{reward.cost} XP</span>
                    <Button
                      size="sm"
                      variant={affordable ? 'primary' : 'secondary'}
                      disabled={!affordable}
                      onClick={() => handleRedeem(reward.id)}
                    >
                      Redeem
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-sm font-semibold text-[var(--text)]">Achievements</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {state.achievements.map((a) => (
            <Card
              key={a.id}
              padding="sm"
              className={cn('flex flex-col items-center gap-1.5 text-center', !a.unlockedAt && 'opacity-45')}
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="text-xs font-medium text-[var(--text)]">{a.title}</span>
              <span className="text-[11px] text-[var(--text-muted)]">{a.description}</span>
              {a.unlockedAt && (
                <span className="mt-1 font-mono text-[10px] text-[var(--accent)]">
                  {formatRelativeDate(toDateKey(new Date(a.unlockedAt)))}
                </span>
              )}
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-sm font-semibold text-[var(--text)]">Reward history</h2>
        {recentTransactions.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No rewards redeemed yet.</p>
        ) : (
          <div className="space-y-1.5">
            {recentTransactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2 text-[var(--text)]">
                  <span>{t.rewardIcon}</span>
                  {t.rewardName}
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[var(--text-muted)]">-{t.cost} XP</span>
                  <span className="text-xs text-[var(--text-faint)]">
                    {formatRelativeDate(toDateKey(new Date(t.redeemedAt)))}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <RewardFormModal open={formOpen} onClose={() => setFormOpen(false)} reward={editingReward} />
    </div>
  );
}

