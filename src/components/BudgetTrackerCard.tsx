'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, AlertTriangle, CheckCircle2, Sliders, ShieldAlert, Sparkles } from 'lucide-react';
import { Transaction, MonthlyBudget } from '@/types';
import { getSavedBudget, saveBudget } from '@/lib/commute';
import toast from 'react-hot-toast';

interface BudgetTrackerCardProps {
  userId: string;
  transactions: Transaction[];
}

export default function BudgetTrackerCard({ userId, transactions }: BudgetTrackerCardProps) {
  const currentMonthYear = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const [budget, setBudget] = useState<MonthlyBudget>(() => getSavedBudget(userId, currentMonthYear));
  const [showEditModal, setShowEditModal] = useState(false);
  const [inputLimit, setInputLimit] = useState(budget.overallMonthlyLimit.toString());
  const [inputCommuteLimit, setInputCommuteLimit] = useState((budget.commuteMonthlyLimit || 5000).toString());

  useEffect(() => {
    setBudget(getSavedBudget(userId, currentMonthYear));
  }, [userId, currentMonthYear]);

  // Compute expenses for current month
  const now = new Date();
  const currentMonthTransactions = transactions.filter((t) => {
    if (t.type !== 'expense') return false;
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalSpentThisMonth = currentMonthTransactions.reduce((acc, t) => acc + t.amount, 0);

  // Transportation / Fuel spent
  const commuteSpentThisMonth = currentMonthTransactions
    .filter((t) => t.category === '2' || t.category === '16' || t.category === '17')
    .reduce((acc, t) => acc + t.amount, 0);

  const percentUsed = budget.overallMonthlyLimit > 0
    ? Math.min(100, Math.round((totalSpentThisMonth / budget.overallMonthlyLimit) * 100))
    : 0;

  const remaining = Math.max(0, budget.overallMonthlyLimit - totalSpentThisMonth);
  const isOverBudget = totalSpentThisMonth > budget.overallMonthlyLimit;

  // Determine alert status
  const alertColor = isOverBudget
    ? 'text-error'
    : percentUsed >= 85
    ? 'text-warning'
    : 'text-success';

  const progressBgColor = isOverBudget
    ? 'bg-error'
    : percentUsed >= 85
    ? 'bg-warning'
    : 'bg-gradient-to-r from-primary to-accent';

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(inputLimit);
    const commuteNum = parseFloat(inputCommuteLimit);

    if (isNaN(limitNum) || limitNum <= 0) {
      toast.error('Please enter a valid monthly budget limit');
      return;
    }

    const updated: MonthlyBudget = {
      ...budget,
      overallMonthlyLimit: limitNum,
      commuteMonthlyLimit: isNaN(commuteNum) ? undefined : commuteNum,
      monthYear: currentMonthYear,
    };

    saveBudget(userId, updated);
    setBudget(updated);
    setShowEditModal(false);
    toast.success('Monthly budget updated!');
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-glass border border-border/50 rounded-2xl p-5 sm:p-6 mb-6 relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-primary/20 text-primary">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground text-base sm:text-lg">
                Monthly Spending Guard
              </h3>
              <p className="text-xs text-foreground/60 font-body">
                {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(now)} Target
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setInputLimit(budget.overallMonthlyLimit.toString());
              setInputCommuteLimit((budget.commuteMonthlyLimit || 5000).toString());
              setShowEditModal(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-border/60 hover:border-primary/50 text-xs font-semibold text-foreground/80 hover:text-primary transition-all"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Set Limit</span>
          </button>
        </div>

        {/* Amount numbers & status */}
        <div className="flex items-end justify-between mb-2">
          <div>
            <span className="text-xs text-foreground/60 font-medium">Spent so far</span>
            <div className="flex items-baseline space-x-1">
              <span className={`text-2xl sm:text-3xl font-display font-bold ${alertColor}`}>
                ₹{totalSpentThisMonth.toLocaleString('en-IN')}
              </span>
              <span className="text-xs sm:text-sm text-foreground/50 font-body">
                / ₹{budget.overallMonthlyLimit.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-foreground/60 font-medium block">
              {isOverBudget ? 'Over Budget by' : 'Remaining'}
            </span>
            <span className={`font-display font-bold text-sm sm:text-base ${isOverBudget ? 'text-error' : 'text-foreground'}`}>
              ₹{isOverBudget
                ? (totalSpentThisMonth - budget.overallMonthlyLimit).toLocaleString('en-IN')
                : remaining.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-surface/80 rounded-full h-3 mb-3 overflow-hidden border border-border/40 p-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentUsed}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded-full transition-all ${progressBgColor}`}
          />
        </div>

        {/* Highlights & Category Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-foreground/70 pt-2 border-t border-border/40 font-body">
          <div className="flex items-center space-x-1.5">
            {isOverBudget ? (
              <ShieldAlert className="w-4 h-4 text-error" />
            ) : percentUsed >= 85 ? (
              <AlertTriangle className="w-4 h-4 text-warning" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-success" />
            )}
            <span>
              {isOverBudget
                ? `Exceeded limit by ${(totalSpentThisMonth - budget.overallMonthlyLimit).toLocaleString('en-IN')}!`
                : percentUsed >= 85
                ? `${percentUsed}% used - Consider pacing non-essential expenses`
                : `${100 - percentUsed}% buffer remaining`}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-lg bg-surface border border-border/50 text-[11px]">
              ⛽ Commute/Transit: ₹{commuteSpentThisMonth.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Edit Budget Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="backdrop-blur-glass border border-border/70 rounded-2xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-bold text-lg text-gradient">Set Monthly Budget</h3>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-foreground/50 hover:text-foreground text-sm font-semibold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveBudget} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-foreground/70 mb-1">
                    Overall Monthly Spending Target (₹)
                  </label>
                  <input
                    type="number"
                    step="500"
                    min="1000"
                    value={inputLimit}
                    onChange={(e) => setInputLimit(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border/50 rounded-xl font-body text-sm"
                    required
                  />
                  <p className="text-[11px] text-foreground/50 mt-1">
                    Set a realistic limit for all monthly expenses combined.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground/70 mb-1">
                    Commute / Travel Target (₹) (Optional)
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={inputCommuteLimit}
                    onChange={(e) => setInputCommuteLimit(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border/50 rounded-xl font-body text-sm"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-primary text-white text-xs font-semibold glow hover:opacity-90"
                  >
                    Save Target
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
