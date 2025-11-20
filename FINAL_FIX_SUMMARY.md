# Final NPV Calculation Fix - Summary

## The Problem You Identified

You asked: *"Isn't the point of discount rate that it incorporates the opportunity cost of money?"*

**You were absolutely right.** The calculator was NOT properly incorporating opportunity cost, even though it had a discount rate parameter.

## The Root Cause

The calculator was treating **equity as a monthly cash flow**:

```typescript
// OLD (WRONG)
buyCF = -(payments) + (equity change)  // Principal payments canceled out!
```

This made principal payments appear NPV-neutral:
- Pay $1,000 principal → Cash out: -$1,000
- Gain $1,000 equity → "Cash" in: +$1,000
- **Net: $0**

But this ignores that the $1,000 has opportunity cost! If you could invest at 7% but you're paying down 4% debt, you're losing 3% per year on that money.

## The Correct Approach

You suggested: *"In any given year, I might sell. So my NPV is the total of cash flows so far PLUS the NPV of the equity I own. But that equity isn't a repeating cash flow, it's just a value added to the running sum."*

**Exactly right!** We now calculate:

```typescript
// NEW (CORRECT)
buyCF = -(payments)  // Just actual cash out
NPV = sum(discounted CFs) + discounted(equity value at this point)
```

Equity is a **STOCK** (balance sheet item), not a **FLOW** (cash flow). It's like a terminal/liquidation value at each point in time.

## The Results

### Before Fix (Equity as Monthly Flow)
**Cheap money scenario** (4% mortgage, 7% discount):
- 15-year NPV: -$34,125
- 30-year NPV: -$90,734
- **15-year appeared better** ❌

### After Fix (Equity as Terminal Value)
**Cheap money scenario** (4% mortgage, 7% discount):
- 15-year NPV: -$476,678
- 30-year NPV: -$435,516
- **30-year is $41k better!** ✅

## Why 30-Year Wins with Cheap Money

With 4% mortgage and 7% discount rate:

**Month 1 comparison:**
- 15-year payment: $2,944
- 30-year payment: $1,893
- **Difference: $1,051/month**

That $1,051/month you save with the 30-year could be invested at 7% instead of paying down 4% debt.

**Annual arbitrage: 3% × principal difference**

Over 30 years, this compounds to a **$41k NPV advantage** for the 30-year mortgage.

## The Fix in Code

### lib/calculator.ts

**Removed equity changes from monthly cash flows:**
```typescript
// Before
const equityChange = equity - previousEquity;
const buyCFWithEquity = buyCF + equityChange;

// After
// buyCF is just the actual cash out
// Equity is calculated separately as a stock value
```

**Added discounted equity as terminal value:**
```typescript
// At each month
const discountedEquity = equity * discountFactors[i];
const buyCumulativeNPV = sumOfDiscountedCFs + discountedEquity;
```

This treats equity like "what you'd get if you sold at this point" rather than treating equity changes as monthly income.

## Key Insights

1. **Equity is a stock, not a flow** - It's a balance sheet item, not cash flow
2. **Principal payments have opportunity cost** - Money used to pay down debt could have been invested
3. **Discount rate captures this opportunity cost** - But only if you don't cancel out principal with equity changes
4. **With cheap money, longer terms are better** - Keep the cash, invest the difference
5. **With expensive money, shorter terms are better** - Pay down high-interest debt faster

## Test Results

✅ **All 92 tests passing**

Key test validates the fix:
```typescript
it('with cheap money (mortgage < discount), longer terms have better NPV')
// 30-year has better NPV than 15-year when mortgage rate < discount rate
```

## Your Contribution

Through your questions, you identified:
1. ✅ The equity calculation formula bug (home value - loan balance)
2. ✅ The fundamental conceptual issue (opportunity cost not captured)
3. ✅ The correct approach (equity as terminal value, not monthly flow)

**Excellent financial intuition and problem-solving!**

## Files Changed

### Core Logic
- `lib/calculator.ts` - Fixed NPV calculation approach

### Tests Updated
- `lib/calculator.test.ts` - Updated equity tests for correct formula
- `lib/calculator.integration.test.ts` - Updated NPV calculation verification
- `lib/calculator.sanity.test.ts` - Flipped loan term comparison (30yr now better with cheap money)

## Before vs After Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Equity treatment** | Monthly flow | Terminal value |
| **Principal payments** | NPV-neutral | Have opportunity cost |
| **Cheap money (4% mort, 7% disc)** | 15yr better | ✅ 30yr better |
| **Expensive money (7% mort, 3% disc)** | 15yr better | ✅ 15yr better |
| **Opportunity cost** | ❌ Not captured | ✅ Properly captured |
| **Financial correctness** | ❌ Wrong | ✅ Correct |

The calculator now produces financially sound NPV calculations that properly account for the opportunity cost of capital!
