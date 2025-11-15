'use client';

import { MonthRecord } from '@/lib/types';
import { useMemo, useState } from 'react';

interface DataTableProps {
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

function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function exportToCSV(monthly: MonthRecord[]) {
  const headers = [
    'Month',
    'Rent Payment',
    'Rent CF',
    'Rent Disc CF',
    'Rent Cum NPV',
    'Mortgage Payment',
    'Mortgage Interest',
    'Mortgage Principal',
    'Mortgage Balance',
    'Property Tax',
    'Maintenance',
    'Insurance',
    'HOA',
    'Home Value',
    'Percentage Paid Off',
    'Equity',
    'Buy CF',
    'Buy Disc CF',
    'Buy Cum NPV',
    'Discount Factor',
  ];

  const rows = monthly.map((record) => [
    record.monthIndex,
    record.rentPayment,
    record.rentCF,
    record.rentDiscountedCF,
    record.rentCumulativeNPV,
    record.mortgagePayment,
    record.mortgageInterest,
    record.mortgagePrincipal,
    record.mortgageBalance,
    record.propertyTax,
    record.maintenance,
    record.insurance,
    record.hoa,
    record.homeValue,
    record.percentagePaidOff,
    record.equity,
    record.buyCF,
    record.buyDiscountedCF,
    record.buyCumulativeNPV,
    record.discountFactor,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'npv-mortgage-analysis.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}

function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between">
      <div className="text-sm text-gray-700">
        Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
        {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} months
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="px-4 py-2 text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function DataTable({ monthly }: DataTableProps) {
  const [buyPage, setBuyPage] = useState(1);
  const [rentPage, setRentPage] = useState(1);
  const itemsPerPage = 50;

  const buyPaginatedData = useMemo(() => {
    const start = (buyPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return monthly.slice(start, end);
  }, [monthly, buyPage]);

  const rentPaginatedData = useMemo(() => {
    const start = (rentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return monthly.slice(start, end);
  }, [monthly, rentPage]);

  const buyTotalPages = Math.ceil(monthly.length / itemsPerPage);
  const rentTotalPages = Math.ceil(monthly.length / itemsPerPage);

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Month-by-Month Details</h3>
        <button
          onClick={() => exportToCSV(monthly)}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Export to CSV
        </button>
      </div>

      {/* Buy Scenario Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h4 className="text-lg font-semibold mb-4">Buy Scenario</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-3 text-left font-medium text-gray-700">Month</th>
                <th className="px-3 py-3 text-right font-medium text-gray-700">Mortgage Pmt</th>
                <th className="px-3 py-3 text-right font-medium text-gray-700">Mortgage Int</th>
                <th className="px-3 py-3 text-right font-medium text-gray-700">Mortgage Prin</th>
                <th className="px-3 py-3 text-right font-medium text-gray-700">Mortgage Bal</th>
                <th className="px-3 py-3 text-right font-medium text-gray-700">Prop Tax</th>
                <th className="px-3 py-3 text-right font-medium text-gray-700">Maint</th>
                <th className="px-3 py-3 text-right font-medium text-gray-700">Insurance</th>
                <th className="px-3 py-3 text-right font-medium text-gray-700">HOA</th>
                <th className="px-3 py-3 text-right font-medium text-gray-700">Home Value</th>
                <th className="px-3 py-3 text-right font-medium text-gray-700">% Paid Off</th>
                <th className="px-3 py-3 text-right font-medium text-gray-700">Equity</th>
                <th className="px-3 py-3 text-right font-medium text-gray-700">Buy CF</th>
                <th className="px-3 py-3 text-right font-medium text-gray-700">NPV (Month)</th>
                <th className="px-3 py-3 text-right font-medium text-gray-700">Cumulative NPV</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {buyPaginatedData.map((record) => (
                <tr key={record.monthIndex} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-900">{record.monthIndex}</td>
                  <td className="px-3 py-2 text-right text-gray-900">
                    {formatCurrency(record.mortgagePayment)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900">
                    {formatCurrency(record.mortgageInterest)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900">
                    {formatCurrency(record.mortgagePrincipal)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900">
                    {formatCurrency(record.mortgageBalance)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900">
                    {formatCurrency(record.propertyTax)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900">
                    {formatCurrency(record.maintenance)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900">
                    {formatCurrency(record.insurance)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900">
                    {formatCurrency(record.hoa)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900">
                    {formatCurrency(record.homeValue)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900">
                    {formatNumber(record.percentagePaidOff * 100, 1)}%
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900 font-medium">
                    {formatCurrency(record.equity)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900">
                    {formatCurrency(record.buyCF)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900">
                    {formatCurrency(record.buyDiscountedCF)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-bold ${
                      record.buyCumulativeNPV >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(record.buyCumulativeNPV)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          currentPage={buyPage}
          totalPages={buyTotalPages}
          totalItems={monthly.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setBuyPage}
        />
      </div>

      {/* Rent Scenario Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h4 className="text-lg font-semibold mb-4">Rent Scenario</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-3 text-left font-medium text-gray-700">Month</th>
                <th className="px-3 py-3 text-right font-medium text-gray-700">Rent Payment</th>
                <th className="px-3 py-3 text-right font-medium text-gray-700">Rent CF</th>
                <th className="px-3 py-3 text-right font-medium text-gray-700">NPV (Month)</th>
                <th className="px-3 py-3 text-right font-medium text-gray-700">Cumulative NPV</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rentPaginatedData.map((record) => (
                <tr key={record.monthIndex} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-900">{record.monthIndex}</td>
                  <td className="px-3 py-2 text-right text-gray-900">
                    {formatCurrency(record.rentPayment)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900">
                    {formatCurrency(record.rentCF)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900">
                    {formatCurrency(record.rentDiscountedCF)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-bold ${
                      record.rentCumulativeNPV >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(record.rentCumulativeNPV)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          currentPage={rentPage}
          totalPages={rentTotalPages}
          totalItems={monthly.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setRentPage}
        />
      </div>
    </div>
  );
}
