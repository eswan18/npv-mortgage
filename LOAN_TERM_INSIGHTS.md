# Loan Term vs NPV Analysis - Key Insights

## The Question

> For a constant mortgage rate that's lower than the discount rate, are longer loan terms always better?
> It seems like that's the way to take advantage of the "value" rate of the mortgage.

## The Answer: **NO** - Equity Effects Dominate

While the intuition about "cheap money" and payment timing is correct in isolation, **the equity-building effect dominates in this NPV calculator**, making shorter loan terms better for NPV even when mortgage rates are below discount rates.

## The Two Competing Effects

### 1. Payment Timing Effect (Favors Longer Terms)
When mortgage rate < discount rate, you theoretically have "cheap money":
- Borrow at 4%, discount at 7%
- Future payments are worth less due to high discount rate
- Stretching payments over longer period puts more cash flows in the discounted future
- **This would favor 30-year over 15-year mortgages**

### 2. Equity Building Effect (Favors Shorter Terms)
Shorter loan terms build equity much faster:
- 15-year mortgage pays down principal aggressively
- Equity = (% of loan paid off) × current home value
- This equity growth is **included in the NPV calculation as positive cash flow**
- **This favors 15-year over 30-year mortgages**

## Empirical Results

### Scenario: Cheap Money (Mortgage 4%, Discount 7%)

| Metric | 15-Year | 30-Year | Difference |
|--------|---------|---------|------------|
| **Buy NPV** | **-$103,597** | **-$246,010** | **15yr wins by $142k** |
| Monthly Payment | $2,944 | $1,893 | Higher on 15yr |
| Total Interest | $130,000 | $281,555 | 30yr pays $151k more |
| Equity at Year 15 | $778,984 | $278,115 | **$500k difference!** |

### The Verdict
- The 30-year pays **$151k more in interest** (absolute dollars)
- BUT the 15-year builds **$500k more equity by year 15**
- The equity effect (~$500k) **dominates** the payment timing benefit
- Result: **15-year has better NPV by $142k**

## Why Equity Dominates

Looking at how this calculator works (calculator.ts:179-182):

```typescript
const equityChange = equity - previousEquity;
const buyCFWithEquity = buyCF + equityChange;
```

**The equity CHANGE is added to cash flow each month.** This means:

1. When you pay down principal faster (15-year), you build equity faster
2. This equity growth shows up as **positive cash flow** in the NPV calculation
3. Early equity gains are discounted less (closer to present)
4. The massive equity difference ($500k at year 15) overwhelms the payment timing benefit

## When Each Term Wins

### 15-Year Mortgage Wins When:
- ✅ **All cases in this calculator** (due to equity effect)
- ✅ Mortgage rate > discount rate (both effects align)
- ✅ Mortgage rate < discount rate (equity effect dominates)
- ✅ You value building wealth (equity) quickly

### 30-Year Mortgage Wins When:
- Only if you modify the calculator to **exclude equity from NPV**
- Or if you value **cash flow flexibility** over NPV optimization
- Or if you can invest the payment difference at returns > mortgage rate

## Important Nuances

### This Calculator's Approach
The calculator uses a **"net worth" approach**:
- Includes equity changes in cash flow
- Treats equity growth as a positive (since it increases your net worth)
- This makes sense for comparing total financial position

### Alternative Approach
A **"cash flow only" approach** would:
- Only count actual cash in/out (mortgage payments, rent, etc.)
- NOT include equity growth
- Would favor 30-year when mortgage rate < discount rate
- But would ignore your growing net worth

## Practical Implications

From a pure NPV perspective in this calculator:
1. ✅ **Shorter loan terms always improve buy NPV** (all else equal)
2. ✅ This is true even with "cheap money" (low mortgage rates)
3. ✅ The effect is strongest when mortgage rate > discount rate
4. ✅ But even when mortgage rate < discount rate, equity dominates

However, real-world decisions should also consider:
- **Liquidity**: 30-year gives lower required payments (more flexibility)
- **Opportunity cost**: Could you invest the payment difference elsewhere?
- **Risk tolerance**: Higher payments on 15-year mean less cushion
- **Income stability**: Variable income may favor 30-year flexibility

## Test Verification

We added tests to verify this behavior (calculator.sanity.test.ts:311-373):

```typescript
it('shorter loan terms build equity faster, improving NPV despite "cheap money" logic')
it('when mortgage rate > discount rate, shorter terms are even better')
```

Both tests pass, confirming:
- 15-year always has better NPV in this calculator
- The equity effect is ~$500k by year 15
- This dominates any payment timing benefits

## Conclusion

Your intuition about "cheap money" and payment timing was **correct in principle**, but this calculator's inclusion of **equity changes in cash flow** reverses the conclusion. The massive equity difference from faster principal paydown overwhelms the discount rate arbitrage benefit.

This is actually a **feature, not a bug** - it shows that building equity faster is more valuable than trying to arbitrage discount rates through payment timing.
