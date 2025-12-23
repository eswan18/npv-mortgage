import { Inputs, MonthRecord, ModelResult, Summary } from './types';

/**
 * Convert annual rate to monthly rate using compound interest formula
 * (1 + annual)^(1/12) - 1
 */
export function annualToMonthly(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

/**
 * Calculate monthly mortgage payment using PMT formula
 * PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
 * where P = loan amount, r = monthly rate, n = number of payments
 * Special case: if rate is 0, payment = loan amount / number of payments
 */
export function calculateMortgagePayment(
  loanAmount: number,
  monthlyRate: number,
  numPayments: number
): number {
  if (monthlyRate === 0) {
    return loanAmount / numPayments;
  }
  return (
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  );
}

/**
 * Calculate discount factor for a given period
 * DF = 1 / (1 + r)^n
 */
export function calculateDiscountFactor(
  monthlyRate: number,
  periodIndex: number
): number {
  return 1 / Math.pow(1 + monthlyRate, periodIndex);
}

/**
 * Calculate mortgage amortization for a single period
 * Returns { interest, principal, newBalance }
 */
export function calculateAmortizationStep(
  currentBalance: number,
  monthlyPayment: number,
  monthlyRate: number
): { interest: number; principal: number; newBalance: number } {
  if (currentBalance <= 0) {
    return { interest: 0, principal: 0, newBalance: 0 };
  }

  const interest = currentBalance * monthlyRate;
  let principal = monthlyPayment - interest;

  // Ensure we don't overpay in final month
  if (principal > currentBalance) {
    principal = currentBalance;
  }

  const newBalance = Math.max(0, currentBalance - principal);

  return { interest, principal, newBalance };
}

/**
 * Calculate equity (net worth in the home)
 * Equity = Home Value - Remaining Loan Balance
 *
 * This correctly accounts for the fact that you own the entire home
 * (not just a percentage), and the loan is a liability against it.
 * All appreciation accrues to you, regardless of how much you've paid off.
 */
export function calculateEquity(
  originalLoanAmount: number,
  currentBalance: number,
  currentHomeValue: number
): number {
  return currentHomeValue - currentBalance;
}

/**
 * Main calculation function
 */
export function runModel(inputs: Inputs): ModelResult {
  // Derived constants
  const months = inputs.analysisYears * 12;

  const discountRateMonthly = annualToMonthly(inputs.discountRateAnnual);
  const mortgageRateMonthly = annualToMonthly(inputs.mortgageRateAnnual);
  const rentInflationRateMonthly = annualToMonthly(
    inputs.rentInflationRateAnnual
  );
  const homeAppreciationRateMonthly = annualToMonthly(
    inputs.homeAppreciationRateAnnual
  );
  const propertyTaxRateMonthly = inputs.propertyTaxRateAnnual / 12;
  const maintenanceRateMonthly = inputs.maintenanceRateAnnual / 12;
  const insuranceMonthly = inputs.insuranceAnnual / 12;

  const loanAmount = inputs.homePrice * (1 - inputs.downPaymentPercent);
  const downPayment = inputs.homePrice * inputs.downPaymentPercent;
  const closingCosts = inputs.closingCosts || 0;
  const loanFees = inputs.loanFees || 0;
  const renterInsuranceMonthly = inputs.renterInsuranceMonthly || 0;
  const otherRentCostsMonthly = inputs.otherRentCostsMonthly || 0;

  // Mortgage amortization
  const mortgageTermMonths = inputs.mortgageTermYears * 12;
  const mortgagePayment =
    mortgageTermMonths > 0
      ? calculateMortgagePayment(loanAmount, mortgageRateMonthly, mortgageTermMonths)
      : 0;

  // Initialize arrays
  const monthly: MonthRecord[] = [];
  const mortgageBalances: number[] = new Array(months + 1).fill(0);
  const homeValues: number[] = new Array(months + 1).fill(0);
  const rentPayments: number[] = new Array(months + 1).fill(0);

  // Initialize mortgage balance
  mortgageBalances[0] = loanAmount;

  // Calculate home values and rent payments for each month
  for (let i = 0; i <= months; i++) {
    homeValues[i] =
      inputs.homePrice * Math.pow(1 + homeAppreciationRateMonthly, i);
    rentPayments[i] =
      inputs.initialMonthlyRent *
      Math.pow(1 + rentInflationRateMonthly, i);
  }

  // Calculate discount factors
  const discountFactors: number[] = new Array(months + 1).fill(1);
  for (let i = 1; i <= months; i++) {
    discountFactors[i] = 1 / Math.pow(1 + discountRateMonthly, i);
  }

  // Month 0 - Initial cash flows
  // Outflows are negative
  const buyCF0 = -(downPayment + closingCosts + loanFees);
  const rentCF0 = 0;

  // Calculate equity for month 0
  const equity0 = calculateEquity(loanAmount, mortgageBalances[0], homeValues[0]);
  const percentagePaidOff0 = loanAmount > 0
    ? (loanAmount - mortgageBalances[0]) / loanAmount
    : 1; // If no loan, 100% paid off

  // Discounted cash flows
  const buyDiscountedCF0 = buyCF0 * discountFactors[0];
  const rentDiscountedCF0 = rentCF0 * discountFactors[0];

  // NPV at month 0 = cash flow + discounted equity value
  const discountedEquity0 = equity0 * discountFactors[0];
  const buyCumulativeNPV0 = buyDiscountedCF0 + discountedEquity0;

  monthly.push({
    monthIndex: 0,
    rentPayment: rentPayments[0],
    rentCF: rentCF0,
    rentDiscountedCF: rentDiscountedCF0,
    rentCumulativeNPV: rentDiscountedCF0,
    mortgagePayment: 0,
    mortgageInterest: 0,
    mortgagePrincipal: 0,
    mortgageBalance: mortgageBalances[0],
    propertyTax: 0,
    maintenance: 0,
    insurance: 0,
    hoa: 0,
    homeValue: homeValues[0],
    percentagePaidOff: percentagePaidOff0,
    equity: equity0,
    buyCF: buyCF0, // Just the cash out
    buyDiscountedCF: buyDiscountedCF0,
    buyCumulativeNPV: buyCumulativeNPV0, // Cash flows + discounted equity
    discountFactor: discountFactors[0],
  });

  // Months 1 to months
  let buyCumulativeNPV = buyDiscountedCF0;
  let rentCumulativeNPV = rentDiscountedCF0;

  for (let i = 1; i <= months; i++) {
    // Mortgage calculations
    let mortgagePaymentThisMonth = 0;
    let mortgageInterest = 0;
    let mortgagePrincipal = 0;

    if (i <= mortgageTermMonths && mortgageBalances[i - 1] > 0) {
      mortgagePaymentThisMonth = mortgagePayment;
      mortgageInterest = mortgageBalances[i - 1] * mortgageRateMonthly;
      mortgagePrincipal = mortgagePaymentThisMonth - mortgageInterest;

      // Ensure we don't overpay in final month
      if (mortgagePrincipal > mortgageBalances[i - 1]) {
        mortgagePrincipal = mortgageBalances[i - 1];
        mortgagePaymentThisMonth = mortgageInterest + mortgagePrincipal;
      }

      mortgageBalances[i] = mortgageBalances[i - 1] - mortgagePrincipal;
    } else {
      mortgageBalances[i] = 0;
    }

    // Operating costs
    const propertyTax = homeValues[i] * propertyTaxRateMonthly;
    const maintenance = homeValues[i] * maintenanceRateMonthly;
    const insurance = insuranceMonthly;
    const hoa = inputs.hoaMonthly;

    // Operating costs (outflows are negative)
    const buyOperatingOutflow = -(
      mortgagePaymentThisMonth +
      propertyTax +
      maintenance +
      insurance +
      hoa
    );

    // Buy cash flow: just the actual cash outflows (no equity change)
    const buyCF = buyOperatingOutflow;

    // Rent cash flow (outflows are negative)
    const rentCF = -(rentPayments[i] + renterInsuranceMonthly + otherRentCostsMonthly);

    // Calculate equity: home value - remaining loan balance
    // This is a STOCK (balance), not a FLOW (monthly change)
    const equity = calculateEquity(loanAmount, mortgageBalances[i], homeValues[i]);
    const percentagePaidOff = loanAmount > 0
      ? (loanAmount - mortgageBalances[i]) / loanAmount
      : 1; // If no loan, 100% paid off

    // Discounted cash flows (just actual cash, not equity changes)
    const buyDiscountedCF = buyCF * discountFactors[i];
    const rentDiscountedCF = rentCF * discountFactors[i];

    // Cumulative NPV of cash flows
    buyCumulativeNPV += buyDiscountedCF;
    rentCumulativeNPV += rentDiscountedCF;

    // Add discounted equity value (terminal/liquidation value at this point)
    const discountedEquity = equity * discountFactors[i];
    const buyCumulativeNPVWithEquity = buyCumulativeNPV + discountedEquity;

    monthly.push({
      monthIndex: i,
      rentPayment: rentPayments[i],
      rentCF,
      rentDiscountedCF,
      rentCumulativeNPV,
      mortgagePayment: mortgagePaymentThisMonth,
      mortgageInterest,
      mortgagePrincipal,
      mortgageBalance: mortgageBalances[i],
      propertyTax,
      maintenance,
      insurance,
      hoa,
      homeValue: homeValues[i],
      percentagePaidOff,
      equity,
      buyCF, // Just the cash flow, not including equity change
      buyDiscountedCF,
      buyCumulativeNPV: buyCumulativeNPVWithEquity, // Cash flows + discounted equity
      discountFactor: discountFactors[i],
    });
  }

  // Calculate break-even
  // Break-even is when buying becomes better (less negative) than renting
  // With correct signs: buyCumulativeNPV >= rentCumulativeNPV means buying is better
  let breakEvenMonthIndex: number | undefined;
  let breakEvenYears: number | undefined;
  for (let i = 0; i <= months; i++) {
    if (monthly[i].buyCumulativeNPV >= monthly[i].rentCumulativeNPV) {
      breakEvenMonthIndex = i;
      breakEvenYears = i / 12;
      break;
    }
  }

  // Final NPV from the last month (includes all cash flows + terminal equity)
  const finalBuyNPV = monthly[monthly.length - 1].buyCumulativeNPV;

  const summary: Summary = {
    months,
    buyTotalNPV: finalBuyNPV,
    rentTotalNPV: rentCumulativeNPV,
    npvDifference: rentCumulativeNPV - finalBuyNPV,
    breakEvenMonthIndex,
    breakEvenYears,
  };

  return {
    inputs,
    monthly,
    summary,
  };
}

/**
 * Default input values
 */
export function getDefaultInputs(): Inputs {
  return {
    analysisYears: 30,
    discountRateAnnual: 0.05,
    homePrice: 500000,
    downPaymentPercent: 0.2,
    mortgageRateAnnual: 0.06,
    mortgageTermYears: 30,
    hoaMonthly: 0,
    propertyTaxRateAnnual: 0.01,
    insuranceAnnual: 2000,
    maintenanceRateAnnual: 0.01,
    homeAppreciationRateAnnual: 0.03,
    closingCosts: 0,
    loanFees: 0,
    includeOpportunityCost: false,
    investmentReturnAnnual: 0.07,
    initialMonthlyRent: 2000,
    rentInflationRateAnnual: 0.03,
    renterInsuranceMonthly: 0,
    otherRentCostsMonthly: 0,
  };
}

