# Product Demonstration Script: Customer Pitch (Part 1)

**Target Audience:** Energy Utility Wholesale Power Procurement Team (UK)  
**Tone:** Confident, professional, consultative, value-focused  
**Target Duration:** 4 minutes 45 seconds (Max 5 minutes)  
**Visual Recording Reference:** `uk_wind_dashboard_demo_1792879802077.webp`

---

## Script Breakdown & Timeline

### 0:00 – 0:40 | The Business Challenge
* **Visual:** Browser showing the GridBricks terminal on the Executive Overview page (`http://localhost:5173`).
* **Speaker:**
  > "Good morning team. As wholesale power procurement managers in the UK electricity market, your core objective every single day is straightforward yet high-stakes: procure the right volume of power from the day-ahead wholesale market to serve your retail consumers at minimum cost and risk.
  >
  > Because wind generation is highly weather-dependent and non-dispatchable, you have to decide by 11:00 AM gate closure how much thermal power to schedule. If wind generation turns out significantly lower than forecast, you face painful cash-out penalties in the Balancing Mechanism. If it turns out much higher, you've over-bought expensive thermal hedges.
  >
  > To solve this, we built **GridBricks** — a dedicated analytics terminal that reconstructs the exact wind forecast available to you at gate closure and provides rigorous quantitative accuracy metrics."

---

### 0:40 – 1:40 | Executive Overview Dashboard
* **Visual:** Pointing out the Executive Overview top banner, the January 2026 purchasing window pills, and the 8 KPI cards.
* **Speaker:**
  > "Here on the Executive Overview, you see our baseline evaluation for **January 2026 purchasing decisions**.
  >
  > Notice the date mapping: for decisions submitted between January 1st and January 31st, power is delivered across January 2nd through February 1st.
  >
  > Looking at the key indicators:
  > - Our average forecast wind generation at decision cutoff was **16,643 MW**.
  > - Outturn metered generation recorded by Elexon FUELHH averaged **14,616 MW**.
  > - This yields a **Mean Absolute Error (MAE)** of **2,036 MW**, representing roughly a 13.9% average deviation.
  > - Most crucially, observe our **Mean Forecast Bias of +2,026 MW**. This indicates a persistent overforecasting bias during this period. In practical trading terms, relying purely on the point forecast would have left your desk short on energy in real time, forcing expensive imbalance purchases."

---

### 1:40 – 2:40 | Forecast Explorer & Interactive Time-Series
* **Visual:** Clicking to the **Forecast Explorer** tab. Hovering over peak generation days on the Recharts graph. Dragging the bottom timeline brush to zoom into Week 1.
* **Speaker:**
  > "Let's switch to the **Forecast Explorer**. Here we see the full national generation timeline.
  >
  > The cyan line represents the latest forecast published before the 11:00 AM decision cutoff from Elexon WINDFOR, while the emerald green line shows metered actuals from FUELHH.
  >
  > If I click on any specific half-hour interval — for example, Settlement Period 1 on January 2nd — our **Interval Inspector** instantly reveals:
  > - Exactly when that forecast was issued (January 1st at 09:30 UTC, comfortably ahead of the 11:00 AM cutoff).
  > - The anticipated output of 18,699 MW versus actual outturn of 15,228 MW, showing an ex-post shortfall of 3,471 MW.
  >
  > The user can also toggle the amber Error Area or drag the timeline brush below to isolate specific wind ramps or cold snaps."

---

### 2:40 – 3:50 | Quantitative Accuracy & Risk Profiling
* **Visual:** Navigating to the **Forecast Accuracy** tab. Demonstrating the Error Distribution histogram and the Imbalance Risk progress bar.
* **Speaker:**
  > "Moving to the **Forecast Accuracy** tab, we move from visual comparison to statistical risk quantification.
  >
  > Here is the **Error Distribution Histogram**:
  > - Bins to the left (cyan) represent wind surplus.
  > - Bins to the right (amber) represent overforecasting risk.
  > - Notice that the majority of intervals fall into the +1,000 to +3,000 MW and >3,000 MW error buckets.
  >
  > In fact, our **Imbalance Risk Profile** shows that **97.2% of evaluated intervals** exhibited a wind shortfall relative to the gate-closure forecast, with an average shortfall magnitude of nearly 2,089 MW.
  >
  > Right below, we identify the **Top 10 Outlier Intervals** where errors exceeded 4,000 MW, enabling trading analysts to conduct post-mortem reviews on meteorological front passages."

---

### 3:50 – 4:35 | Procurement Context & Analytical Guardrails
* **Visual:** Scrolling to the **Critical Analytical Limitations** section.
* **Speaker:**
  > "We also believe strongly in professional analytical honesty. Notice this dedicated **Procurement Limitations Panel**.
  >
  > We make it crystal clear to your trading team:
  > 1. Elexon data represents **National GB generation**, not your individual retail customer portfolio.
  > 2. Total procurement requires **Consumer Demand Profiles**, **PPAs**, and **Wholesale Power Prices**, which are not in the single-fuel Elexon feed.
  > 3. Therefore, this tool never manufactures fictitious purchase recommendations. Instead, it provides the precise reserve margin buffer your traders need to hold."

---

### 4:35 – 5:00 | Business Value & Closing Summary
* **Visual:** Switching to **Tabular Data**, clicking **Export CSV**, then returning to the Executive Overview.
* **Speaker:**
  > "Finally, every single half-hourly interval can be searched, sorted, and exported directly to CSV for your internal trading risk models.
  >
  > In summary, GridBricks empowers your procurement desk to:
  > 1. Quantify forecast risk before placing day-ahead orders.
  > 2. Replace guesswork with proven statistical bounds (MAE and Bias).
  > 3. Directly reduce imbalance cash-out exposure.
  >
  > Thank you, and we welcome your questions."
