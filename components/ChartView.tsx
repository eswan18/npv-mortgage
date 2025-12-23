'use client';

import { MonthRecord } from '@/lib/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartViewProps {
  monthly: MonthRecord[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ChartView({ monthly }: ChartViewProps) {
  const chartData = monthly.map((record) => ({
    month: record.monthIndex,
    year: (record.monthIndex / 12).toFixed(1),
    buyNPV: record.buyCumulativeNPV,
    rentNPV: record.rentCumulativeNPV,
  }));

  // Calculate shared y-axis domain from both datasets
  const allNPVValues = monthly.flatMap((r) => [
    r.buyCumulativeNPV,
    r.rentCumulativeNPV,
  ]);
  const minNPV = Math.min(...allNPVValues);
  const maxNPV = Math.max(...allNPVValues);
  // Add some padding (5% on each side, or minimum 1000 if range is very small)
  const range = maxNPV - minNPV;
  const padding = range > 0 ? range * 0.05 : Math.abs(minNPV) * 0.05 || 1000;
  const yAxisDomain = [minNPV - padding, maxNPV + padding];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold mb-4">Cumulative NPV Over Time</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            label={{ value: 'Month', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            domain={yAxisDomain}
            tickFormatter={(value) => formatCurrency(value)}
            label={{ value: 'Cumulative NPV', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''}
            labelFormatter={(label) => `Month ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="buyNPV"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Buy NPV"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="rentNPV"
            stroke="#ef4444"
            strokeWidth={2}
            name="Rent NPV"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

