# Analytical Methodology & Statistical Foundations

## 1. Wholesale Power Procurement Context

In the Great Britain electricity market, wholesale electricity trading takes place across multiple time horizons:
1. **Day-Ahead Market (Auctions)**: Bids and offers are cleared before delivery day $D+1$.
2. **Intraday Market**: Continuous trading up to gate closure (1 hour before real-time delivery).
3. **Balancing Mechanism (BM)**: The National Energy System Operator (NESO) balances physical supply and demand in real time.

Wholesale procurement teams must decide how much power to purchase in the day-ahead auctions. Because wind generation is non-dispatchable and weather-dependent, power purchasers rely on day-ahead wind forecasts to estimate how much baseload and thermal power (e.g. CCGT, biomass, or interconnectors) must be scheduled to serve retail customer load.

---

## 2. Decision Logic and Cutoff Enforcement

### 2.1 Timeline Mapping
- **Purchasing Decision Date ($D$)**: The date the procurement trader submits binding auction orders. Default analytical period is **1 January 2026 through 31 January 2026**.
- **Delivery Date ($D + 1$)**: The physical delivery day corresponding to the decision made on Date $D$. This covers **2 January 2026 through 1 February 2026**.
- **Settlement Periods (SP 1 to SP 48)**: Each delivery day in the UK is divided into 48 half-hour settlement periods starting at 00:00:00 London local time.

### 2.2 Gate Closure Cutoff
Standard UK Day-Ahead power exchange order books close at **11:00 London local time** (e.g. EPEX SPOT UK Day-Ahead and Nord Pool / N2EX auctions).
- **Timezone Awareness**: The cutoff time is interpreted in `Europe/London` (accounting for GMT in winter and BST in summer) and converted to UTC for comparison.
- **Eligibility Rule**:
  $$\text{Eligible Candidates}(T) = \{ F \in \text{WINDFOR} \mid F.\text{startTime} = T \land F.\text{publishTime} \le \text{Cutoff}(D) \}$$
- **Selection Rule**:
  $$\text{Selected Forecast}(T) = \arg\max_{F \in \text{Eligible Candidates}(T)} (F.\text{publishTime})$$
- Forecasts published *after* the cutoff are strictly excluded from that decision's forecast.
- When duplicate records share both identical target intervals and identical publication timestamps, a deterministic deduplication rule resolves the record.

---

## 3. Data Alignment & Status Tracking

Each half-hourly delivery interval $T$ is assigned one of four definitive statuses:

| Status | Condition | Handling |
|---|---|---|
| `MATCHED` | Forecast exists before cutoff AND Actual exists | Paired error calculation |
| `MISSING_FORECAST` | Actual exists, but no forecast published before cutoff | Flagged; excluded from error formulas |
| `MISSING_ACTUAL` | Forecast exists, but no outturn recorded in FUELHH | Flagged; excluded from error formulas |
| `MISSING_BOTH` | Neither forecast nor actual available | Flagged; excluded from error formulas |

> **Note on Elexon Cadence:** Elexon WINDFOR forecasts in historical streams are often published at hourly intervals for longer-horizon forecasts. Where half-hour intervals lack an explicit publication, they are flagged transparently as `MISSING_FORECAST` rather than inventing synthetic numbers.

---

## 4. Mathematical Formulations

All error metrics are computed strictly on the subset of $N$ intervals where $\text{status} = \text{MATCHED}$.

### 4.1 Mean Absolute Error (MAE)
Measures the average magnitude of forecast errors in Megawatts (MW):
$$\text{MAE} = \frac{1}{N} \sum_{i=1}^{N} \left| F_i - A_i \right|$$

### 4.2 Root Mean Squared Error (RMSE)
Gives quadratic penalty to large outlier errors, reflecting the high non-linear cost of real-time balancing imbalance cashout:
$$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (F_i - A_i)^2}$$

### 4.3 Mean Forecast Bias
Measures directional tendency of the forecast:
$$\text{Bias} = \frac{1}{N} \sum_{i=1}^{N} (F_i - A_i)$$
- **$\text{Bias} > 0$ (Overforecasting)**: Forecast exceeded actual generation. The utility faced an unhedged volume shortfall in real time and had to purchase emergency balancing power.
- **$\text{Bias} < 0$ (Underforecasting)**: Actual generation exceeded forecast. The utility had surplus wind and sold it into the imbalance market.

### 4.4 Forecast Coverage
$$\text{Coverage} = \left( \frac{N_{\text{matched}}}{N_{\text{expected}}} \right) \times 100\%$$

### 4.5 Safe Mean Absolute Percentage Error (MAPE)
To avoid division by zero or distortion during near-zero wind conditions, MAPE is computed strictly on intervals where $A_i \ge 50 \text{ MW}$:
$$\text{MAPE} = \frac{1}{K} \sum_{i=1, A_i \ge 50}^{K} \left( \frac{|F_i - A_i|}{A_i} \right) \times 100\%$$

---

## 5. Critical Boundaries for Procurement Decisions

The Elexon datasets provide national transmission system wind generation. They **do not** contain:
1. Consumer retail electricity demand profiles.
2. The utility's specific Power Purchase Agreements (PPAs) or contracted asset fractions.
3. Thermal generation heat rates, spark spreads, or fuel costs.
4. Hourly day-ahead clearing prices on EPEX or N2EX.

Therefore, the application explicitly warns procurement leads that retrospective wind forecast errors cannot be equated directly with total electricity purchase requirements without integrating demand and price data.
