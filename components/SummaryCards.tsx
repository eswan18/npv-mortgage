'use client';

import { Summary } from '@/lib/types';

interface SummaryCardsProps {
  summary: Summary;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  // npvDifference = rentTotalNPV - buyTotalNPV
  // If negative: buying is better (buy NPV is less negative/higher)
  // If positive: renting is better (rent NPV is less negative/higher)
  const isBuyBetter = summary.npvDifference < 0;
  const advantage = Math.abs(summary.npvDifference);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Buy Total NPV</h3>
        <p className="text-2xl font-bold text-gray-900">
          {formatCurrency(summary.buyTotalNPV)}
        </p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Rent Total NPV</h3>
        <p className="text-2xl font-bold text-gray-900">
          {formatCurrency(summary.rentTotalNPV)}
        </p>
      </div>
      <div className={`bg-white p-6 rounded-lg shadow-sm border-2 ${
        isBuyBetter ? 'border-green-500' : 'border-red-500'
      }`}>
        <h3 className="text-sm font-medium text-gray-500 mb-2">
          Advantage ({isBuyBetter ? 'Buy' : 'Rent'})
        </h3>
        <p className={`text-2xl font-bold ${
          isBuyBetter ? 'text-green-600' : 'text-red-600'
        }`}>
          {formatCurrency(advantage)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {isBuyBetter
            ? 'Buying is cheaper on NPV basis'
            : 'Renting is cheaper on NPV basis'}
        </p>
      </div>
      {summary.breakEvenMonthIndex !== undefined && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 md:col-span-3">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Break-Even Point</h3>
          <p className="text-xl font-semibold text-gray-900">
            Month {summary.breakEvenMonthIndex} ({summary.breakEvenYears?.toFixed(1)} years)
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Point where buying becomes cheaper than renting on NPV basis
          </p>
        </div>
      )}
    </div>
  );
}

