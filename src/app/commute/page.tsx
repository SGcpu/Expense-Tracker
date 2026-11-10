'use client';

// Force dynamic rendering to avoid Firebase initialization during build
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Fuel,
  Gauge,
  Plus,
  Trash2,
  Calendar,
  Calculator,
  Compass,
  ArrowRight,
  Sparkles,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import DashboardLayout from '@/components/DashboardLayout';
import { FuelLogEntry, CommuteEstimateInput } from '@/types';
import {
  calculateCommuteCost,
  getSavedFuelLogs,
  addFuelLog,
  deleteFuelLog,
  COMMUTE_PRESETS,
  CommutePreset
} from '@/lib/commute';
import toast from 'react-hot-toast';

export default function CommuteHubPage() {
  const { user } = useAuth();
  const { addTransaction, getUserTransactions } = useDatabase();

  const [activeTab, setActiveTab] = useState<'fuel' | 'estimator' | 'quick'>('fuel');
  const [fuelLogs, setFuelLogs] = useState<FuelLogEntry[]>([]);
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [recentCommuteTotal, setRecentCommuteTotal] = useState(0);

  // New Fuel Refill Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [fuelType, setFuelType] = useState<FuelLogEntry['fuelType']>('petrol');
  const [odometer, setOdometer] = useState('');
  const [fuelQuantity, setFuelQuantity] = useState('');
  const [cost, setCost] = useState('');
  const [fullTank, setFullTank] = useState(true);
  const [notes, setNotes] = useState('');
  const [syncToTransactions, setSyncToTransactions] = useState(true);
  const [submittingLog, setSubmittingLog] = useState(false);

  // Commute Estimator State
  const [estimateInput, setEstimateInput] = useState<CommuteEstimateInput>({
    oneWayDistanceKm: 18,
    tripsPerDay: 2,
    daysPerMonth: 22,
    fuelPrice: 104,
    vehicleMileage: 45, // default bike mileage km/l
    parkingDaily: 30,
    tollDaily: 0,
  });

  const [vehicleMode, setVehicleMode] = useState<'bike' | 'car' | 'custom'>('bike');

  const loadData = useCallback(async () => {
    if (!user?.uid) return;
    const logs = getSavedFuelLogs(user.uid);
    setFuelLogs(logs);

    try {
      const txs = await getUserTransactions(user.uid);
      const now = new Date();
      const thisMonth = txs.filter(t => {
        const d = new Date(t.date);
        return (
          t.type === 'expense' &&
          (t.category === '2' || t.category === '16' || t.category === '17') &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });
      const sum = thisMonth.reduce((acc, t) => acc + t.amount, 0);
      setRecentCommuteTotal(sum);
    } catch {
      // ignore
    }
  }, [user?.uid, getUserTransactions]);

  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [user?.uid, loadData]);

  // Handle vehicle preset select
  const handleSelectMode = (mode: 'bike' | 'car' | 'custom') => {
    setVehicleMode(mode);
    if (mode === 'bike') {
      setEstimateInput(prev => ({
        ...prev,
        vehicleMileage: 45,
        fuelPrice: 104,
        parkingDaily: 20,
        tollDaily: 0,
      }));
    } else if (mode === 'car') {
      setEstimateInput(prev => ({
        ...prev,
        vehicleMileage: 14,
        fuelPrice: 104,
        parkingDaily: 100,
        tollDaily: 85,
      }));
    }
  };

  const calculatedEstimate = useMemo(() => {
    return calculateCommuteCost(estimateInput);
  }, [estimateInput]);

  // Add Refill Log
  const handleAddFuelLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    const odoNum = parseFloat(odometer);
    const qtyNum = parseFloat(fuelQuantity);
    const costNum = parseFloat(cost);

    if (isNaN(odoNum) || odoNum <= 0) {
      toast.error('Please enter a valid odometer reading in km');
      return;
    }
    if (isNaN(qtyNum) || qtyNum <= 0) {
      toast.error('Please enter a valid fuel volume in litres');
      return;
    }
    if (isNaN(costNum) || costNum <= 0) {
      toast.error('Please enter total amount paid');
      return;
    }

    setSubmittingLog(true);
    try {
      let txId: string | undefined = undefined;

      if (syncToTransactions) {
        txId = await addTransaction(user.uid, {
          type: 'expense',
          amount: costNum,
          description: `${fuelType.toUpperCase()} Refill (${qtyNum.toFixed(1)}L @ ₹${(costNum / qtyNum).toFixed(1)}/L)${notes ? ' - ' + notes : ''}`,
          category: '16', // Fuel & Petrol category
          date: new Date(date),
        });
      }

      const newEntry = addFuelLog(user.uid, {
        date,
        fuelType,
        odometer: odoNum,
        fuelQuantity: qtyNum,
        cost: costNum,
        fullTank,
        notes: notes.trim(),
        transactionId: txId,
      });

      setShowAddLogModal(false);
      resetLogForm();
      loadData();
      toast.success(
        newEntry.mileage
          ? `Refill logged! Calculated mileage: ${newEntry.mileage} km/l`
          : 'Refill logged successfully! Log another refill later to see computed mileage.'
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to log fuel refill');
    } finally {
      setSubmittingLog(false);
    }
  };

  const handleDeleteLog = (id: string) => {
    if (!user?.uid) return;
    if (window.confirm('Delete this fuel log entry?')) {
      const updated = deleteFuelLog(user.uid, id);
      setFuelLogs(updated);
      toast.success('Fuel entry removed');
    }
  };

  const resetLogForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setFuelType('petrol');
    setOdometer('');
    setFuelQuantity('');
    setCost('');
    setFullTank(true);
    setNotes('');
  };

  // Quick Preset Add
  const handleQuickPreset = async (preset: CommutePreset) => {
    if (!user?.uid) return;
    try {
      await addTransaction(user.uid, {
        type: 'expense',
        amount: preset.amount,
        description: preset.description,
        category: preset.category,
        date: new Date(),
      });
      loadData();
      toast.success(`Logged ${preset.name} (₹${preset.amount})`);
    } catch {
      toast.error('Failed to log preset');
    }
  };

  // Compute fuel summary stats
  const fuelStats = useMemo(() => {
    if (fuelLogs.length === 0) {
      return { totalSpent: 0, totalFuel: 0, avgMileage: 0, avgCostPerKm: 0, totalKm: 0 };
    }
    const totalSpent = fuelLogs.reduce((acc, l) => acc + l.cost, 0);
    const totalFuel = fuelLogs.reduce((acc, l) => acc + l.fuelQuantity, 0);

    const logsWithMileage = fuelLogs.filter(l => l.mileage && l.mileage > 0);
    const avgMileage = logsWithMileage.length > 0
      ? logsWithMileage.reduce((acc, l) => acc + (l.mileage || 0), 0) / logsWithMileage.length
      : 0;

    const logsWithCostPerKm = fuelLogs.filter(l => l.costPerKm && l.costPerKm > 0);
    const avgCostPerKm = logsWithCostPerKm.length > 0
      ? logsWithCostPerKm.reduce((acc, l) => acc + (l.costPerKm || 0), 0) / logsWithCostPerKm.length
      : 0;

    return {
      totalSpent: Math.round(totalSpent),
      totalFuel: Math.round(totalFuel * 10) / 10,
      avgMileage: Math.round(avgMileage * 10) / 10,
      avgCostPerKm: Math.round(avgCostPerKm * 100) / 100,
    };
  }, [fuelLogs]);

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-primary/20 text-primary">
                <Compass className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-display font-bold text-gradient">
                Commute & Fuel Hub
              </h1>
            </div>
            <p className="text-foreground/70 font-body text-sm">
              Smart tools for everyday commuters: track fuel refills, compute real mileage & estimate travel costs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                resetLogForm();
                setShowAddLogModal(true);
              }}
              className="inline-flex items-center gap-2 bg-gradient-primary hover:opacity-95 text-white font-semibold py-2.5 px-4 rounded-xl text-sm glow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Log Refill</span>
            </button>
          </div>
        </motion.div>

        {/* Highlight Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="backdrop-blur-glass border border-border/50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-body text-foreground/60">This Month Commute</span>
              <Fuel className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-display font-bold text-foreground">
              ₹{recentCommuteTotal.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-foreground/50 mt-1">Logged transit & fuel</p>
          </div>

          <div className="backdrop-blur-glass border border-border/50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-body text-foreground/60">Real Mileage</span>
              <Gauge className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl font-display font-bold text-emerald-400">
              {fuelStats.avgMileage > 0 ? `${fuelStats.avgMileage} km/L` : '—'}
            </p>
            <p className="text-xs text-foreground/50 mt-1">
              {fuelStats.avgMileage > 0 ? 'From odometer diffs' : 'Need 2+ fillups'}
            </p>
          </div>

          <div className="backdrop-blur-glass border border-border/50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-body text-foreground/60">Running Cost</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xl font-display font-bold text-foreground">
              {fuelStats.avgCostPerKm > 0 ? `₹${fuelStats.avgCostPerKm}/km` : '—'}
            </p>
            <p className="text-xs text-foreground/50 mt-1">Average fuel cost</p>
          </div>

          <div className="backdrop-blur-glass border border-border/50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-body text-foreground/60">Total Fuel Logged</span>
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <p className="text-xl font-display font-bold text-foreground">
              {fuelStats.totalFuel} L
            </p>
            <p className="text-xs text-foreground/50 mt-1">₹{fuelStats.totalSpent.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border/50 mb-6 gap-2">
          <button
            onClick={() => setActiveTab('fuel')}
            className={`pb-3 px-3 text-sm font-semibold transition-colors relative ${
              activeTab === 'fuel' ? 'text-primary' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            ⛽ Fuel Refill Tracker ({fuelLogs.length})
            {activeTab === 'fuel' && (
              <motion.div layoutId="tabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('estimator')}
            className={`pb-3 px-3 text-sm font-semibold transition-colors relative ${
              activeTab === 'estimator' ? 'text-primary' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            🧮 Daily Commute Cost Calculator
            {activeTab === 'estimator' && (
              <motion.div layoutId="tabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('quick')}
            className={`pb-3 px-3 text-sm font-semibold transition-colors relative ${
              activeTab === 'quick' ? 'text-primary' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            ⚡ 1-Tap Commute Loggers
            {activeTab === 'quick' && (
              <motion.div layoutId="tabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        {/* TAB 1: Fuel Refill Log */}
        {activeTab === 'fuel' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-semibold">Refill History & Efficiency</h2>
              <button
                onClick={() => {
                  resetLogForm();
                  setShowAddLogModal(true);
                }}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Fill-up
              </button>
            </div>

            {fuelLogs.length === 0 ? (
              <div className="backdrop-blur-glass border border-border/50 rounded-2xl p-8 text-center">
                <div className="w-14 h-14 mx-auto mb-3 bg-surface rounded-2xl flex items-center justify-center text-primary">
                  <Fuel className="w-7 h-7" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1">No fuel refills recorded yet</h3>
                <p className="text-foreground/60 text-xs max-w-sm mx-auto mb-4 font-body">
                  Record your odometer reading each time you refill fuel. The app will automatically compute your true vehicle mileage (km/L) and cost per km!
                </p>
                <button
                  onClick={() => setShowAddLogModal(true)}
                  className="bg-primary hover:opacity-90 text-white text-xs font-semibold py-2 px-4 rounded-xl transition-all"
                >
                  Log Your First Refill
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {fuelLogs.map((entry) => (
                  <div
                    key={entry.id}
                    className="backdrop-blur-glass border border-border/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/40 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-lg shrink-0">
                        ⛽
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground capitalize text-sm">
                            {entry.fuelType} Refill • {entry.fuelQuantity} L
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-surface border border-border/50 text-foreground/70">
                            ODO: {entry.odometer.toLocaleString()} km
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-foreground/60 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{entry.date}</span>
                          {entry.pricePerUnit && (
                            <>
                              <span>•</span>
                              <span>₹{entry.pricePerUnit.toFixed(1)}/L</span>
                            </>
                          )}
                          {entry.notes && (
                            <>
                              <span>•</span>
                              <span className="italic">{entry.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40">
                      <div className="text-left sm:text-right">
                        <p className="font-display font-bold text-base text-secondary">
                          ₹{entry.cost.toLocaleString('en-IN')}
                        </p>
                        {entry.mileage ? (
                          <p className="text-xs font-semibold text-emerald-400">
                            {entry.mileage} km/L ({entry.costPerKm ? `₹${entry.costPerKm}/km` : ''})
                          </p>
                        ) : (
                          <p className="text-xs text-foreground/40">Baseline refill</p>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteLog(entry.id)}
                        className="p-2 rounded-lg text-foreground/40 hover:text-error hover:bg-error/10 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: Commute Cost Estimator */}
        {activeTab === 'estimator' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Input Config Card */}
            <div className="lg:col-span-6 backdrop-blur-glass border border-border/50 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  Your Daily Travel Parameters
                </h2>
              </div>

              {/* Mode Selector */}
              <div>
                <label className="block text-xs font-medium text-foreground/70 mb-2">Vehicle Preset</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectMode('bike')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      vehicleMode === 'bike'
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'border-border/60 hover:border-primary/40'
                    }`}
                  >
                    🛵 Motorcycle / Scooter
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectMode('car')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      vehicleMode === 'car'
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'border-border/60 hover:border-primary/40'
                    }`}
                  >
                    🚗 Petrol Car
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectMode('custom')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      vehicleMode === 'custom'
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'border-border/60 hover:border-primary/40'
                    }`}
                  >
                    ⚙️ Custom
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground/70 mb-1">
                    One-way Distance (km)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={estimateInput.oneWayDistanceKm}
                    onChange={(e) =>
                      setEstimateInput(p => ({ ...p, oneWayDistanceKm: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 bg-surface border border-border/50 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground/70 mb-1">
                    Commute Days / Month
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={estimateInput.daysPerMonth}
                    onChange={(e) =>
                      setEstimateInput(p => ({ ...p, daysPerMonth: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 bg-surface border border-border/50 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground/70 mb-1">
                    Vehicle Mileage (km/L)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={estimateInput.vehicleMileage}
                    onChange={(e) =>
                      setEstimateInput(p => ({ ...p, vehicleMileage: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 bg-surface border border-border/50 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground/70 mb-1">
                    Fuel Price (₹ / Litre)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={estimateInput.fuelPrice}
                    onChange={(e) =>
                      setEstimateInput(p => ({ ...p, fuelPrice: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 bg-surface border border-border/50 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground/70 mb-1">
                    Daily Parking (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={estimateInput.parkingDaily || 0}
                    onChange={(e) =>
                      setEstimateInput(p => ({ ...p, parkingDaily: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 bg-surface border border-border/50 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground/70 mb-1">
                    Daily Toll / Fastag (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={estimateInput.tollDaily || 0}
                    onChange={(e) =>
                      setEstimateInput(p => ({ ...p, tollDaily: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 bg-surface border border-border/50 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Calculated Cost Breakdown Output */}
            <div className="lg:col-span-6 space-y-4">
              <div className="backdrop-blur-glass border border-primary/30 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

                <h3 className="text-xs uppercase tracking-wider font-semibold text-primary mb-1">
                  Projected Commute Expense
                </h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-display font-bold text-foreground">
                    ₹{calculatedEstimate.monthlyTotalCost.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-foreground/60">/ month</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-surface/50 border border-border/40">
                    <span className="text-xs text-foreground/60 block">Daily Commute Cost</span>
                    <span className="text-lg font-bold text-foreground">
                      ₹{calculatedEstimate.dailyTotalCost}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface/50 border border-border/40">
                    <span className="text-xs text-foreground/60 block">Effective Cost / km</span>
                    <span className="text-lg font-bold text-foreground">
                      ₹{calculatedEstimate.costPerKm}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface/50 border border-border/40">
                    <span className="text-xs text-foreground/60 block">Monthly Distance</span>
                    <span className="text-base font-bold text-foreground">
                      {calculatedEstimate.totalMonthlyDistanceKm} km
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface/50 border border-border/40">
                    <span className="text-xs text-foreground/60 block">Monthly Fuel Portion</span>
                    <span className="text-base font-bold text-foreground">
                      ₹{calculatedEstimate.monthlyFuelCost.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Practical comparison insight */}
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-foreground/80 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-primary">Smart Commuter Insight: </span>
                    If you take a public bus or metro (~₹50/day), you would spend ~₹
                    {(50 * estimateInput.daysPerMonth).toLocaleString('en-IN')} monthly, saving{' '}
                    <span className="font-bold text-emerald-400">
                      ₹{Math.max(0, calculatedEstimate.monthlyTotalCost - (50 * estimateInput.daysPerMonth)).toLocaleString('en-IN')}
                    </span>{' '}
                    every month!
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: Quick Presets */}
        {activeTab === 'quick' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="backdrop-blur-glass border border-border/50 rounded-2xl p-5">
              <h2 className="text-base font-display font-semibold mb-1">
                Frequent Commute & Daily Common Expenses
              </h2>
              <p className="text-xs text-foreground/60 mb-4 font-body">
                Single-tap quick logger for expenses you incur every day on the go. Automatically logs into your active database.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {COMMUTE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleQuickPreset(p)}
                    className="p-3.5 rounded-xl border border-border/50 hover:border-primary/50 bg-surface/40 hover:bg-surface transition-all flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{p.icon}</span>
                      <div>
                        <p className="font-body font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-foreground/50">{p.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Log Refill Modal */}
        <AnimatePresence>
          {showAddLogModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4"
              onClick={() => setShowAddLogModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="backdrop-blur-glass border border-border/60 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⛽</span>
                    <h2 className="text-lg font-display font-bold text-gradient">
                      Log Fuel Refill
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowAddLogModal(false)}
                    className="text-foreground/50 hover:text-foreground text-sm font-semibold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddFuelLog} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Fuel Type</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['petrol', 'diesel', 'cng', 'electric'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFuelType(t)}
                          className={`py-2 text-xs rounded-xl border capitalize font-semibold transition-all ${
                            fuelType === t
                              ? 'bg-primary/20 border-primary text-primary'
                              : 'border-border/60 hover:border-primary/40'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Date</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2 bg-surface border border-border/50 rounded-xl text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Current Odometer (km)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 14250"
                        value={odometer}
                        onChange={(e) => setOdometer(e.target.value)}
                        className="w-full px-3 py-2 bg-surface border border-border/50 rounded-xl text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Fuel Quantity ({fuelType === 'electric' ? 'kWh' : 'Litres'})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 5.2"
                        value={fuelQuantity}
                        onChange={(e) => setFuelQuantity(e.target.value)}
                        className="w-full px-3 py-2 bg-surface border border-border/50 rounded-xl text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Total Cost (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 500"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        className="w-full px-3 py-2 bg-surface border border-border/50 rounded-xl text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Notes / Petrol Pump</label>
                    <input
                      type="text"
                      placeholder="e.g. Shell Pump, Highway refill"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-border/50 rounded-xl text-sm"
                    />
                  </div>

                  <div className="p-3 bg-surface/40 rounded-xl border border-border/40 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                      <input
                        type="checkbox"
                        checked={syncToTransactions}
                        onChange={(e) => setSyncToTransactions(e.target.checked)}
                        className="rounded border-border"
                      />
                      <span>Also add this as an expense in my main Transactions</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                      <input
                        type="checkbox"
                        checked={fullTank}
                        onChange={(e) => setFullTank(e.target.checked)}
                        className="rounded border-border"
                      />
                      <span>Tank was filled to full (gives accurate mileage)</span>
                    </label>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddLogModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-border/60 text-xs font-semibold hover:bg-surface"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingLog}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-primary text-white text-xs font-semibold glow hover:opacity-90 disabled:opacity-50"
                    >
                      {submittingLog ? 'Saving...' : 'Save Refill Log'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
