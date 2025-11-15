export type Inputs = {
  // Global
  analysisYears: number;
  discountRateAnnual: number;
  startDate?: string | null;

  // Buy scenario
  homePrice: number;
  downPaymentPercent: number;
  mortgageRateAnnual: number;
  mortgageTermYears: number;
  hoaMonthly: number;
  propertyTaxRateAnnual: number;
  insuranceAnnual: number;
  maintenanceRateAnnual: number;
  homeAppreciationRateAnnual: number;
  sellingCostPercentOfHomeValue: number;
  sellAfterYears?: number | null;
  closingCosts?: number;
  loanFees?: number;
  includeOpportunityCost?: boolean;
  investmentReturnAnnual?: number;

  // Rent scenario
  initialMonthlyRent: number;
  rentInflationRateAnnual: number;
  renterInsuranceMonthly?: number;
  otherRentCostsMonthly?: number;
};

export type MonthRecord = {
  monthIndex: number; // 0..months
  date?: string; // optional, ISO date if startDate given
  // Rent
  rentPayment: number; // before extras
  rentCF: number;
  rentDiscountedCF: number;
  rentCumulativeNPV: number;
  // Buy – cash flow pieces
  mortgagePayment: number;
  mortgageInterest: number;
  mortgagePrincipal: number;
  mortgageBalance: number;
  propertyTax: number;
  maintenance: number;
  insurance: number;
  hoa: number;
  homeValue: number;
  percentagePaidOff: number; // percentage of loan paid off (0-1)
  equity: number; // percentagePaidOff * homeValue
  saleProceeds: number; // 0 except in sell month, then netSaleProceeds
  buyCF: number;
  buyDiscountedCF: number;
  buyCumulativeNPV: number;
  discountFactor: number;
};

export type Summary = {
  months: number;
  buyTotalNPV: number;
  rentTotalNPV: number;
  npvDifference: number; // rent - buy
  sellMonthIndex: number;
  breakEvenMonthIndex?: number;
  breakEvenYears?: number;
};

export type ModelResult = {
  inputs: Inputs;
  monthly: MonthRecord[];
  summary: Summary;
};

