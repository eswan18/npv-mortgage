'use client';

import { Inputs } from '@/lib/types';
import { getDefaultInputs as getDefaults } from '@/lib/calculator';

interface InputFormProps {
  inputs: Inputs;
  onChange: (inputs: Inputs) => void;
}

export default function InputForm({ inputs, onChange }: InputFormProps) {
  const handleChange = (field: keyof Inputs, value: number | string | null | boolean) => {
    onChange({ ...inputs, [field]: value });
  };

  const handleReset = () => {
    onChange(getDefaults());
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Input Parameters</h2>
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

      <div className="space-y-6">
        {/* Global Assumptions */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">Global Assumptions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Analysis Years
              </label>
              <input
                type="number"
                value={inputs.analysisYears}
                onChange={(e) => handleChange('analysisYears', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Discount Rate (Annual %)
              </label>
              <input
                type="number"
                step="0.001"
                value={inputs.discountRateAnnual * 100}
                onChange={(e) => handleChange('discountRateAnnual', (parseFloat(e.target.value) || 0) / 100)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date (optional)
              </label>
              <input
                type="date"
                value={inputs.startDate || ''}
                onChange={(e) => handleChange('startDate', e.target.value || null)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Buy Scenario */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">Buy Scenario</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Home Price ($)
              </label>
              <input
                type="number"
                value={inputs.homePrice}
                onChange={(e) => handleChange('homePrice', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Down Payment (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={inputs.downPaymentPercent * 100}
                onChange={(e) => handleChange('downPaymentPercent', (parseFloat(e.target.value) || 0) / 100)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Mortgage Rate (Annual %)
              </label>
              <input
                type="number"
                step="0.001"
                value={inputs.mortgageRateAnnual * 100}
                onChange={(e) => handleChange('mortgageRateAnnual', (parseFloat(e.target.value) || 0) / 100)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Mortgage Term (Years)
              </label>
              <input
                type="number"
                value={inputs.mortgageTermYears}
                onChange={(e) => handleChange('mortgageTermYears', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                HOA Monthly ($)
              </label>
              <input
                type="number"
                value={inputs.hoaMonthly}
                onChange={(e) => handleChange('hoaMonthly', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Property Tax Rate (Annual %)
              </label>
              <input
                type="number"
                step="0.001"
                value={inputs.propertyTaxRateAnnual * 100}
                onChange={(e) => handleChange('propertyTaxRateAnnual', (parseFloat(e.target.value) || 0) / 100)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Insurance (Annual $)
              </label>
              <input
                type="number"
                value={inputs.insuranceAnnual}
                onChange={(e) => handleChange('insuranceAnnual', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Maintenance Rate (Annual %)
              </label>
              <input
                type="number"
                step="0.001"
                value={inputs.maintenanceRateAnnual * 100}
                onChange={(e) => handleChange('maintenanceRateAnnual', (parseFloat(e.target.value) || 0) / 100)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Home Appreciation (Annual %)
              </label>
              <input
                type="number"
                step="0.001"
                value={inputs.homeAppreciationRateAnnual * 100}
                onChange={(e) => handleChange('homeAppreciationRateAnnual', (parseFloat(e.target.value) || 0) / 100)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Closing Costs ($)
              </label>
              <input
                type="number"
                value={inputs.closingCosts || 0}
                onChange={(e) => handleChange('closingCosts', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Loan Fees ($)
              </label>
              <input
                type="number"
                value={inputs.loanFees || 0}
                onChange={(e) => handleChange('loanFees', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Rent Scenario */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">Rent Scenario</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Initial Monthly Rent ($)
              </label>
              <input
                type="number"
                value={inputs.initialMonthlyRent}
                onChange={(e) => handleChange('initialMonthlyRent', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Rent Inflation (Annual %)
              </label>
              <input
                type="number"
                step="0.001"
                value={inputs.rentInflationRateAnnual * 100}
                onChange={(e) => handleChange('rentInflationRateAnnual', (parseFloat(e.target.value) || 0) / 100)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Renter Insurance Monthly ($)
              </label>
              <input
                type="number"
                value={inputs.renterInsuranceMonthly || 0}
                onChange={(e) => handleChange('renterInsuranceMonthly', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Other Rent Costs Monthly ($)
              </label>
              <input
                type="number"
                value={inputs.otherRentCostsMonthly || 0}
                onChange={(e) => handleChange('otherRentCostsMonthly', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
