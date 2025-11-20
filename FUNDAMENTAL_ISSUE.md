# Fundamental Issue with NPV Calculation Approach

## The Problem

The calculator includes **equity changes** as positive cash flows, which makes principal payments appear NPV-neutral. This is conceptually wrong when there's a spread between the discount rate and mortgage rate.

## How It Currently Works

Month 1 cash flows:
```
15-year mortgage:
  Mortgage payment:     -$2,944
  Equity increase:      +$2,868  (principal portion)
  Other costs:          -$2
  -------------------------------
  Net cash flow:        -$1,078  (just interest + other costs)

30-year mortgage:
  Mortgage payment:     -$1,893
  Equity increase:      +$1,817  (principal portion)
  Other costs:          -$2
  -------------------------------
  Net cash flow:        -$1,078  (just interest + other costs)
```

**The net cash flows are identical!** Principal payments cancel out because equity increases by the same amount.

## Why This Is Wrong

When discount rate (7%) > mortgage rate (4%), you have **cheap money**:

- Each $1 of extra principal payment has an **opportunity cost of 7%**
- But you're only saving **4% interest** on that debt
- **Net opportunity loss: 3% per year**

By treating principal as NPV-neutral (cash out = equity in), the calculator **ignores this 3% opportunity cost**.

## User's Correct Intuition

> "With a 7% discount rate and 4% mortgage, I should prefer the 30-year because I could invest the payment difference at 7%"

**This is financially correct!** But the calculator doesn't capture this because:

1. Principal payments net to zero (equity offsets them)
2. Only the interest portion affects NPV
3. Both mortgages have similar interest costs in early years
4. So NPVs are similar, when they shouldn't be

## What Should Happen

With a 7% discount rate and 4% mortgage:

**30-year should have better NPV** because:
- Lower monthly payments = more money available
- That money could be invested at 7%
- You're only paying 4% on the debt
- 3% annual arbitrage opportunity

**15-year has worse NPV** because:
- Higher monthly payments tie up more capital
- That capital could earn 7% elsewhere
- You're paying down 4% debt faster than you should

## The Conceptual Error

The calculator uses a **"net worth"** approach:
- Assets (home equity) - Liabilities (loan) - Cash paid = Net position
- This is useful for tracking total wealth
- But it's NOT the same as NPV with opportunity cost

**True NPV approach**:
- Only count actual cash flows (payments, not equity)
- Discount rate captures opportunity cost implicitly
- Don't add equity back - it's already in the asset (the home you'll own)

## Two Valid Approaches

### Approach 1: Cash Flow Only (What Most NPV Calcs Do)
```
Cash flows:
  - Down payment
  - Monthly mortgage payments (principal + interest)
  - Property taxes, insurance, maintenance, HOA
  - Home sale proceeds at end (if modeling sale)

Do NOT include:
  - Equity changes (that's double-counting the asset)
```

### Approach 2: Net Worth Tracking (What This Calculator Does)
```
Net worth change each period:
  - Cash paid (down payment, monthly payments, costs)
  + Equity gained (principal + appreciation)
  = Net worth change

This is useful for "how much wealth do I have?"
But NOT equivalent to NPV with opportunity cost
```

## Why Equity Cancellation Happens

When you pay $1,000 in principal:
- **Cash flow:** -$1,000 (money leaves your pocket)
- **Equity:**  +$1,000 (home equity increases)
- **Net:**      $0

This makes sense for **net worth tracking**, but for **NPV analysis**:
- That $1,000 has opportunity cost
- It could have been invested at the discount rate
- Paying down low-interest debt with high-opportunity-cost money destroys value

## The Fix (If We Want True NPV)

**Option 1**: Remove equity from cash flows entirely
- Only track actual cash out (payments)
- Add home value at the end if modeling sale
- This is the standard NPV approach

**Option 2**: Apply opportunity cost to principal
- When you pay $1 principal:
  - Cash out: -$1
  - Equity in: +$1
  - Opportunity cost: -(discount_rate - mortgage_rate) × principal_payment
  - This captures the value destroyed by using 7% money to pay 4% debt

**Option 3**: Document that this is net worth tracking, not pure NPV
- Be clear this answers: "What's my net worth trajectory?"
- NOT: "Should I choose 15 or 30 year with these rates?"

## Conclusion

The user is absolutely correct. With discount rate > mortgage rate:
- **30-year SHOULD have better NPV** (from an opportunity cost perspective)
- **Calculator shows 15-year as better** (because it ignores opportunity cost of principal)
- **The equity offset makes principal payments appear free** (they're not - they have opportunity cost)

This is a fundamental limitation of the "net worth tracking" approach when used for decision-making about loan terms.
