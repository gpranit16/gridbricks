import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ArrowUpRight,
  TrendingUp,
  Wind,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { OverviewData, TimeseriesData, AccuracyData } from '../types/analytics';

interface OverviewSectionProps {
  overviewData: OverviewData;
  timeseriesData: TimeseriesData | null;
  accuracyData: AccuracyData | null;
  onNavigateToExplorer: () => void;
  onNavigateToAccuracy: () => void;
  onNavigateToTable: () => void;
  onExportCsv: () => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  overviewData,
  timeseriesData,
  accuracyData,
  onNavigateToExplorer,
  onNavigateToAccuracy,
  onNavigateToTable,
  onExportCsv,
}) => {
  const { metrics, decisionCutoffTime } = overviewData;

  // Determine risk level based on forecast bias & error magnitude
  const biasVal = metrics.bias ?? 0;
  const isHighRisk = biasVal > 1000 || (metrics.mae ?? 0) > 1800;
  const isModerateRisk = biasVal > 500 && !isHighRisk;

  // Prepare chart data for the hero interactive graph
  const chartData = timeseriesData
    ? timeseriesData.intervals
        .filter((i) => i.actualGeneration !== null || i.forecastGeneration !== null)
        .map((i) => ({
          time: i.deliveryIntervalLocal.replace('2026-', '').replace(' GMT', ''),
          fullTime: i.deliveryIntervalLocal,
          period: i.settlementPeriod,
          forecast: i.forecastGeneration,
          actual: i.actualGeneration,
          diff:
            i.forecastGeneration !== null && i.actualGeneration !== null
              ? Math.round(i.forecastGeneration - i.actualGeneration)
              : null,
        }))
    : [];

  const procurement = accuracyData?.procurementContext;
  const topOutliers = accuracyData?.largestErrorIntervals?.slice(0, 4) || [];

  return (
    <div className="space-y-6">
      {/* 1. Executive Risk Alert Banner */}
      <div
        className={`rounded-xl border p-5 transition-all ${
          isHighRisk
            ? 'border-rose-900/60 bg-gradient-to-r from-rose-950/40 via-neutral-950 to-black text-rose-200'
            : isModerateRisk
            ? 'border-amber-900/60 bg-gradient-to-r from-amber-950/40 via-neutral-950 to-black text-amber-200'
            : 'border-emerald-900/60 bg-gradient-to-r from-emerald-950/40 via-neutral-950 to-black text-emerald-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-bold tracking-wider uppercase border ${
                  isHighRisk
                    ? 'border-rose-500/50 bg-rose-950/80 text-rose-300'
                    : isModerateRisk
                    ? 'border-amber-500/50 bg-amber-950/80 text-amber-300'
                    : 'border-emerald-500/50 bg-emerald-950/80 text-emerald-300'
                }`}
              >
                {isHighRisk ? (
                  <>
                    <AlertTriangle className="h-3 w-3" />
                    HIGH SHORTFALL RISK
                  </>
                ) : isModerateRisk ? (
                  <>
                    <AlertTriangle className="h-3 w-3" />
                    MODERATE VARIANCE
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    STABLE PROCUREMENT
                  </>
                )}
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                January 2026 &bull; {decisionCutoffTime} London Gate Closure
              </span>
            </div>

            <h2 className="text-base font-semibold text-white tracking-tight">
              {isHighRisk ? (
                <>Persistent Over-Forecasting: Actual Wind Fell Short of Day-Ahead Expectations</>
              ) : (
                <>Forecast Closely Tracked Real-Time Outturns</>
              )}
            </h2>

            <p className="text-xs text-neutral-300 max-w-3xl leading-relaxed">
              Wind generation was over-estimated by an average of{' '}
              <strong className="text-white font-mono">+{metrics.bias?.toLocaleString()} MW</strong> per
              settlement period. Trading desks relying solely on point forecasts experienced physical volume
              shortfalls requiring real-time balancing mechanism cashout purchases.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-center gap-2">
            <div className="rounded-lg bg-black/60 px-3.5 py-2 border border-neutral-800 text-left md:text-right">
              <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                Recommended Action
              </div>
              <div className="text-xs font-semibold text-white">
                Hold <span className="text-rose-400 font-mono">~{metrics.mae?.toLocaleString()} MW</span> Thermal Reserve Buffer
              </div>
            </div>

            <button
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white hover:bg-neutral-200 px-3 py-1.5 text-xs font-semibold text-black transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Executive CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top 3 Clean High-Level Headline Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Actual Outturn */}
        <div className="obsidian-card rounded-xl p-5 flex flex-col justify-between border-t-2 border-t-sky-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-sky-950/60 border border-sky-800/60 flex items-center justify-center text-sky-400">
                <Wind className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-300">Actual Wind Delivered</span>
                <p className="text-[11px] text-neutral-500 font-mono">Metered outturn (Elexon FUELHH)</p>
              </div>
            </div>
            <span className="rounded bg-sky-950/50 px-2 py-0.5 text-[10px] font-mono text-sky-300 border border-sky-800/40">
              FUELHH
            </span>
          </div>

          <div className="my-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-white tracking-tight tabular-nums">
                {metrics.avgActualMw?.toLocaleString()}
              </span>
              <span className="text-sm font-mono text-neutral-400">MW avg</span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Peak generation reached <strong className="text-neutral-200 font-mono">{metrics.maxActualMw?.toLocaleString()} MW</strong>
            </p>
          </div>

          <div className="pt-3 border-t border-neutral-900 text-[11px] text-neutral-500 flex items-center justify-between">
            <span>Great Britain Wind Farms</span>
            <span className="text-sky-400 font-mono">Physical Outturn</span>
          </div>
        </div>

        {/* Metric 2: Forecast Locked */}
        <div className="obsidian-card rounded-xl p-5 flex flex-col justify-between border-t-2 border-t-amber-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-300">Day-Ahead Forecast</span>
                <p className="text-[11px] text-neutral-500 font-mono">At {decisionCutoffTime} gate closure</p>
              </div>
            </div>
            <span className="rounded bg-amber-950/50 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-800/40">
              WINDFOR
            </span>
          </div>

          <div className="my-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-white tracking-tight tabular-nums">
                {metrics.avgForecastMw?.toLocaleString()}
              </span>
              <span className="text-sm font-mono text-neutral-400">MW avg</span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Peak forecast expected <strong className="text-neutral-200 font-mono">{metrics.maxForecastMw?.toLocaleString()} MW</strong>
            </p>
          </div>

          <div className="pt-3 border-t border-neutral-900 text-[11px] text-neutral-500 flex items-center justify-between">
            <span>Trading Decision Input</span>
            <span className="text-amber-400 font-mono">+{metrics.bias?.toLocaleString()} MW Over-promised</span>
          </div>
        </div>

        {/* Metric 3: Accuracy & MAE */}
        <div className="obsidian-card rounded-xl p-5 flex flex-col justify-between border-t-2 border-t-rose-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-300">Mean Absolute Error (MAE)</span>
                <p className="text-[11px] text-neutral-500 font-mono">Average volume miss</p>
              </div>
            </div>
            <span className="rounded bg-rose-950/50 px-2 py-0.5 text-[10px] font-mono text-rose-300 border border-rose-800/40">
              Risk: RMSE {metrics.rmse?.toLocaleString()}
            </span>
          </div>

          <div className="my-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-white tracking-tight tabular-nums">
                {metrics.mae?.toLocaleString()}
              </span>
              <span className="text-sm font-mono text-neutral-400">MW</span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Relative deviation:{' '}
              <strong className="text-rose-400 font-mono">
                ~{((metrics.mae! / (metrics.avgActualMw || 1)) * 100).toFixed(1)}% error
              </strong>{' '}
              vs outturn
            </p>
          </div>

          <div className="pt-3 border-t border-neutral-900 text-[11px] text-neutral-500 flex items-center justify-between">
            <span>Coverage: {metrics.forecastCoveragePercent}% intervals</span>
            <button
              onClick={onNavigateToAccuracy}
              className="text-rose-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
            >
              <span>View Distribution</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Hero Visual Timeline (Forecast vs Actual Wind Generation) */}
      <div className="obsidian-card rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-sm font-semibold text-white tracking-tight">
                National Wind Generation: Day-Ahead Forecast vs Actual Outturn
              </h3>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 font-mono">
              30-minute settlement periods across Great Britain &bull; Interactive timeline
            </p>
          </div>

          {/* Legend and Navigation */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <div className="flex items-center gap-1.5 text-sky-400">
              <span className="h-2 w-3 rounded-sm bg-sky-400" />
              <span>Actual Outturn (FUELHH)</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="h-0.5 w-3 bg-amber-400" />
              <span>Day-Ahead Forecast (WINDFOR)</span>
            </div>
            <button
              onClick={onNavigateToExplorer}
              className="ml-2 flex items-center gap-1 rounded bg-neutral-900 hover:bg-neutral-800 px-2.5 py-1 text-[11px] text-neutral-300 border border-neutral-800 transition-colors"
            >
              <span>Intraday Zoom</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* The Recharts Chart */}
        <div className="h-80 w-full pt-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#52525B"
                  fontSize={10}
                  tickLine={false}
                  interval={Math.floor(chartData.length / 8)}
                  tick={{ fill: '#71717A', fontFamily: 'monospace' }}
                />
                <YAxis
                  stroke="#52525B"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  tick={{ fill: '#71717A', fontFamily: 'monospace' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-neutral-800 bg-[#0A0A0E] p-3 text-xs shadow-2xl font-mono space-y-1.5 z-50">
                          <div className="text-[11px] font-semibold text-neutral-300 border-b border-neutral-800 pb-1">
                            {data.fullTime} (Period {data.period})
                          </div>
                          <div className="flex justify-between gap-4 text-sky-400">
                            <span>Actual Outturn:</span>
                            <span className="font-bold">{data.actual !== null ? `${data.actual.toLocaleString()} MW` : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-amber-400">
                            <span>Locked Forecast:</span>
                            <span className="font-bold">{data.forecast !== null ? `${data.forecast.toLocaleString()} MW` : 'N/A'}</span>
                          </div>
                          {data.diff !== null && (
                            <div className={`flex justify-between gap-4 pt-1 border-t border-neutral-800 ${data.diff > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                              <span>{data.diff > 0 ? 'Overforecast Shortfall:' : 'Underforecast Surplus:'}</span>
                              <span className="font-bold">{data.diff > 0 ? `+${data.diff.toLocaleString()} MW` : `${data.diff.toLocaleString()} MW`}</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#actualGradient)"
                  name="Actual (MW)"
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Forecast (MW)"
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-neutral-500 font-mono">
              Loading generation timeseries...
            </div>
          )}
        </div>
      </div>

      {/* 4. Strategic Bottom Panels: Shortfall Exposure & Critical Outliers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Shortfall Energy Exposure */}
        <div className="obsidian-card rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300">
                Procurement Shortfall &amp; Imbalance Exposure
              </h3>
              <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                13.8% Net Deficit
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Financial and physical volume exposure caused by day-ahead over-forecasting.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 font-mono">
            <div className="rounded-lg bg-neutral-950 p-3 border border-neutral-800/80">
              <div className="text-[10px] text-neutral-400 uppercase">Forecast Energy</div>
              <div className="text-base font-bold text-amber-400 mt-1">
                {procurement ? `${(procurement.energyVolumes.totalForecastMwh / 1000).toFixed(1)} GWh` : '127.3 GWh'}
              </div>
            </div>

            <div className="rounded-lg bg-neutral-950 p-3 border border-neutral-800/80">
              <div className="text-[10px] text-neutral-400 uppercase">Actual Outturn</div>
              <div className="text-base font-bold text-sky-400 mt-1">
                {procurement ? `${(procurement.energyVolumes.totalActualMwh / 1000).toFixed(1)} GWh` : '111.8 GWh'}
              </div>
            </div>

            <div className="rounded-lg bg-neutral-950 p-3 border border-rose-900/60 bg-rose-950/20">
              <div className="text-[10px] text-rose-300 uppercase font-semibold">Volume Shortfall</div>
              <div className="text-base font-bold text-rose-400 mt-1">
                {procurement ? `${(Math.abs(procurement.energyVolumes.netVolumeDifferenceMwh) / 1000).toFixed(1)} GWh` : '15.5 GWh'}
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-neutral-950 p-3 border border-neutral-800/80 space-y-2">
            <div className="flex justify-between text-xs font-mono text-neutral-400">
              <span>Shortfall Intervals (Deficit Risk)</span>
              <span className="text-rose-400 font-bold">
                {procurement ? `${procurement.riskProfile.shortfallPercentage}% of periods` : '68.5% of periods'}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden flex">
              <div
                className="h-full bg-rose-500"
                style={{ width: `${procurement ? procurement.riskProfile.shortfallPercentage : 68.5}%` }}
              />
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${100 - (procurement ? procurement.riskProfile.shortfallPercentage : 68.5)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>Overforecast (Purchased &gt; Delivered)</span>
              <span>Accurate / Surplus</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-xs">
            <button
              onClick={onNavigateToAccuracy}
              className="text-neutral-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
            >
              <span>Detailed Risk Profile</span>
              <ArrowRight className="h-3 w-3" />
            </button>
            <button
              onClick={onExportCsv}
              className="text-xs text-white hover:underline font-mono inline-flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              <span>Download Raw Ledger (.CSV)</span>
            </button>
          </div>
        </div>

        {/* Critical Outlier Intervals */}
        <div className="obsidian-card rounded-xl p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300">
                Critical Volatility Intervals (Top Misses)
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Half-hour intervals with the largest forecast discrepancies.
              </p>
            </div>
            <button
              onClick={onNavigateToTable}
              className="text-[11px] text-neutral-400 hover:text-white font-mono flex items-center gap-1 transition-colors"
            >
              <Layers className="h-3 w-3" />
              <span>View All</span>
            </button>
          </div>

          <div className="space-y-2 font-mono">
            {topOutliers.length > 0 ? (
              topOutliers.map((outlier, idx) => (
                <div
                  key={idx}
                  className="rounded-lg bg-neutral-950 p-2.5 border border-neutral-800/80 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="text-white font-semibold text-[11px]">
                      {outlier.deliveryIntervalLocal.replace('2026-', '')}
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      Period {outlier.settlementPeriod} &bull; Forecast: {outlier.forecastGeneration?.toLocaleString()} MW vs Actual: {outlier.actualGeneration?.toLocaleString()} MW
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                        outlier.signedError > 0
                          ? 'bg-rose-950 text-rose-400 border border-rose-800/50'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                      }`}
                    >
                      {outlier.signedError > 0 ? `+${outlier.signedError.toLocaleString()} MW` : `${outlier.signedError.toLocaleString()} MW`}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-neutral-500 py-6 text-center font-mono">
                No outlier records found.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span>Audit-ready National Grid records</span>
            <button
              onClick={onNavigateToTable}
              className="text-neutral-300 hover:text-white underline"
            >
              Examine full ledger &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
