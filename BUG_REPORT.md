# Bug Report: Incorrect Equity Calculation

## Summary

The calculator uses an incorrect formula for calculating home equity, which **artificially penalizes longer mortgage terms** and produces incorrect NPV calculations.

## The Bug

### Current (Incorrect) Formula
```typescript
// lib/calculator.ts:72-83
export function calculateEquity(
  originalLoanAmount: number,
  currentBalance: number,
  currentHomeValue: number
): number {
  if (originalLoanAmount === 0) {
    return currentHomeValue;
  }
  const amountPaidOff = originalLoanAmount - currentBalance;
  const percentagePaidOff = amountPaidOff / originalLoanAmount;
  return percentagePaidOff * currentHomeValue; // ❌ WRONG
}
```

This formula only credits you for appreciation on the portion of the loan you've paid off.

### Correct Formula
```typescript
export function calculateEquity(
  originalLoanAmount: number,
  currentBalance: number,
  currentHomeValue: number
): number {
  return currentHomeValue - currentBalance; // ✅ CORRECT
}
```

Equity is simply: what you own (home value) minus what you owe (loan balance).

## Concrete Example

**Scenario**: $500k home with $400k loan (80% LTV)
- Paid off 50% of loan ($200k paid, $200k remaining)
- Home appreciated 20% to $600k

### Current Calculator Says:
```
equity = 50% × $600k = $300k
```

### Reality:
```
equity = $600k - $200k = $400k
```

**The calculator is missing $100k of equity!** This is the appreciation on the portion of the home still financed by the loan.

## Impact on NPV Calculations

At year 15 with 30-year mortgage:
- **Actual equity**: $779k - $257k = **$522k**
- **Calculator equity**: **$278k**
- **Understatement**: **$244k** (87% error!)

Because the calculator includes equity changes in cash flow calculations, this bug:
1. **Understates equity** for all mortgages with remaining balances
2. **Penalizes longer mortgages** more severely (they have larger remaining balances)
3. **Artificially inflates the NPV advantage** of shorter loan terms
4. **Produces incorrect NPV values** for buy scenarios

## Why This Matters for Your Question

You asked:
> "When mortgage rate < discount rate, aren't longer terms better because you can invest the savings?"

The answer **should be YES** (with the correct equity formula), but the calculator was showing NO because of this bug.

With the bug:
- 15-year NPV: -$103,597
- 30-year NPV: -$246,010
- **Difference: $142k in favor of 15-year**

The $142k "advantage" is largely due to **$244k of missing equity** on the 30-year mortgage!

## Theoretical Analysis

### Why the Current Formula is Wrong

The current formula treats equity like you only own the percentage of the home equal to the percentage of the loan you've paid off. This would be true if:
- The bank owned part of the house (they don't - you own it all)
- Appreciation only applied to your paid-off portion (it doesn't - it applies to the whole house)

### Why the Correct Formula is Right

In reality:
- **You own the entire home** from day one (even the mortgaged portion)
- The loan is a liability separate from the asset
- **Net worth = Assets - Liabilities = Home Value - Loan Balance**
- All appreciation accrues to you (not to the bank)

When the home appreciates $100k, your net worth increases $100k, regardless of how much of the mortgage you've paid off.

## Test Evidence

See `lib/equity-calculation-bug.test.ts` for tests that demonstrate:

1. **Missing equity**: Calculator shows $278k when actual is $522k
2. **Artificial penalty**: Longer mortgages lose ~$244k of equity in NPV calculations
3. **Simple example**: 50% paid off scenario shows $100k missing equity

## Recommendation

**Fix the equity calculation immediately.** The current formula:
- Violates basic accounting principles (Assets - Liabilities = Equity)
- Produces systematically wrong NPV values
- Makes incorrect recommendations about loan terms
- Penalizes longer mortgages unfairly

After fixing, the loan term analysis will likely show that **with cheap money (mortgage rate < discount rate), longer terms ARE better**, as you correctly intuited.

## Files Affected

- `lib/calculator.ts` - Line 72-83 (calculateEquity function)
- `lib/calculator.ts` - Lines using equity in NPV calculation
- All existing tests that verify equity values will need updates
- The loan term comparison results will change significantly

## Credit

Bug discovered by user question: "After 15 years, I own the whole house either way, so the only difference is interest paid and timing, right?"

**Absolutely correct.** The calculator was wrong.
