import { runModel, getDefaultInputs } from './calculator';
import { Inputs } from './types';

describe('runModel - Integration Tests', () => {
  describe('Basic scenarios', () => {
    it('should run model with default inputs', () => {
      const result = runModel(getDefaultInputs());

      expect(result.monthly).toHaveLength(30 * 12 + 1); // 0 to 360
      expect(result.summary.months).toBe(30 * 12);
      expect(result.summary.buyTotalNPV).toBeDefined();
      expect(result.summary.rentTotalNPV).toBeDefined();
      expect(Number.isFinite(result.summary.buyTotalNPV)).toBe(true);
      expect(Number.isFinite(result.summary.rentTotalNPV)).toBe(true);
    });

    it('should calculate realistic NPV values for buying scenario', () => {
      const inputs: Inputs = {
        analysisYears: 10,
        discountRateAnnual: 0.05,
        homePrice: 500000,
        downPaymentPercent: 0.2, // $100k down
        mortgageRateAnnual: 0.06,
        mortgageTermYears: 30,
        hoaMonthly: 200,
        propertyTaxRateAnnual: 0.01,
        insuranceAnnual: 2000,
        maintenanceRateAnnual: 0.01,
        homeAppreciationRateAnnual: 0.03,
        closingCosts: 10000,
        loanFees: 5000,
        initialMonthlyRent: 2500,
        rentInflationRateAnnual: 0.03,
      };

      const result = runModel(inputs);

      // Check that initial costs are captured
      const month0 = result.monthly[0];
      expect(month0.buyCF).toBeLessThan(0); // Initial outflow (net of equity)

      // Check that monthly data makes sense
      const month1 = result.monthly[1];
      expect(month1.mortgagePayment).toBeGreaterThan(0);
      expect(month1.mortgageBalance).toBeLessThan(inputs.homePrice * 0.8);
      expect(month1.homeValue).toBeGreaterThanOrEqual(inputs.homePrice);

      // Final month should show accumulated equity
      const finalMonth = result.monthly[result.monthly.length - 1];
      expect(finalMonth.equity).toBeGreaterThan(month0.equity);
      expect(finalMonth.homeValue).toBeGreaterThan(inputs.homePrice);
    });

    it('should handle 100% cash purchase (no mortgage)', () => {
      const inputs: Inputs = {
        analysisYears: 10,
        discountRateAnnual: 0.05,
        homePrice: 400000,
        downPaymentPercent: 1.0, // 100% down
        mortgageRateAnnual: 0.06,
        mortgageTermYears: 30,
        hoaMonthly: 0,
        propertyTaxRateAnnual: 0.01,
        insuranceAnnual: 1500,
        maintenanceRateAnnual: 0.01,
        homeAppreciationRateAnnual: 0.03,
        closingCosts: 0,
        loanFees: 0,
        initialMonthlyRent: 2000,
        rentInflationRateAnnual: 0.03,
      };

      const result = runModel(inputs);

      // Should have no mortgage payments
      const month1 = result.monthly[1];
      expect(month1.mortgagePayment).toBe(0);
      expect(month1.mortgageBalance).toBe(0);
      expect(month1.mortgageInterest).toBe(0);
      expect(month1.mortgagePrincipal).toBe(0);

      // Should have 100% equity from the start
      const month0 = result.monthly[0];
      expect(month0.equity).toBe(inputs.homePrice);
      expect(month0.percentagePaidOff).toBe(1);
    });

    it('should handle zero interest rates', () => {
      const inputs: Inputs = {
        analysisYears: 10,
        discountRateAnnual: 0,
        homePrice: 300000,
        downPaymentPercent: 0.2,
        mortgageRateAnnual: 0,
        mortgageTermYears: 30,
        hoaMonthly: 0,
        propertyTaxRateAnnual: 0.01,
        insuranceAnnual: 1000,
        maintenanceRateAnnual: 0.01,
        homeAppreciationRateAnnual: 0,
        closingCosts: 0,
        loanFees: 0,
        initialMonthlyRent: 1500,
        rentInflationRateAnnual: 0,
      };

      const result = runModel(inputs);

      // With 0% mortgage, payment is simply loan / months
      const loanAmount = inputs.homePrice * 0.8;
      const expectedPayment = loanAmount / (inputs.mortgageTermYears * 12);

      const month1 = result.monthly[1];
      expect(month1.mortgagePayment).toBeCloseTo(expectedPayment, 2);
      expect(month1.mortgageInterest).toBe(0);
      expect(month1.mortgagePrincipal).toBeCloseTo(expectedPayment, 2);

      // With 0% discount rate, all discount factors should be 1
      expect(result.monthly[0].discountFactor).toBe(1);
      expect(result.monthly[60].discountFactor).toBe(1);
    });
  });

  describe('Mortgage amortization verification', () => {
    it('should fully amortize mortgage over term', () => {
      const inputs: Inputs = {
        analysisYears: 30,
        discountRateAnnual: 0.05,
        homePrice: 400000,
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
        initialMonthlyRent: 2000,
        rentInflationRateAnnual: 0.03,
      };

      const result = runModel(inputs);

      // At the end of 30 years, mortgage should be fully paid off
      const finalMonth = result.monthly[360];
      expect(finalMonth.mortgageBalance).toBeCloseTo(0, 2);
      expect(finalMonth.percentagePaidOff).toBeCloseTo(1, 4);
    });

    it('should have decreasing mortgage balance each month', () => {
      const inputs = getDefaultInputs();
      inputs.analysisYears = 10;

      const result = runModel(inputs);

      for (let i = 2; i < result.monthly.length; i++) {
        const currentBalance = result.monthly[i].mortgageBalance;
        const prevBalance = result.monthly[i - 1].mortgageBalance;

        // Balance should decrease or stay at 0
        expect(currentBalance).toBeLessThanOrEqual(prevBalance);
      }
    });

    it('should have principal payments summing to original loan amount', () => {
      const inputs: Inputs = {
        analysisYears: 30,
        discountRateAnnual: 0.05,
        homePrice: 300000,
        downPaymentPercent: 0.2,
        mortgageRateAnnual: 0.05,
        mortgageTermYears: 30,
        hoaMonthly: 0,
        propertyTaxRateAnnual: 0.01,
        insuranceAnnual: 1500,
        maintenanceRateAnnual: 0.01,
        homeAppreciationRateAnnual: 0.03,
        closingCosts: 0,
        loanFees: 0,
        initialMonthlyRent: 1500,
        rentInflationRateAnnual: 0.03,
      };

      const result = runModel(inputs);

      const loanAmount = inputs.homePrice * (1 - inputs.downPaymentPercent);
      let totalPrincipal = 0;

      // Sum up all principal payments
      for (let i = 1; i <= 360; i++) {
        totalPrincipal += result.monthly[i].mortgagePrincipal;
      }

      // Total principal should equal original loan (within rounding)
      expect(totalPrincipal).toBeCloseTo(loanAmount, 0);
    });

    it('should have early payments that are mostly interest', () => {
      const inputs = getDefaultInputs();
      inputs.analysisYears = 30;

      const result = runModel(inputs);

      // First payment should be mostly interest
      const month1 = result.monthly[1];
      expect(month1.mortgageInterest).toBeGreaterThan(month1.mortgagePrincipal);

      // Check first 12 months
      for (let i = 1; i <= 12; i++) {
        const month = result.monthly[i];
        expect(month.mortgageInterest).toBeGreaterThan(month.mortgagePrincipal);
      }
    });

    it('should have late payments that are mostly principal', () => {
      const inputs = getDefaultInputs();
      inputs.analysisYears = 30;

      const result = runModel(inputs);

      // Last 12 payments should be mostly principal
      for (let i = 349; i <= 360; i++) {
        const month = result.monthly[i];
        if (month.mortgagePayment > 0) {
          expect(month.mortgagePrincipal).toBeGreaterThan(month.mortgageInterest);
        }
      }
    });
  });

  describe('Home value and equity', () => {
    it('should appreciate home value at specified rate', () => {
      const inputs: Inputs = {
        analysisYears: 10,
        discountRateAnnual: 0.05,
        homePrice: 500000,
        downPaymentPercent: 0.2,
        mortgageRateAnnual: 0.06,
        mortgageTermYears: 30,
        hoaMonthly: 0,
        propertyTaxRateAnnual: 0.01,
        insuranceAnnual: 2000,
        maintenanceRateAnnual: 0.01,
        homeAppreciationRateAnnual: 0.04, // 4% annual
        closingCosts: 0,
        loanFees: 0,
        initialMonthlyRent: 2000,
        rentInflationRateAnnual: 0.03,
      };

      const result = runModel(inputs);

      const initialValue = result.monthly[0].homeValue;
      const finalValue = result.monthly[120].homeValue; // After 10 years

      // After 10 years at 4% annual: 500000 * 1.04^10 ≈ 740,122
      const expected = inputs.homePrice * Math.pow(1.04, 10);
      expect(finalValue).toBeCloseTo(expected, -2); // Within $100
    });

    it('should have increasing equity over time', () => {
      const inputs = getDefaultInputs();
      inputs.analysisYears = 20;

      const result = runModel(inputs);

      // Equity should increase each period (or stay constant if fully paid)
      for (let i = 1; i < result.monthly.length; i++) {
        const currentEquity = result.monthly[i].equity;
        const prevEquity = result.monthly[i - 1].equity;

        // Equity should increase (from appreciation and paydown)
        expect(currentEquity).toBeGreaterThanOrEqual(prevEquity);
      }
    });

    it('should handle no appreciation (flat home value)', () => {
      const inputs: Inputs = {
        analysisYears: 10,
        discountRateAnnual: 0.05,
        homePrice: 400000,
        downPaymentPercent: 0.2,
        mortgageRateAnnual: 0.06,
        mortgageTermYears: 30,
        hoaMonthly: 0,
        propertyTaxRateAnnual: 0.01,
        insuranceAnnual: 2000,
        maintenanceRateAnnual: 0.01,
        homeAppreciationRateAnnual: 0, // No appreciation
        closingCosts: 0,
        loanFees: 0,
        initialMonthlyRent: 2000,
        rentInflationRateAnnual: 0.03,
      };

      const result = runModel(inputs);

      // All home values should be constant
      const initialValue = result.monthly[0].homeValue;
      const midValue = result.monthly[60].homeValue;
      const finalValue = result.monthly[120].homeValue;

      expect(initialValue).toBe(inputs.homePrice);
      expect(midValue).toBe(inputs.homePrice);
      expect(finalValue).toBe(inputs.homePrice);

      // But equity should still increase from mortgage paydown
      const initialEquity = result.monthly[0].equity;
      const finalEquity = result.monthly[120].equity;
      expect(finalEquity).toBeGreaterThan(initialEquity);
    });
  });

  describe('Rent calculations', () => {
    it('should inflate rent at specified rate', () => {
      const inputs: Inputs = {
        analysisYears: 10,
        discountRateAnnual: 0.05,
        homePrice: 400000,
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
        initialMonthlyRent: 2000,
        rentInflationRateAnnual: 0.04, // 4% annual inflation
      };

      const result = runModel(inputs);

      const initialRent = result.monthly[0].rentPayment;
      const finalRent = result.monthly[120].rentPayment; // After 10 years

      // After 10 years at 4% annual: 2000 * 1.04^10 ≈ 2,960
      const expected = inputs.initialMonthlyRent * Math.pow(1.04, 10);
      expect(finalRent).toBeCloseTo(expected, 0);
    });

    it('should handle flat rent (no inflation)', () => {
      const inputs: Inputs = {
        analysisYears: 10,
        discountRateAnnual: 0.05,
        homePrice: 400000,
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
        initialMonthlyRent: 2000,
        rentInflationRateAnnual: 0, // No inflation
      };

      const result = runModel(inputs);

      // All rent payments should be the same
      const initialRent = result.monthly[0].rentPayment;
      const midRent = result.monthly[60].rentPayment;
      const finalRent = result.monthly[120].rentPayment;

      expect(initialRent).toBe(inputs.initialMonthlyRent);
      expect(midRent).toBe(inputs.initialMonthlyRent);
      expect(finalRent).toBe(inputs.initialMonthlyRent);
    });

    it('should include renter insurance and other costs', () => {
      const inputs: Inputs = {
        analysisYears: 5,
        discountRateAnnual: 0.05,
        homePrice: 400000,
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
        initialMonthlyRent: 2000,
        rentInflationRateAnnual: 0.03,
        renterInsuranceMonthly: 50,
        otherRentCostsMonthly: 100,
      };

      const result = runModel(inputs);

      // Rent CF should include base rent + insurance + other costs
      const month1 = result.monthly[1];
      const expectedCF = -(month1.rentPayment + 50 + 100);
      expect(month1.rentCF).toBeCloseTo(expectedCF, 2);
    });
  });

  describe('NPV calculations and break-even', () => {
    it('should have negative NPV for rent (pure outflows)', () => {
      const inputs = getDefaultInputs();
      inputs.analysisYears = 10;

      const result = runModel(inputs);

      // Renting is all outflows, so NPV should be negative
      expect(result.summary.rentTotalNPV).toBeLessThan(0);
    });

    it('should calculate cumulative NPV correctly', () => {
      const inputs: Inputs = {
        analysisYears: 5,
        discountRateAnnual: 0.05,
        homePrice: 300000,
        downPaymentPercent: 0.2,
        mortgageRateAnnual: 0.06,
        mortgageTermYears: 30,
        hoaMonthly: 0,
        propertyTaxRateAnnual: 0.01,
        insuranceAnnual: 1500,
        maintenanceRateAnnual: 0.01,
        homeAppreciationRateAnnual: 0.03,
        closingCosts: 0,
        loanFees: 0,
        initialMonthlyRent: 1500,
        rentInflationRateAnnual: 0.03,
      };

      const result = runModel(inputs);

      // Manually sum discounted cash flows for rent
      let manualRentNPV = 0;
      for (let i = 0; i < result.monthly.length; i++) {
        manualRentNPV += result.monthly[i].rentDiscountedCF;
      }

      expect(result.summary.rentTotalNPV).toBeCloseTo(manualRentNPV, 2);

      // Manually calculate buy NPV: sum of discounted CFs + discounted terminal equity
      let manualBuyCFNPV = 0;
      for (let i = 0; i < result.monthly.length; i++) {
        manualBuyCFNPV += result.monthly[i].buyDiscountedCF;
      }
      // Add discounted equity value at end
      const finalMonth = result.monthly[result.monthly.length - 1];
      const discountedFinalEquity = finalMonth.equity * finalMonth.discountFactor;
      const manualBuyNPV = manualBuyCFNPV + discountedFinalEquity;

      expect(result.summary.buyTotalNPV).toBeCloseTo(manualBuyNPV, 2);
    });

    it('should find break-even point when buying becomes better', () => {
      const inputs: Inputs = {
        analysisYears: 20,
        discountRateAnnual: 0.05,
        homePrice: 400000,
        downPaymentPercent: 0.2,
        mortgageRateAnnual: 0.06,
        mortgageTermYears: 30,
        hoaMonthly: 200,
        propertyTaxRateAnnual: 0.01,
        insuranceAnnual: 2000,
        maintenanceRateAnnual: 0.01,
        homeAppreciationRateAnnual: 0.04,
        closingCosts: 10000,
        loanFees: 5000,
        initialMonthlyRent: 2000,
        rentInflationRateAnnual: 0.04,
      };

      const result = runModel(inputs);

      // Should find a break-even point
      expect(result.summary.breakEvenMonthIndex).toBeDefined();
      expect(result.summary.breakEvenYears).toBeDefined();

      if (result.summary.breakEvenMonthIndex !== undefined) {
        const breakEvenMonth = result.monthly[result.summary.breakEvenMonthIndex];

        // At break-even, buy NPV should be >= rent NPV
        expect(breakEvenMonth.buyCumulativeNPV).toBeGreaterThanOrEqual(
          breakEvenMonth.rentCumulativeNPV
        );

        // Before break-even, rent should be better
        if (result.summary.breakEvenMonthIndex > 0) {
          const prevMonth = result.monthly[result.summary.breakEvenMonthIndex - 1];
          expect(prevMonth.buyCumulativeNPV).toBeLessThan(prevMonth.rentCumulativeNPV);
        }
      }
    });

    it('may not find break-even if buying is always worse', () => {
      const inputs: Inputs = {
        analysisYears: 5,
        discountRateAnnual: 0.05,
        homePrice: 1000000, // Very expensive home
        downPaymentPercent: 0.1, // Small down payment
        mortgageRateAnnual: 0.08, // High rate
        mortgageTermYears: 30,
        hoaMonthly: 1000, // High HOA
        propertyTaxRateAnnual: 0.02, // High taxes
        insuranceAnnual: 5000,
        maintenanceRateAnnual: 0.02,
        homeAppreciationRateAnnual: 0.01, // Low appreciation
        closingCosts: 50000, // High closing costs
        loanFees: 20000,
        initialMonthlyRent: 2000, // Cheap rent
        rentInflationRateAnnual: 0.02,
      };

      const result = runModel(inputs);

      // May not find break-even in 5 years with these parameters
      // (This is okay - not all scenarios have break-even)
      if (result.summary.breakEvenMonthIndex === undefined) {
        // Buying should be worse throughout
        const finalMonth = result.monthly[result.monthly.length - 1];
        expect(finalMonth.buyCumulativeNPV).toBeLessThan(finalMonth.rentCumulativeNPV);
      }
    });

    it('should calculate npvDifference correctly', () => {
      const inputs = getDefaultInputs();
      inputs.analysisYears = 10;

      const result = runModel(inputs);

      const expectedDiff = result.summary.rentTotalNPV - result.summary.buyTotalNPV;
      expect(result.summary.npvDifference).toBeCloseTo(expectedDiff, 2);
    });
  });

  describe('Discount factor application', () => {
    it('should apply discount factors correctly to future cash flows', () => {
      const inputs: Inputs = {
        analysisYears: 5,
        discountRateAnnual: 0.10, // High discount rate to see effect
        homePrice: 300000,
        downPaymentPercent: 0.2,
        mortgageRateAnnual: 0.06,
        mortgageTermYears: 30,
        hoaMonthly: 0,
        propertyTaxRateAnnual: 0.01,
        insuranceAnnual: 1500,
        maintenanceRateAnnual: 0.01,
        homeAppreciationRateAnnual: 0.03,
        closingCosts: 0,
        loanFees: 0,
        initialMonthlyRent: 1500,
        rentInflationRateAnnual: 0.03,
      };

      const result = runModel(inputs);

      // Discount factor should decrease over time
      for (let i = 1; i < result.monthly.length; i++) {
        const currentDF = result.monthly[i].discountFactor;
        const prevDF = result.monthly[i - 1].discountFactor;
        expect(currentDF).toBeLessThan(prevDF);
      }

      // Discounted CF should be less than undiscounted (in absolute terms)
      const month12 = result.monthly[12];
      expect(Math.abs(month12.rentDiscountedCF)).toBeLessThan(
        Math.abs(month12.rentCF)
      );
    });
  });
});
