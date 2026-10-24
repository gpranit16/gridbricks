import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import {
  AlertTriangle,
  BarChart2,
  TrendingUp,
  ShieldAlert,
  Flame,
  Scale
} from 'lucide-react';
import { AccuracyData } from '../types/analytics';
import { KPICard } from './KPICard';

interface AccuracySectionProps {
  data: AccuracyData;
}

export const AccuracySection: React.FC<AccuracySectionProps> = ({ data }) => {
  const { metrics, errorDistribution, largestErrorIntervals, procurementContext } = data;

  return (
    <div className="space-y-5">
      {/* Accuracy Summary KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Mean Absolute Error (MAE)"
          value={metrics.mae}
          unit="MW"
          subtitle="Baseline forecast accuracy metric"
          highlight={true}
          badge={{ text: 'Required KPI', type: 'warning' }}
        />

        <KPICard
          title="Root Mean Squared Error (RMSE)"
          value={metrics.rmse}
          unit="MW"
          subtitle="Quadratic penalty on outliers"
          badge={{ text: 'Quadratic', type: 'neutral' }}
        />

        <KPICard
          title="Mean Forecast Bias"
          value={metrics.bias ? (metrics.bias > 0 ? `+${metrics.bias}` : metrics.bias) : 0}
          unit="MW"
          subtitle={
            (metrics.bias ?? 0) > 0
              ? 'Average overforecasting (volume deficit in real-time)'
              : 'Average underforecasting (volume surplus in real-time)'
          }
          badge={{
            text: (metrics.bias ?? 0) > 0 ? 'Overforecast' : 'Underforecast',
            type: (metrics.bias ?? 0) > 0 ? 'warning' : 'info',
          }}
        />

        <KPICard
          title="Safe MAPE"
          value={metrics.mape}
          unit="%"
          subtitle="Filtered for actuals >= 50 MW"
          badge={{ text: 'Safe MAPE', type: 'info' }}
        />
      </div>

      {/* Error Distribution & Procurement Volumes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Error Distribution Histogram */}
        <div className="obsidian-card rounded-lg p-5 space-y-3">
          <div>
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-emerald-400" />
              Forecast Error Distribution (Signed MW)
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Interval frequency across error buckets (Forecast &minus; Actual).
            </p>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errorDistribution} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181B" opacity={0.6} />
                <XAxis
                  dataKey="range"
                  stroke="#52525B"
                  tick={{ fill: '#71717A', fontSize: 10, fontFamily: 'monospace' }}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#52525B" tick={{ fill: '#71717A', fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-md border border-neutral-800 bg-neutral-950 p-2.5 text-xs text-white space-y-1 font-mono">
                          <div className="font-semibold text-neutral-200">{item.range}</div>
                          <div className="flex justify-between gap-4">
                            <span className="text-neutral-400">Intervals:</span>
                            <span className="font-bold text-white">{item.count}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                  {errorDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.type === 'overforecast' ? '#F59E0B' : '#38BDF8'}
                      opacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 text-[11px] text-neutral-400 pt-2 border-t border-neutral-800/80 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-sky-400" />
              Underforecast (Surplus Wind)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-amber-400" />
              Overforecast (Shortfall Deficit)
            </span>
          </div>
        </div>

        {/* Procurement Volume & Imbalance Risk */}
        <div className="obsidian-card rounded-lg p-5 space-y-3 flex flex-col justify-between font-mono">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-400" />
                Procurement Volume & Imbalance Risk
              </h3>
              <span className="text-xs text-neutral-400">
                {procurementContext.energyVolumes.unit}
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-sans mt-0.5">
              Aggregated energy volume over the evaluated purchasing window.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-md bg-neutral-950 p-2.5 border border-neutral-800">
              <div className="text-[10px] uppercase text-neutral-400">Total Forecast</div>
              <div className="text-sm font-bold text-sky-400 mt-1">
                {(procurementContext.energyVolumes.totalForecastMwh / 1000).toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                })}k GWh
              </div>
            </div>

            <div className="rounded-md bg-neutral-950 p-2.5 border border-neutral-800">
              <div className="text-[10px] uppercase text-neutral-400">Total Actual</div>
              <div className="text-sm font-bold text-emerald-400 mt-1">
                {(procurementContext.energyVolumes.totalActualMwh / 1000).toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                })}k GWh
              </div>
            </div>

            <div className="rounded-md bg-neutral-950 p-2.5 border border-neutral-800">
              <div className="text-[10px] uppercase text-neutral-400">Net Variance</div>
              <div
                className={`text-sm font-bold mt-1 ${
                  procurementContext.energyVolumes.netVolumeDifferenceMwh > 0
                    ? 'text-amber-400'
                    : 'text-sky-400'
                }`}
              >
                {procurementContext.energyVolumes.netVolumeDifferenceMwh > 0 ? '+' : ''}
                {(procurementContext.energyVolumes.netVolumeDifferenceMwh / 1000).toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                })}k GWh
              </div>
            </div>
          </div>

          <div className="rounded-md bg-neutral-950 p-3 border border-neutral-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">Shortfall Delivery Intervals:</span>
              <span className="text-amber-400 font-semibold">
                {procurementContext.riskProfile.shortfallPercentage}% of intervals
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-neutral-900 overflow-hidden flex">
              <div
                className="bg-amber-400"
                style={{ width: `${procurementContext.riskProfile.shortfallPercentage}%` }}
              />
              <div
                className="bg-sky-400"
                style={{ width: `${procurementContext.riskProfile.surplusPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>{procurementContext.riskProfile.shortfallIntervalsCount} Shortfall Intervals</span>
              <span>{procurementContext.riskProfile.surplusIntervalsCount} Surplus Intervals</span>
            </div>
          </div>

          <div className="rounded-md bg-neutral-950 p-2.5 border border-neutral-800 text-xs font-sans text-neutral-300 leading-relaxed">
            <strong className="text-neutral-200">Guidance:</strong> {procurementContext.traderGuidance}
          </div>
        </div>
      </div>

      {/* Critical Analytical Limitations */}
      <div className="obsidian-card rounded-lg p-5 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-400" />
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-200">
            Critical Analytical Limitations for Procurement Decisions
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {procurementContext.procurementLimitations.map((lim, idx) => (
            <div key={idx} className="rounded-md bg-neutral-950 p-3.5 border border-neutral-800/80 space-y-1">
              <div className="font-semibold text-neutral-200 flex items-center gap-2">
                <span className="font-mono text-neutral-400 text-[11px]">{idx + 1}.</span>
                {lim.title}
              </div>
              <p className="text-neutral-400 text-[11px] leading-relaxed pl-4">{lim.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top 10 Outliers */}
      <div className="obsidian-card rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              Top 10 Largest Absolute Error Intervals
            </h3>
            <p className="text-xs text-neutral-400">
              Discrepancies exceeding 3,000 MW between decision cutoff and physical delivery.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded border border-neutral-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-neutral-800 bg-neutral-950 text-neutral-400 text-[11px] uppercase">
              <tr>
                <th className="py-2.5 px-3">Interval (Local)</th>
                <th className="py-2.5 px-3">SP</th>
                <th className="py-2.5 px-3">Forecast</th>
                <th className="py-2.5 px-3">Actual</th>
                <th className="py-2.5 px-3">Signed Error</th>
                <th className="py-2.5 px-3">Abs Error</th>
                <th className="py-2.5 px-3">Publication</th>
                <th className="py-2.5 px-3">Risk Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {largestErrorIntervals.map((row, idx) => (
                <tr key={idx} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="py-2 px-3 text-neutral-200">{row.deliveryIntervalLocal}</td>
                  <td className="py-2 px-3 text-neutral-400">SP {row.settlementPeriod}</td>
                  <td className="py-2 px-3 text-sky-400">{row.forecastGeneration.toLocaleString()} MW</td>
                  <td className="py-2 px-3 text-emerald-400">{row.actualGeneration.toLocaleString()} MW</td>
                  <td className={`py-2 px-3 font-semibold ${row.signedError > 0 ? 'text-amber-400' : 'text-sky-400'}`}>
                    {row.signedError > 0 ? `+${row.signedError.toLocaleString()}` : row.signedError.toLocaleString()} MW
                  </td>
                  <td className="py-2 px-3 font-semibold text-rose-400">
                    {row.absoluteError.toLocaleString()} MW
                  </td>
                  <td className="py-2 px-3 text-neutral-400 text-[10px] truncate max-w-[140px]">
                    {row.publishTime || 'N/A'}
                  </td>
                  <td className="py-2 px-3">
                    <span className="rounded bg-neutral-900 px-1.5 py-0.5 text-[10px] text-neutral-300 border border-neutral-800">
                      {row.impact.includes('OVERFORECAST') ? 'Volume Deficit Risk' : 'Surplus Spill'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
