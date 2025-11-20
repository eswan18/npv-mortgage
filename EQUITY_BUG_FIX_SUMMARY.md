# Equity Bug Fix Summary

## The Bug

The calculator was using an incorrect formula for calculating home equity:

**Before (WRONG)**:
```typescript
equity = (amountPaidOff / originalLoan) × currentHomeValue
```

**After (CORRECT)**:
```typescript
equity = currentHomeValue - remainingLoanBalance
```

## Why It Was Wrong

The old formula only credited you for appreciation on the portion of the loan you'd paid off. This is conceptually incorrect because:

1. **You own the entire home** from day one (the bank does NOT own part of your house)
2. **The loan is a separate liability** secured by the home
3. **All appreciation accrues to you**, not proportionally to what you've paid off

## Concrete Example

**Scenario**: $500k home, $400k loan, paid off $50k (balance=$350k), home appreciated to $600k

| Formula | Calculation | Result |
|---------|-------------|--------|
| **Old (wrong)** | 12.5% paid × $600k | $75k equity |
| **New (correct)** | $600k - $350k | **$250k equity** |

The old formula was missing **$175k of equity**!

## Impact on NPV Calculations

### Before the Fix
- Equity was severely understated, especially for longer mortgages
- 30-year mortgage at year 15: showed $278k equity (wrong)
- Actual equity: $522k
- **Missing $244k** (87% error!)

### After the Fix
- Equity correctly calculated as homeValue - loanBalance
- All appreciation is properly credited to homeowner
- NPV calculations are now accurate

## NPV Results Comparison

**Cheap Money Scenario** (4% mortgage, 7% discount rate):

|  | Before Fix | After Fix | Change |
|--|------------|-----------|--------|
| **15-year NPV** | -$103,597 | -$34,125 | +$69k better |
| **30-year NPV** | -$246,010 | -$90,734 | +$155k better |
| **Difference** | $142k favors 15yr | $57k favors 15yr | 60% reduction |

### Key Insights

1. **Both mortgages improved** with the fix (less negative NPV)
2. **30-year improved more** (+$155k vs +$69k) - it was more penalized by the bug
3. **15-year still wins**, but by much less ($57k vs $142k)
4. **Why 15-year still wins**: Lower total interest paid, even with "cheap money"

## Files Changed

###lib/calculator.ts

**Changed the `calculateEquity` function** (lines 76-82):
```typescript
// Before
const percentagePaidOff = amountPaidOff / originalLoanAmount;
return percentagePaidOff * currentHomeValue;

// After
return currentHomeValue - currentBalance;
```

**Updated two call sites** in `runModel`:
- Month 0 equity calculation (line 147)
- Monthly equity calculation (line 231)

Both now call `calculateEquity()` instead of calculating inline.

### lib/calculator.test.ts

Updated all equity unit tests to expect correct values based on `homeValue - loanBalance`.

### lib/calculator.sanity.test.ts

Updated sanity checks:
- Minimal down payment test: expects equity = down payment amount
- Mathematical consistency test: verifies `equity = homeValue - loanBalance`
- Loan term comparison test: updated equity difference expectations

## Tests

- **All 92 tests pass** with the corrected formula
- Added comprehensive tests for the correct equity calculation
- Removed the bug demonstration test (bug is now fixed)

## Credit

Bug discovered through user question: *"After 15 years, I own the whole house either way, so the only difference is interest paid and timing, right?"*

**Absolutely correct.** This insight exposed the fundamental flaw in the equity calculation.
