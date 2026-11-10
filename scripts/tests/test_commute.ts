import { calculateCommuteCost, processFuelLogs } from '../../src/lib/commute';
import { FuelLogEntry } from '../../src/types';

function runTests() {
  console.log('Running Commute & Fuel Math Tests...');

  // Test 1: calculateCommuteCost
  const estimate = calculateCommuteCost({
    oneWayDistanceKm: 20,
    tripsPerDay: 2, // 40 km/day
    daysPerMonth: 20, // 800 km/month
    fuelPrice: 100, // ₹100/L
    vehicleMileage: 40, // 40 km/L -> 1L/day -> ₹100/day
    parkingDaily: 30, // ₹30/day -> ₹130/day
    tollDaily: 20, // ₹20/day -> ₹150/day
  });

  console.assert(estimate.dailyFuelCost === 100, `Expected dailyFuelCost 100, got ${estimate.dailyFuelCost}`);
  console.assert(estimate.dailyTotalCost === 150, `Expected dailyTotalCost 150, got ${estimate.dailyTotalCost}`);
  console.assert(estimate.monthlyFuelCost === 2000, `Expected monthlyFuelCost 2000, got ${estimate.monthlyFuelCost}`);
  console.assert(estimate.monthlyTotalCost === 3000, `Expected monthlyTotalCost 3000, got ${estimate.monthlyTotalCost}`);
  console.assert(estimate.totalMonthlyDistanceKm === 800, `Expected distance 800, got ${estimate.totalMonthlyDistanceKm}`);
  console.assert(estimate.costPerKm === 3.75, `Expected costPerKm 3.75, got ${estimate.costPerKm}`);
  console.log('✔ Test 1: calculateCommuteCost passed');

  // Test 2: processFuelLogs mileage & costPerKm calculations
  const sampleLogs: FuelLogEntry[] = [
    {
      id: '1',
      userId: 'u1',
      date: '2026-11-01',
      fuelType: 'petrol',
      odometer: 10000,
      fuelQuantity: 10,
      cost: 1000,
      fullTank: true,
    },
    {
      id: '2',
      userId: 'u1',
      date: '2026-11-10',
      fuelType: 'petrol',
      odometer: 10450, // 450 km difference
      fuelQuantity: 10, // 10 L used -> 45 km/L
      cost: 1050, // 1050 / 450 = 2.33 / km
      fullTank: true,
    },
  ];

  const processed = processFuelLogs(sampleLogs);
  // processed is sorted descending (latest first)
  console.assert(processed[0].id === '2', `Expected latest log first, got ${processed[0].id}`);
  console.assert(processed[0].mileage === 45, `Expected mileage 45, got ${processed[0].mileage}`);
  console.assert(processed[0].costPerKm === 2.33, `Expected costPerKm 2.33, got ${processed[0].costPerKm}`);
  console.assert(processed[0].pricePerUnit === 105, `Expected pricePerUnit 105, got ${processed[0].pricePerUnit}`);
  console.log('✔ Test 2: processFuelLogs passed');

  console.log('All automated math & commuter tests passed successfully!');
}

runTests();
