"""
Procurement Context and Business Logic Module
Explicitly articulates wholesale power purchasing implications and clearly documents
analytical boundaries regarding consumer electricity demand and thermal procurement.
"""

from typing import Dict, Any, List


class ProcurementContextService:
    @staticmethod
    def generate_procurement_context(
        summary_metrics: Dict[str, Any],
        aligned_records: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generates procurement context and analytical guardrails for energy utility traders.
        """
        matched = [r for r in aligned_records if r["status"] == "MATCHED"]
        
        # Calculate aggregate wind volume
        # Each half hour interval represents MWh = MW * 0.5 hours
        total_forecast_mwh = sum(r["forecastGeneration"] * 0.5 for r in matched) if matched else 0.0
        total_actual_mwh = sum(r["actualGeneration"] * 0.5 for r in matched) if matched else 0.0
        net_difference_mwh = total_forecast_mwh - total_actual_mwh
        
        # Count shortfall vs surplus intervals (retrospective actual vs forecast)
        # Shortfall: Actual < Forecast (trader over-estimated wind, faced unexpected deficit in real-time)
        # Surplus: Actual > Forecast (trader under-estimated wind, faced unexpected excess in real-time)
        shortfall_intervals = [r for r in matched if r["signedError"] > 0]  # Forecast > Actual
        surplus_intervals = [r for r in matched if r["signedError"] < 0]    # Forecast < Actual
        
        shortfall_count = len(shortfall_intervals)
        surplus_count = len(surplus_intervals)
        
        # Average shortfall magnitude when overforecasting occurred
        avg_shortfall_mw = (
            round(sum(r["signedError"] for r in shortfall_intervals) / shortfall_count, 2)
            if shortfall_count > 0 else 0.0
        )
        
        # Average surplus magnitude when underforecasting occurred
        avg_surplus_mw = (
            round(sum(abs(r["signedError"]) for r in surplus_intervals) / surplus_count, 2)
            if surplus_count > 0 else 0.0
        )
        
        return {
            "energyVolumes": {
                "totalForecastMwh": round(total_forecast_mwh, 2),
                "totalActualMwh": round(total_actual_mwh, 2),
                "netVolumeDifferenceMwh": round(net_difference_mwh, 2),
                "unit": "MWh"
            },
            "riskProfile": {
                "shortfallIntervalsCount": shortfall_count,
                "shortfallPercentage": round(shortfall_count / len(matched) * 100, 1) if matched else 0.0,
                "avgShortfallMw": avg_shortfall_mw,
                "surplusIntervalsCount": surplus_count,
                "surplusPercentage": round(surplus_count / len(matched) * 100, 1) if matched else 0.0,
                "avgSurplusMw": avg_surplus_mw,
            },
            "procurementLimitations": [
                {
                    "title": "National Aggregation vs Utility Portfolio",
                    "description": "Elexon FUELHH and WINDFOR represent Great Britain national transmission system wind generation. A utility's individual retail demand and Power Purchase Agreements (PPAs) represent a specific fraction or localized sub-portfolio of this total."
                },
                {
                    "title": "Absence of Electricity Consumer Demand",
                    "description": "Net procurement volume required from thermal plants or wholesale power exchanges equals Consumer Demand minus Renewable Generation. The Elexon wind datasets contain no consumer demand data; therefore, calculating total purchase volumes is intentionally unsupported to prevent misleading procurement decisions."
                },
                {
                    "title": "Market Prices & Interconnection Excluded",
                    "description": "Day-ahead procurement optimization depends on hourly power exchange clearing prices (EPEX / N2EX), cross-border interconnector flows, and fuel spark spreads. These market price dynamics lie strictly outside the single-fuel Elexon wind scope."
                },
                {
                    "title": "Retrospective Shortfall vs Decision-Time Foreknowledge",
                    "description": "The wind generation shortfall (Actual < Forecast) is an ex-post accuracy insight discovered after delivery. At gate closure (cutoff time D 11:00), the procurement trader has only the latest eligible forecast and must use historical statistical error distributions (MAE / RMSE / Bias) to calculate prudent reserve margins."
                }
            ],
            "traderGuidance": (
                "When average bias is positive, the day-ahead forecast tends to overstate wind generation. "
                "Traders should factor an error buffer approximately equal to MAE into reserve procurement "
                "to mitigate costly real-time balancing mechanism (BM) cash-out exposure."
            )
        }


procurement_service = ProcurementContextService()
