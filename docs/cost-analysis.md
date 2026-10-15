# The Ice Realm: start-up cost analysis

This is the financial model for opening **one Ice Realm venue in a metro city**. The venue has two pitches, one 5-a-side and one 7-a-side, on about 25,000 sq ft of leased land.

All figures are in Indian rupees. The inputs live in [`backend/src/main/resources/finance.yml`](../backend/src/main/resources/finance.yml). The same numbers are calculated live by `CostAnalysisService` and served at `GET /api/finance/summary`, so this document and the running app always agree.

## 1. One-time set-up cost (capex)

| Item | ₹ |
|---|---:|
| Artificial turf, 50 mm FIFA-grade (22,000 sq ft at about ₹110/sq ft) | 24,20,000 |
| Civil work, drainage and base | 12,00,000 |
| Lease deposit (6 months) | 9,00,000 |
| LED floodlights | 8,50,000 |
| Fencing and netting | 6,00,000 |
| Changing rooms and washrooms | 5,50,000 |
| Branding and launch | 2,00,000 |
| CCTV, front desk and Wi-Fi | 1,60,000 |
| Goals, balls and bibs | 1,20,000 |
| **Total capex** | **70,00,000** |

The turf and its base account for about half of the investment. That's why the design spends money on drainage, so the pitch is playable through the monsoon.

## 2. Monthly running cost (opex)

| Item | ₹ / month |
|---|---:|
| Staff (manager, 4 ground staff, 2 security) | 1,70,000 |
| Land lease | 1,50,000 |
| Electricity (floodlights run about 6 hours a night) | 65,000 |
| Marketing | 40,000 |
| Turf maintenance (infill top-up, brushing) | 25,000 |
| Water and housekeeping | 20,000 |
| Miscellaneous | 16,000 |
| Insurance | 8,000 |
| Internet and software | 6,000 |
| **Total opex** | **5,00,000** |

Payments come straight into the venue's UPI account, so there is no payment-gateway fee.

## 3. Revenue model

```
Bookable hours / month = 2 pitches x 18 hours (6 am to midnight) x 30 days = 1,080
Gross revenue / month  = 1,080 x occupancy x blended hourly rate
Net revenue / month    = gross / 1.18        (18% GST is collected for the government)
Operating profit       = net revenue - opex
```

The **blended hourly rate of ₹1,650** is the average a player pays across both pitches and all price bands. The 5-a-side ranges from ₹1,200 off-peak to ₹1,500 on weekends, and the 7-a-side from ₹1,800 to ₹2,250. Metro venues get a city price factor on top of these rates. The pricing rules are in `backend/src/main/java/com/icerealm/pricing/`.

## 4. Base case: 60% occupancy

| | ₹ / month |
|---|---:|
| Gross revenue (incl. GST) | 10,69,200 |
| Net revenue (excl. GST) | 9,06,102 |
| Opex | 5,00,000 |
| **Operating profit** | **4,06,102** |

**Break-even: month 18.** 70,00,000 ÷ 4,06,102 = 17.2, so cumulative profit first covers the set-up cost during the 18th month.

**3-year ROI: 108.9%.** That's (4,06,102 x 36 − 70,00,000) ÷ 70,00,000.

### 3-year projection

| Year | Net revenue | Opex | Profit | Cumulative cash |
|---:|---:|---:|---:|---:|
| 0 | | | | −70,00,000 |
| 1 | 1,08,73,224 | 60,00,000 | 48,73,224 | −21,26,776 |
| 2 | 1,08,73,224 | 60,00,000 | 48,73,224 | 27,46,448 |
| 3 | 1,08,73,224 | 60,00,000 | 48,73,224 | 76,19,672 |

## 5. Sensitivity to occupancy

Occupancy is the one number the business controls least, so the plan tests how much it matters:

| Occupancy | Monthly profit | Break-even month | 3-year ROI |
|---:|---:|---:|---:|
| 40% | 1,04,068 | 68 | −46.5% |
| 50% | 2,55,085 | 28 | 31.2% |
| **60%** | **4,06,102** | **18** | **108.9%** |
| 70% | 5,57,119 | 13 | 186.5% |
| 80% | 7,08,136 | 10 | 264.2% |

**How to read this:**
- Each 10 points of occupancy is worth about ₹1.5 lakh of profit a month.
- Below about **33% occupancy** (₹5 lakh opex ÷ ₹15,102 net revenue per occupancy point) the venue loses money every month.
- At 40% the venue covers its running costs but needs more than five years to pay back.

That's why the website's whole design is about filling empty hours:
- The home page leads with *open slots right now*, not a brochure.
- Booking takes two clicks from landing.
- Unpaid holds are released after 15 minutes, so a slot is never blocked by someone who won't pay.

## 6. Assumptions and limits

- Occupancy is flat from day one. A real launch ramps up over 3 to 6 months, which would push break-even out by a few months.
- Income tax and depreciation are left out. This is an operating-cash view.
- Rent, salaries and power are held flat for three years, with no inflation.
- The 30-day month and 18 bookable hours ignore days lost to maintenance and heavy rain. The futsal arena format exists partly to remove that risk.

To try a different scenario, edit `finance.yml` and restart the backend. The API and these formulas will update together.
