import { Inputs } from './types';
import { getDefaultInputs } from './calculator';

/**
 * Serialize Inputs object to URL search parameters
 */
export function serializeInputsToParams(inputs: Inputs): URLSearchParams {
  const params = new URLSearchParams();

  // Global
  params.set('analysisYears', inputs.analysisYears.toString());
  params.set('discountRateAnnual', inputs.discountRateAnnual.toString());

  // Buy scenario
  params.set('homePrice', inputs.homePrice.toString());
  params.set('downPaymentPercent', inputs.downPaymentPercent.toString());
  params.set('mortgageRateAnnual', inputs.mortgageRateAnnual.toString());
  params.set('mortgageTermYears', inputs.mortgageTermYears.toString());
  params.set('hoaMonthly', inputs.hoaMonthly.toString());
  params.set('propertyTaxRateAnnual', inputs.propertyTaxRateAnnual.toString());
  params.set('insuranceAnnual', inputs.insuranceAnnual.toString());
  params.set('maintenanceRateAnnual', inputs.maintenanceRateAnnual.toString());
  params.set('homeAppreciationRateAnnual', inputs.homeAppreciationRateAnnual.toString());

  if (inputs.closingCosts !== undefined && inputs.closingCosts !== 0) {
    params.set('closingCosts', inputs.closingCosts.toString());
  }
  if (inputs.loanFees !== undefined && inputs.loanFees !== 0) {
    params.set('loanFees', inputs.loanFees.toString());
  }

  // Rent scenario
  params.set('initialMonthlyRent', inputs.initialMonthlyRent.toString());
  params.set('rentInflationRateAnnual', inputs.rentInflationRateAnnual.toString());

  if (inputs.renterInsuranceMonthly !== undefined && inputs.renterInsuranceMonthly !== 0) {
    params.set('renterInsuranceMonthly', inputs.renterInsuranceMonthly.toString());
  }
  if (inputs.otherRentCostsMonthly !== undefined && inputs.otherRentCostsMonthly !== 0) {
    params.set('otherRentCostsMonthly', inputs.otherRentCostsMonthly.toString());
  }

  return params;
}

/**
 * Deserialize URL search parameters to Inputs object
 * Falls back to defaults for missing or invalid values
 */
export function deserializeParamsToInputs(params: URLSearchParams): Inputs {
  const defaults = getDefaultInputs();

  const parseNumber = (key: string, defaultValue: number): number => {
    const value = params.get(key);
    if (value === null) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  const parseOptionalNumber = (key: string, defaultValue: number | undefined): number | undefined => {
    const value = params.get(key);
    if (value === null) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  return {
    // Global
    analysisYears: parseNumber('analysisYears', defaults.analysisYears),
    discountRateAnnual: parseNumber('discountRateAnnual', defaults.discountRateAnnual),

    // Buy scenario
    homePrice: parseNumber('homePrice', defaults.homePrice),
    downPaymentPercent: parseNumber('downPaymentPercent', defaults.downPaymentPercent),
    mortgageRateAnnual: parseNumber('mortgageRateAnnual', defaults.mortgageRateAnnual),
    mortgageTermYears: parseNumber('mortgageTermYears', defaults.mortgageTermYears),
    hoaMonthly: parseNumber('hoaMonthly', defaults.hoaMonthly),
    propertyTaxRateAnnual: parseNumber('propertyTaxRateAnnual', defaults.propertyTaxRateAnnual),
    insuranceAnnual: parseNumber('insuranceAnnual', defaults.insuranceAnnual),
    maintenanceRateAnnual: parseNumber('maintenanceRateAnnual', defaults.maintenanceRateAnnual),
    homeAppreciationRateAnnual: parseNumber('homeAppreciationRateAnnual', defaults.homeAppreciationRateAnnual),
    closingCosts: parseOptionalNumber('closingCosts', defaults.closingCosts),
    loanFees: parseOptionalNumber('loanFees', defaults.loanFees),
    includeOpportunityCost: defaults.includeOpportunityCost,
    investmentReturnAnnual: defaults.investmentReturnAnnual,

    // Rent scenario
    initialMonthlyRent: parseNumber('initialMonthlyRent', defaults.initialMonthlyRent),
    rentInflationRateAnnual: parseNumber('rentInflationRateAnnual', defaults.rentInflationRateAnnual),
    renterInsuranceMonthly: parseOptionalNumber('renterInsuranceMonthly', defaults.renterInsuranceMonthly),
    otherRentCostsMonthly: parseOptionalNumber('otherRentCostsMonthly', defaults.otherRentCostsMonthly),
  };
}

