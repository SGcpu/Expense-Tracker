import { FuelLogEntry, MonthlyBudget, CommuteEstimateInput, CommuteCostBreakdown } from '@/types';

const FUEL_LOGS_STORAGE_KEY_PREFIX = 'expensetracker_fuel_logs_';
const BUDGET_STORAGE_KEY_PREFIX = 'expensetracker_budget_';

/**
 * Calculate commute costs based on trip details.
 */
export function calculateCommuteCost(input: CommuteEstimateInput): CommuteCostBreakdown {
  const {
    oneWayDistanceKm,
    daysPerMonth,
    tripsPerDay,
    fuelPrice,
    vehicleMileage,
    parkingDaily = 0,
    tollDaily = 0,
  } = input;

  if (vehicleMileage <= 0 || fuelPrice <= 0 || oneWayDistanceKm <= 0) {
    return {
      dailyFuelCost: 0,
      dailyTotalCost: 0,
      monthlyFuelCost: 0,
      monthlyTotalCost: 0,
      totalMonthlyDistanceKm: 0,
      costPerKm: 0,
    };
  }

  const dailyDistanceKm = oneWayDistanceKm * tripsPerDay;
  const dailyFuelCost = (dailyDistanceKm / vehicleMileage) * fuelPrice;
  const dailyTotalCost = dailyFuelCost + parkingDaily + tollDaily;

  const totalMonthlyDistanceKm = dailyDistanceKm * daysPerMonth;
  const monthlyFuelCost = dailyFuelCost * daysPerMonth;
  const monthlyTotalCost = dailyTotalCost * daysPerMonth;

  const costPerKm = dailyDistanceKm > 0 ? dailyTotalCost / dailyDistanceKm : 0;

  return {
    dailyFuelCost: Math.round(dailyFuelCost * 100) / 100,
    dailyTotalCost: Math.round(dailyTotalCost * 100) / 100,
    monthlyFuelCost: Math.round(monthlyFuelCost * 100) / 100,
    monthlyTotalCost: Math.round(monthlyTotalCost * 100) / 100,
    totalMonthlyDistanceKm: Math.round(totalMonthlyDistanceKm * 100) / 100,
    costPerKm: Math.round(costPerKm * 100) / 100,
  };
}

/**
 * Re-computes mileage (km/l) and cost per km across sorted fuel logs.
 * Entries must be chronologically ordered (oldest to newest) to compute diffs.
 */
export function processFuelLogs(entries: FuelLogEntry[]): FuelLogEntry[] {
  // Sort ascending by odometer
  const sorted = [...entries].sort((a, b) => {
    if (a.odometer !== b.odometer) return a.odometer - b.odometer;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    // Price per unit
    if (!current.pricePerUnit && current.fuelQuantity > 0) {
      current.pricePerUnit = Math.round((current.cost / current.fuelQuantity) * 100) / 100;
    }

    if (i > 0) {
      const prev = sorted[i - 1];
      const dist = current.odometer - prev.odometer;
      if (dist > 0 && current.fuelQuantity > 0) {
        current.mileage = Math.round((dist / current.fuelQuantity) * 100) / 100;
        current.costPerKm = Math.round((current.cost / dist) * 100) / 100;
      }
    }
  }

  // Return descending (newest first) for user viewing
  return sorted.reverse();
}

/**
 * LocalStorage storage helpers for Fuel Logs
 */
export function getSavedFuelLogs(userId: string): FuelLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = `${FUEL_LOGS_STORAGE_KEY_PREFIX}${userId}`;
    const data = localStorage.getItem(key);
    if (!data) return [];
    const parsed = JSON.parse(data) as FuelLogEntry[];
    return processFuelLogs(parsed);
  } catch (err) {
    console.error('Failed to read fuel logs from localStorage:', err);
    return [];
  }
}

export function saveFuelLogs(userId: string, logs: FuelLogEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${FUEL_LOGS_STORAGE_KEY_PREFIX}${userId}`;
    localStorage.setItem(key, JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to write fuel logs to localStorage:', err);
  }
}

export function addFuelLog(userId: string, entry: Omit<FuelLogEntry, 'id' | 'userId'>): FuelLogEntry {
  const existing = getSavedFuelLogs(userId);
  const newEntry: FuelLogEntry = {
    ...entry,
    id: `fuel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    pricePerUnit: entry.pricePerUnit || (entry.fuelQuantity > 0 ? Math.round((entry.cost / entry.fuelQuantity) * 100) / 100 : undefined),
  };

  const updated = [newEntry, ...existing];
  const processed = processFuelLogs(updated);
  saveFuelLogs(userId, processed);
  return newEntry;
}

export function deleteFuelLog(userId: string, entryId: string): FuelLogEntry[] {
  const existing = getSavedFuelLogs(userId);
  const filtered = existing.filter(e => e.id !== entryId);
  const processed = processFuelLogs(filtered);
  saveFuelLogs(userId, processed);
  return processed;
}

/**
 * LocalStorage storage helpers for Monthly Budget
 */
export function getSavedBudget(userId: string, monthYear?: string): MonthlyBudget {
  const currentMonthYear = monthYear || new Date().toISOString().slice(0, 7); // e.g. "2026-11"
  const defaultBudget: MonthlyBudget = {
    overallMonthlyLimit: 30000,
    commuteMonthlyLimit: 5000,
    foodMonthlyLimit: 8000,
    groceriesMonthlyLimit: 6000,
    monthYear: currentMonthYear,
  };

  if (typeof window === 'undefined') return defaultBudget;
  try {
    const key = `${BUDGET_STORAGE_KEY_PREFIX}${userId}_${currentMonthYear}`;
    const data = localStorage.getItem(key);
    if (!data) return defaultBudget;
    return { ...defaultBudget, ...JSON.parse(data) };
  } catch (err) {
    console.error('Failed to read budget from localStorage:', err);
    return defaultBudget;
  }
}

export function saveBudget(userId: string, budget: MonthlyBudget): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${BUDGET_STORAGE_KEY_PREFIX}${userId}_${budget.monthYear}`;
    localStorage.setItem(key, JSON.stringify(budget));
  } catch (err) {
    console.error('Failed to save budget to localStorage:', err);
  }
}

/**
 * Daily Commuter quick transaction presets
 */
export interface CommutePreset {
  id: string;
  name: string;
  icon: string;
  category: string;
  amount: number;
  description: string;
}

export const COMMUTE_PRESETS: CommutePreset[] = [
  { id: 'petrol_refill_500', name: 'Petrol ₹500', icon: '⛽', category: '16', amount: 500, description: 'Petrol refill' },
  { id: 'petrol_refill_1000', name: 'Petrol ₹1,000', icon: '⛽', category: '16', amount: 1000, description: 'Petrol refill' },
  { id: 'metro_ticket', name: 'Metro / Bus Ticket', icon: '🚇', category: '17', amount: 50, description: 'Metro / Bus commute' },
  { id: 'auto_rickshaw', name: 'Auto / Cab Ride', icon: '🛺', category: '17', amount: 120, description: 'Auto/Cab fare' },
  { id: 'parking_fee', name: 'Daily Parking', icon: '🅿️', category: '2', amount: 40, description: 'Office / Station parking' },
  { id: 'highway_toll', name: 'Highway Toll', icon: '🛣️', category: '2', amount: 85, description: 'Fastag / Highway Toll' },
  { id: 'chai_snack', name: 'Chai & Snacks', icon: '☕', category: '1', amount: 40, description: 'Daily commute tea & snack' },
  { id: 'daily_groceries', name: 'Daily Groceries', icon: '🛒', category: '18', amount: 250, description: 'Daily essentials & milk' },
];
