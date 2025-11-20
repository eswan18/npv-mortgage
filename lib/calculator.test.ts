import {
  annualToMonthly,
  calculateMortgagePayment,
  calculateDiscountFactor,
  calculateAmortizationStep,
  calculateEquity,
  runModel,
  getDefaultInputs,
} from './calculator';
import { Inputs } from './types';

describe('annualToMonthly', () => {
  it('should convert 0% annual rate to 0% monthly rate', () => {
    expect(annualToMonthly(0)).toBe(0);
  });

  it('should convert 12% annual rate correctly', () => {
    const monthlyRate = annualToMonthly(0.12);
    // (1.12)^(1/12) - 1 ≈ 0.009488792934583046
    expect(monthlyRate).toBeCloseTo(0.009488792934583046, 10);
  });

  it('should convert 5% annual rate correctly', () => {
    const monthlyRate = annualToMonthly(0.05);
    // (1.05)^(1/12) - 1 ≈ 0.004074124
    expect(monthlyRate).toBeCloseTo(0.004074124, 8);
  });

  it('should convert 6% annual rate correctly (common mortgage rate)', () => {
    const monthlyRate = annualToMonthly(0.06);
    // (1.06)^(1/12) - 1 ≈ 0.004867551
    expect(monthlyRate).toBeCloseTo(0.004867551, 8);
  });

  it('should satisfy compound interest relationship', () => {
    // After 12 months, monthly compounding should equal annual rate
    const annualRate = 0.07;
    const monthlyRate = annualToMonthly(annualRate);
    const compoundedAnnual = Math.pow(1 + monthlyRate, 12) - 1;
    expect(compoundedAnnual).toBeCloseTo(annualRate, 10);
  });

  it('should handle negative rates (deflation scenarios)', () => {
    const monthlyRate = annualToMonthly(-0.02);
    expect(monthlyRate).toBeLessThan(0);
    // Verify round-trip
    const compoundedAnnual = Math.pow(1 + monthlyRate, 12) - 1;
    expect(compoundedAnnual).toBeCloseTo(-0.02, 10);
  });

  it('should handle very high rates', () => {
    const monthlyRate = annualToMonthly(1.0); // 100% annual
    expect(monthlyRate).toBeGreaterThan(0);
    const compoundedAnnual = Math.pow(1 + monthlyRate, 12) - 1;
    expect(compoundedAnnual).toBeCloseTo(1.0, 10);
  });

  it('should handle very small rates', () => {
    const monthlyRate = annualToMonthly(0.0001);
    expect(monthlyRate).toBeGreaterThan(0);
    expect(monthlyRate).toBeLessThan(0.0001);
  });
});

describe('calculateMortgagePayment', () => {
  it('should calculate payment for standard 30-year mortgage', () => {
    const loanAmount = 400000; // $400k loan
    const annualRate = 0.06; // 6% annual
    const monthlyRate = annualToMonthly(annualRate);
    const numPayments = 30 * 12; // 360 months

    const payment = calculateMortgagePayment(loanAmount, monthlyRate, numPayments);

    // Using compound monthly rate gives slightly different result than simple division
    // Expected payment for $400k at 6% over 30 years ≈ $2,357
    expect(payment).toBeCloseTo(2357, 0);
  });

  it('should calculate payment for 15-year mortgage', () => {
    const loanAmount = 300000;
    const annualRate = 0.045; // 4.5% annual
    const monthlyRate = annualToMonthly(annualRate);
    const numPayments = 15 * 12; // 180 months

    const payment = calculateMortgagePayment(loanAmount, monthlyRate, numPayments);

    // Expected payment for $300k at 4.5% over 15 years ≈ $2,281
    expect(payment).toBeCloseTo(2281, 0);
  });

  it('should handle zero interest rate (0-interest loan)', () => {
    const loanAmount = 120000;
    const monthlyRate = 0;
    const numPayments = 10 * 12; // 120 months

    const payment = calculateMortgagePayment(loanAmount, monthlyRate, numPayments);

    // Should be simple division: $120k / 120 = $1,000
    expect(payment).toBe(1000);
  });

  it('should handle short-term loan', () => {
    const loanAmount = 50000;
    const annualRate = 0.08;
    const monthlyRate = annualToMonthly(annualRate);
    const numPayments = 5 * 12; // 60 months

    const payment = calculateMortgagePayment(loanAmount, monthlyRate, numPayments);

    expect(payment).toBeGreaterThan(loanAmount / numPayments); // More than principal alone
    expect(payment).toBeLessThan(loanAmount); // Less than total loan
  });

  it('should handle very high interest rates', () => {
    const loanAmount = 100000;
    const annualRate = 0.20; // 20% annual (historical high)
    const monthlyRate = annualToMonthly(annualRate);
    const numPayments = 30 * 12;

    const payment = calculateMortgagePayment(loanAmount, monthlyRate, numPayments);

    expect(payment).toBeGreaterThan(1500); // Much more than principal payment
    expect(Number.isFinite(payment)).toBe(true);
  });

  it('should produce payments that fully amortize the loan', () => {
    const loanAmount = 250000;
    const annualRate = 0.055;
    const monthlyRate = annualToMonthly(annualRate);
    const numPayments = 30 * 12;

    const payment = calculateMortgagePayment(loanAmount, monthlyRate, numPayments);

    // Simulate full amortization
    let balance = loanAmount;
    for (let i = 0; i < numPayments; i++) {
      const interest = balance * monthlyRate;
      const principal = payment - interest;
      balance -= principal;
    }

    // Balance should be ~0 after all payments (within rounding error)
    expect(balance).toBeCloseTo(0, 2);
  });

  it('should handle single payment loan', () => {
    const loanAmount = 10000;
    const monthlyRate = 0.01; // 1% monthly
    const numPayments = 1;

    const payment = calculateMortgagePayment(loanAmount, monthlyRate, numPayments);

    // Payment should be principal + one month interest
    expect(payment).toBeCloseTo(10000 * (1 + 0.01), 2);
  });
});

describe('calculateDiscountFactor', () => {
  it('should return 1 for period 0', () => {
    expect(calculateDiscountFactor(0.05, 0)).toBe(1);
  });

  it('should calculate correct discount factor for period 1', () => {
    const monthlyRate = annualToMonthly(0.05); // 5% annual
    const df = calculateDiscountFactor(monthlyRate, 1);
    // DF = 1 / (1 + r)^1
    expect(df).toBeCloseTo(1 / (1 + monthlyRate), 10);
  });

  it('should calculate correct discount factor for period 12', () => {
    const annualRate = 0.08;
    const monthlyRate = annualToMonthly(annualRate);
    const df = calculateDiscountFactor(monthlyRate, 12);

    // After 12 months, should approximately equal 1/(1+annual rate)
    expect(df).toBeCloseTo(1 / (1 + annualRate), 4);
  });

  it('should produce decreasing values for increasing periods', () => {
    const monthlyRate = annualToMonthly(0.06);
    const df1 = calculateDiscountFactor(monthlyRate, 1);
    const df12 = calculateDiscountFactor(monthlyRate, 12);
    const df24 = calculateDiscountFactor(monthlyRate, 24);
    const df360 = calculateDiscountFactor(monthlyRate, 360);

    expect(df1).toBeGreaterThan(df12);
    expect(df12).toBeGreaterThan(df24);
    expect(df24).toBeGreaterThan(df360);
    expect(df360).toBeGreaterThan(0);
  });

  it('should handle zero discount rate', () => {
    const df = calculateDiscountFactor(0, 100);
    // With 0 discount rate, all future values equal present value
    expect(df).toBe(1);
  });

  it('should handle very high discount rates', () => {
    const monthlyRate = annualToMonthly(0.50); // 50% annual
    const df = calculateDiscountFactor(monthlyRate, 360);

    // Future value should be heavily discounted
    expect(df).toBeGreaterThan(0);
    expect(df).toBeLessThan(0.01);
  });
});

describe('calculateAmortizationStep', () => {
  it('should calculate interest and principal correctly', () => {
    const currentBalance = 400000;
    const monthlyPayment = 2398.20;
    const monthlyRate = annualToMonthly(0.06);

    const result = calculateAmortizationStep(currentBalance, monthlyPayment, monthlyRate);

    expect(result.interest).toBeCloseTo(currentBalance * monthlyRate, 2);
    expect(result.principal).toBeCloseTo(monthlyPayment - result.interest, 2);
    expect(result.newBalance).toBeCloseTo(currentBalance - result.principal, 2);
  });

  it('should handle zero balance', () => {
    const result = calculateAmortizationStep(0, 1000, 0.005);

    expect(result.interest).toBe(0);
    expect(result.principal).toBe(0);
    expect(result.newBalance).toBe(0);
  });

  it('should handle final payment (balance < regular principal)', () => {
    const currentBalance = 500; // Last payment
    const monthlyPayment = 2000;
    const monthlyRate = 0.005;

    const result = calculateAmortizationStep(currentBalance, monthlyPayment, monthlyRate);

    // Interest on remaining balance
    expect(result.interest).toBeCloseTo(500 * 0.005, 2);
    // Principal should not exceed remaining balance
    expect(result.principal).toBeCloseTo(500, 2);
    expect(result.newBalance).toBeCloseTo(0, 2);
  });

  it('should produce declining balance over time', () => {
    let balance = 300000;
    const monthlyPayment = 1798.65; // ~5% over 30 years
    const monthlyRate = annualToMonthly(0.05);

    for (let i = 0; i < 12; i++) {
      const result = calculateAmortizationStep(balance, monthlyPayment, monthlyRate);
      expect(result.newBalance).toBeLessThan(balance);
      balance = result.newBalance;
    }

    // After 12 payments, balance should be noticeably lower
    expect(balance).toBeLessThan(299000);
  });

  it('should have increasing principal portion over time', () => {
    let balance = 200000;
    const monthlyPayment = 1073.64; // ~4% over 30 years
    const monthlyRate = annualToMonthly(0.04);

    const step1 = calculateAmortizationStep(balance, monthlyPayment, monthlyRate);

    // Advance by 100 payments
    for (let i = 0; i < 100; i++) {
      const result = calculateAmortizationStep(balance, monthlyPayment, monthlyRate);
      balance = result.newBalance;
    }

    const step101 = calculateAmortizationStep(balance, monthlyPayment, monthlyRate);

    // Principal should be larger in later payment
    expect(step101.principal).toBeGreaterThan(step1.principal);
    // Interest should be smaller in later payment
    expect(step101.interest).toBeLessThan(step1.interest);
  });

  it('should handle zero interest rate', () => {
    const currentBalance = 100000;
    const monthlyPayment = 1000;
    const monthlyRate = 0;

    const result = calculateAmortizationStep(currentBalance, monthlyPayment, monthlyRate);

    expect(result.interest).toBe(0);
    expect(result.principal).toBe(1000);
    expect(result.newBalance).toBe(99000);
  });
});

describe('calculateEquity', () => {
  it('should calculate equity correctly with partial payoff', () => {
    const originalLoan = 400000;
    const currentBalance = 350000;
    const currentHomeValue = 500000;

    const equity = calculateEquity(originalLoan, currentBalance, currentHomeValue);

    // Equity = Home Value - Remaining Balance
    // $500k - $350k = $150k
    expect(equity).toBeCloseTo(150000, 2);
  });

  it('should calculate equity when loan is fully paid', () => {
    const originalLoan = 300000;
    const currentBalance = 0;
    const currentHomeValue = 450000;

    const equity = calculateEquity(originalLoan, currentBalance, currentHomeValue);

    // Fully paid off: equity = full home value
    // $450k - $0 = $450k
    expect(equity).toBe(450000);
  });

  it('should calculate equity when no payments made yet', () => {
    const originalLoan = 400000;
    const currentBalance = 400000;
    const currentHomeValue = 500000;

    const equity = calculateEquity(originalLoan, currentBalance, currentHomeValue);

    // No principal paid yet: equity = home value - full loan
    // $500k - $400k = $100k (the down payment amount)
    expect(equity).toBe(100000);
  });

  it('should handle home appreciation with partial payoff', () => {
    const originalLoan = 400000;
    const currentBalance = 300000; // Paid off $100k
    const currentHomeValue = 600000; // Home appreciated

    const equity = calculateEquity(originalLoan, currentBalance, currentHomeValue);

    // Equity = Home Value - Remaining Balance
    // $600k - $300k = $300k
    // You benefit from ALL appreciation, not just on the paid-off portion
    expect(equity).toBeCloseTo(300000, 2);
  });

  it('should handle no loan (100% cash purchase)', () => {
    const originalLoan = 0;
    const currentBalance = 0;
    const currentHomeValue = 500000;

    const equity = calculateEquity(originalLoan, currentBalance, currentHomeValue);

    // No loan = 100% equity = full home value
    expect(equity).toBe(500000);
  });

  it('should calculate equity mid-way through mortgage', () => {
    const originalLoan = 320000; // 80% of $400k
    const currentBalance = 160000; // Halfway paid
    const currentHomeValue = 480000; // Appreciated 20%

    const equity = calculateEquity(originalLoan, currentBalance, currentHomeValue);

    // Equity = Home Value - Remaining Balance
    // $480k - $160k = $320k
    expect(equity).toBeCloseTo(320000, 2);
  });

  it('should reflect that equity grows with both appreciation and paydown', () => {
    const originalLoan = 400000;
    const initialHomeValue = 500000;

    // Scenario 1: No paydown, no appreciation
    // Still have equity from down payment: $500k - $400k = $100k
    const equity1 = calculateEquity(originalLoan, 400000, 500000);
    expect(equity1).toBe(100000);

    // Scenario 2: Some paydown, no appreciation
    // $500k - $380k = $120k
    const equity2 = calculateEquity(originalLoan, 380000, 500000);
    expect(equity2).toBeGreaterThan(equity1);

    // Scenario 3: Same paydown, with appreciation
    // $550k - $380k = $170k
    const equity3 = calculateEquity(originalLoan, 380000, 550000);
    expect(equity3).toBeGreaterThan(equity2);
  });
});
