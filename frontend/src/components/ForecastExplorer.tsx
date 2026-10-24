import React, { useState } from 'react';
import {
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
  Area,
  ComposedChart
} from 'recharts';
import { Activity } from 'lucide-react';
import { TimeseriesData, IntervalRecord } from '../types/analytics';

interface ForecastExplorerProps {
  data: TimeseriesData;
  onSelectInterval?: (record: IntervalRecord) => void;
}

export const ForecastExplorer: React.FC<ForecastExplorerProps> = ({
  data,
  onSelectInterval,
}) => {
  const [selectedInterval, setSelectedInterval] = useState<IntervalRecord | null>(
    data.intervals.find((r) => r.status === 'MATCHED') || null
  );
  const [showDifferenceArea, setShowDifferenceArea] = useState(false);

  const chartData = data.intervals.map((item) => ({
    ...item,
    formattedTime: item.deliveryIntervalLocal.replace('2026-', '').replace(' GMT', ''),
    forecast: item.forecastGeneration,
    actual: item.actualGeneration,
    diff:
      item.forecastGeneration !== null && item.actualGeneration !== null
        ? Math.abs(item.forecastGeneration - item.actualGeneration)
        : null,
  }));

  const handleChartClick = (state: any) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      const record = state.activePayload[0].payload as IntervalRecord;
      setSelectedInterval(record);
      if (onSelectInterval) {
        onSelectInterval(record);
      }
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload as IntervalRecord & { formattedTime: string };
      const hasBoth = p.forecastGeneration !== null && p.actualGeneration !== null;
      const signedErr = p.signedError ?? (hasBoth ? (p.forecastGeneration! - p.actualGeneration!) : null);

      return (
        <div className="rounded-md border border-neutral-800 bg-neutral-950 p-3 text-xs shadow-2xl space-y-1.5 min-w-[240px] font-mono">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-1">
            <span className="font-semibold text-white">{p.deliveryIntervalLocal}</span>
            <span className="text-[10px] text-neutral-400">SP {p.settlementPeriod}</span>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-sky-400">Forecast (WINDFOR):</span>
              <span className="font-bold text-white">
                {p.forecastGeneration !== null ? `${p.forecastGeneration.toLocaleString()} MW` : 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-emerald-400">Actual (FUELHH):</span>
              <span className="font-bold text-white">
                {p.actualGeneration !== null ? `${p.actualGeneration.toLocaleString()} MW` : 'N/A'}
              </span>
            </div>

            {hasBoth && signedErr !== null && (
              <div className="flex items-center justify-between pt-1 border-t border-neutral-800">
                <span className="text-neutral-400">Error:</span>
                <span className={`font-bold ${signedErr > 0 ? 'text-amber-400' : 'text-sky-400'}`}>
                  {signedErr > 0 ? `+${signedErr.toLocaleString()}` : signedErr.toLocaleString()} MW
                </span>
              </div>
            )}
          </div>

          <div className="pt-1 border-t border-neutral-800 text-[10px] text-neutral-400 flex items-center justify-between">
            <span>Published:</span>
            <span className="text-neutral-300">{p.publishTime || 'N/A'}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Chart Card */}
      <div className="obsidian-card rounded-lg p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              Day-Ahead Wind Forecast vs Metered Generation
            </h3>
            <p className="text-xs text-neutral-400">
              National transmission system wind output (MW). Drag bottom brush to adjust time window.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDifferenceArea(!showDifferenceArea)}
              className={`rounded px-2.5 py-1 text-[11px] font-mono border transition-colors ${
                showDifferenceArea
                  ? 'bg-neutral-800 text-white border-neutral-700'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              {showDifferenceArea ? 'Hide Error Fill' : 'Show Error Fill'}
            </button>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="h-[400px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              onClick={handleChartClick}
              margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            >
              <defs>
                <linearGradient id="diffGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#18181B" opacity={0.6} />

              <XAxis
                dataKey="formattedTime"
                stroke="#52525B"
                tick={{ fill: '#71717A', fontSize: 10, fontFamily: 'monospace' }}
                tickMargin={8}
                interval="preserveStartEnd"
              />

              <YAxis
                stroke="#52525B"
                tick={{ fill: '#71717A', fontSize: 10, fontFamily: 'monospace' }}
                unit=" MW"
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                domain={[0, 'auto']}
              />

              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '8px', fontSize: '11px', fontFamily: 'monospace' }}
              />

              {showDifferenceArea && (
                <Area
                  type="monotone"
                  dataKey="diff"
                  name="Error Magnitude"
                  stroke="none"
                  fill="url(#diffGradient)"
                />
              )}

              <Line
                type="monotone"
                dataKey="forecast"
                name="Forecast (WINDFOR)"
                stroke="#38BDF8"
                strokeWidth={1.75}
                dot={false}
                activeDot={{ r: 4, fill: '#38BDF8', stroke: '#000000', strokeWidth: 1.5 }}
              />

              <Line
                type="monotone"
                dataKey="actual"
                name="Actual (FUELHH)"
                stroke="#10B981"
                strokeWidth={1.75}
                dot={false}
                activeDot={{ r: 4, fill: '#10B981', stroke: '#000000', strokeWidth: 1.5 }}
              />

              <Brush
                dataKey="formattedTime"
                height={22}
                stroke="#27272A"
                fill="#09090B"
                tickFormatter={() => ''}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-800/80 font-mono">
          <span>Click any interval on the chart to inspect full telemetry.</span>
          <span>Total intervals: {data.totalIntervals}</span>
        </div>
      </div>

      {/* Interval Inspector */}
      {selectedInterval && (
        <div className="obsidian-card rounded-lg p-4 space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">
                {selectedInterval.deliveryIntervalLocal}
              </span>
              <span className="rounded bg-neutral-900 px-1.5 py-0.5 text-[10px] text-neutral-400 border border-neutral-800">
                SP {selectedInterval.settlementPeriod}
              </span>
            </div>
            <div className="text-neutral-400 text-[11px]">
              Decision Date: <span className="text-neutral-200">{selectedInterval.decisionDate}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded bg-neutral-950 p-2.5 border border-neutral-800">
              <span className="text-[10px] uppercase text-neutral-400">Forecast Available</span>
              <div className="text-base font-bold text-sky-400 mt-0.5">
                {selectedInterval.forecastGeneration !== null
                  ? `${selectedInterval.forecastGeneration.toLocaleString()} MW`
                  : 'N/A'}
              </div>
            </div>

            <div className="rounded bg-neutral-950 p-2.5 border border-neutral-800">
              <span className="text-[10px] uppercase text-neutral-400">Actual Outturn</span>
              <div className="text-base font-bold text-emerald-400 mt-0.5">
                {selectedInterval.actualGeneration !== null
                  ? `${selectedInterval.actualGeneration.toLocaleString()} MW`
                  : 'N/A'}
              </div>
            </div>

            <div className="rounded bg-neutral-950 p-2.5 border border-neutral-800">
              <span className="text-[10px] uppercase text-neutral-400">Signed Error</span>
              <div
                className={`text-base font-bold mt-0.5 ${
                  (selectedInterval.signedError ?? 0) > 0 ? 'text-amber-400' : 'text-sky-400'
                }`}
              >
                {selectedInterval.signedError !== null
                  ? `${selectedInterval.signedError > 0 ? '+' : ''}${selectedInterval.signedError.toLocaleString()} MW`
                  : 'N/A'}
              </div>
            </div>

            <div className="rounded bg-neutral-950 p-2.5 border border-neutral-800">
              <span className="text-[10px] uppercase text-neutral-400">Publish Timestamp</span>
              <div className="text-xs font-semibold text-neutral-200 mt-1 truncate">
                {selectedInterval.publishTime || 'Unavailable'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
