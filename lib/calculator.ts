import { Inputs, MonthRecord, ModelResult, Summary } from './types';

/**
 * Convert annual rate to monthly rate
 */
function annualToMonthly(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

/**
 * Calculate monthly mortgage payment using PMT formula
 */
function calculateMortgagePayment(
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
 * Main calculation function
 */
export function runModel(inputs: Inputs): ModelResult {
  // Derived constants
  const months = inputs.analysisYears * 12;
  const sellMonthIndex =
    inputs.sellAfterYears != null
      ? inputs.sellAfterYears * 12
      : months;

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

  const buyDiscountedCF0 = buyCF0 * discountFactors[0];
  const rentDiscountedCF0 = rentCF0 * discountFactors[0];

  monthly.push({
    monthIndex: 0,
    date: inputs.startDate || undefined,
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
    saleProceeds: 0,
    buyCF: buyCF0,
    buyDiscountedCF: buyDiscountedCF0,
    buyCumulativeNPV: buyDiscountedCF0,
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

    // Sale proceeds (only in sell month)
    // Sale proceeds are positive (inflow)
    let saleProceeds = 0;
    if (i === sellMonthIndex) {
      const remainingLoanBalance = mortgageBalances[i];
      const grossSale = homeValues[i];
      const sellingCosts =
        grossSale * inputs.sellingCostPercentOfHomeValue;
      const netSaleProceeds = grossSale - sellingCosts - remainingLoanBalance;
      saleProceeds = netSaleProceeds; // positive (inflow)
    }

    // Buy cash flow: negative outflows + positive sale proceeds
    const buyCF = buyOperatingOutflow + saleProceeds;

    // Rent cash flow (outflows are negative)
    const rentCF = -(rentPayments[i] + renterInsuranceMonthly + otherRentCostsMonthly);

    // Discounted cash flows
    const buyDiscountedCF = buyCF * discountFactors[i];
    const rentDiscountedCF = rentCF * discountFactors[i];

    // Cumulative NPV
    buyCumulativeNPV += buyDiscountedCF;
    rentCumulativeNPV += rentDiscountedCF;

    // Calculate date if startDate provided
    let date: string | undefined;
    if (inputs.startDate) {
      const start = new Date(inputs.startDate);
      start.setMonth(start.getMonth() + i);
      date = start.toISOString().split('T')[0];
    }

    monthly.push({
      monthIndex: i,
      date,
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
      saleProceeds,
      buyCF,
      buyDiscountedCF,
      buyCumulativeNPV,
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

  const summary: Summary = {
    months,
    buyTotalNPV: buyCumulativeNPV,
    rentTotalNPV: rentCumulativeNPV,
    npvDifference: rentCumulativeNPV - buyCumulativeNPV,
    sellMonthIndex,
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
    startDate: null,
    homePrice: 500000,
    downPaymentPercent: 0.2,
    mortgageRateAnnual: 0.06,
    mortgageTermYears: 30,
    hoaMonthly: 0,
    propertyTaxRateAnnual: 0.01,
    insuranceAnnual: 2000,
    maintenanceRateAnnual: 0.01,
    homeAppreciationRateAnnual: 0.03,
    sellingCostPercentOfHomeValue: 0.06,
    sellAfterYears: null,
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

