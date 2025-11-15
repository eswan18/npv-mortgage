'use client';

import { Inputs } from '@/lib/types';
import { getDefaultInputs as getDefaults } from '@/lib/calculator';

interface InputFormProps {
  inputs: Inputs;
  onChange: (inputs: Inputs) => void;
}

export default function InputForm({ inputs, onChange }: InputFormProps) {
  // Helper function to round to avoid floating point errors
  const roundToPrecision = (value: number, decimals: number = 6): number => {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  };

  // Helper to convert percentage display value to decimal storage value
  const percentageToDecimal = (value: string): number => {
    const num = parseFloat(value) || 0;
    return roundToPrecision(num / 100, 6);
  };

  // Helper to convert decimal storage value to percentage display value
  const decimalToPercentage = (value: number): number => {
    return roundToPrecision(value * 100, 3);
  };

  const handleChange = (field: keyof Inputs, value: number | string | null | boolean) => {
    // Round numeric values to avoid floating point errors
    if (typeof value === 'number') {
      value = roundToPrecision(value, 6);
    }
    onChange({ ...inputs, [field]: value });
  };

  const handleNumberChange = (field: keyof Inputs, value: string) => {
    // Handle leading zeros: remove leading zeros unless it's a decimal like "0.04"
    let cleanedValue = value.trim();
    
    // If value starts with "0" followed by digits (not "0."), remove leading zeros
    // Examples: "07" -> "7", "007" -> "7", but "0.7" stays "0.7", "0.04" stays "0.04"
    if (cleanedValue.match(/^0+[1-9]/) && !cleanedValue.startsWith('0.')) {
      cleanedValue = cleanedValue.replace(/^0+/, '');
    }
    
    // If value is just "0" or empty, keep it as 0
    if (cleanedValue === '' || cleanedValue === '0') {
      handleChange(field, 0);
      return;
    }
    
    const num = parseFloat(cleanedValue);
    if (!isNaN(num)) {
      handleChange(field, num);
    }
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
                onChange={(e) => handleNumberChange('analysisYears', e.target.value)}
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
                value={decimalToPercentage(inputs.discountRateAnnual)}
                onChange={(e) => handleChange('discountRateAnnual', percentageToDecimal(e.target.value))}
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
                onChange={(e) => handleNumberChange('homePrice', e.target.value)}
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
                value={decimalToPercentage(inputs.downPaymentPercent)}
                onChange={(e) => handleChange('downPaymentPercent', percentageToDecimal(e.target.value))}
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
                value={decimalToPercentage(inputs.mortgageRateAnnual)}
                onChange={(e) => handleChange('mortgageRateAnnual', percentageToDecimal(e.target.value))}
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
                onChange={(e) => handleNumberChange('hoaMonthly', e.target.value)}
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
                value={decimalToPercentage(inputs.propertyTaxRateAnnual)}
                onChange={(e) => handleChange('propertyTaxRateAnnual', percentageToDecimal(e.target.value))}
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
                onChange={(e) => handleNumberChange('insuranceAnnual', e.target.value)}
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
                value={decimalToPercentage(inputs.maintenanceRateAnnual)}
                onChange={(e) => handleChange('maintenanceRateAnnual', percentageToDecimal(e.target.value))}
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
                value={decimalToPercentage(inputs.homeAppreciationRateAnnual)}
                onChange={(e) => handleChange('homeAppreciationRateAnnual', percentageToDecimal(e.target.value))}
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
                onChange={(e) => handleNumberChange('closingCosts', e.target.value)}
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
                onChange={(e) => handleNumberChange('loanFees', e.target.value)}
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
                onChange={(e) => handleNumberChange('initialMonthlyRent', e.target.value)}
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
                value={decimalToPercentage(inputs.rentInflationRateAnnual)}
                onChange={(e) => handleChange('rentInflationRateAnnual', percentageToDecimal(e.target.value))}
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
                onChange={(e) => handleNumberChange('renterInsuranceMonthly', e.target.value)}
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
                onChange={(e) => handleNumberChange('otherRentCostsMonthly', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
