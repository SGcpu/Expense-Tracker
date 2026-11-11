'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Calendar, Tag } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types';
import { useDatabase } from '@/contexts/DatabaseContext';
import { COMMUTE_PRESETS, CommutePreset } from '@/lib/commute';
import toast from 'react-hot-toast';

interface AddTransactionModalProps {
  onClose: () => void;
  onTransactionAdded: () => void;
  userId: string;
}

export default function AddTransactionModal({ onClose, onTransactionAdded, userId }: AddTransactionModalProps) {
  const { addTransaction } = useDatabase();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !description || !category) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await addTransaction(userId, {
        type,
        amount: parseFloat(amount),
        description,
        category,
        date: new Date(date),
      });
      
      onTransactionAdded();
    } catch {
      toast.error('Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="backdrop-blur-glass border border-border/50 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-bold text-gradient">
              Add Transaction
            </h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quick Presets for Commuters & Daily Essentials */}
            <div>
              <label className="block text-xs font-body font-medium text-foreground/70 mb-2">
                ⚡ Quick Presets (One-tap fill)
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {COMMUTE_PRESETS.slice(0, 5).map((preset: CommutePreset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setType('expense');
                      setAmount(preset.amount.toString());
                      setDescription(preset.description);
                      setCategory(preset.category);
                    }}
                    className="flex-shrink-0 px-2.5 py-1.5 rounded-lg border border-border/60 hover:border-primary/50 bg-surface/40 hover:bg-surface text-xs font-medium text-foreground/80 flex items-center space-x-1 transition-all"
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-body font-medium mb-3">
                Transaction Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setType('expense');
                    setCategory('');
                  }}
                  className={`p-3 sm:p-4 rounded-xl border transition-all font-body text-sm sm:text-base ${
                    type === 'expense'
                      ? 'border-secondary bg-secondary/10 text-secondary'
                      : 'border-border/50 hover:border-secondary/50'
                  }`}
                >
                  Expense
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setType('income');
                    setCategory('');
                  }}
                  className={`p-3 sm:p-4 rounded-xl border transition-all font-body text-sm sm:text-base ${
                    type === 'income'
                      ? 'border-success bg-success/10 text-success'
                      : 'border-border/50 hover:border-success/50'
                  }`}
                >
                  Income
                </motion.button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-body font-medium mb-2">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50 font-semibold text-lg">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface border border-border/50 rounded-xl font-body focus:border-primary focus:outline-none transition-colors"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-body font-medium mb-2">
                Description
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-foreground/50" />
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface border border-border/50 rounded-xl font-body focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter description"
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-body font-medium mb-2">
                Category
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-3 w-5 h-5 text-foreground/50" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface border border-border/50 rounded-xl font-body focus:border-primary focus:outline-none transition-colors appearance-none"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-body font-medium mb-2">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/50" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface border border-border/50 rounded-xl font-body focus:border-primary focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-4 rounded-xl font-body font-semibold transition-all ${
                type === 'income'
                  ? 'bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70'
                  : 'bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70'
              } text-white glow disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Adding...</span>
                </div>
              ) : (
                `Add ${type === 'income' ? 'Income' : 'Expense'}`
              )}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}