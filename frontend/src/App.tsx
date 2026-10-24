import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { OverviewSection } from './components/OverviewSection';
import { ForecastExplorer } from './components/ForecastExplorer';
import { AccuracySection } from './components/AccuracySection';
import { DataTableSection } from './components/DataTableSection';
import {
  OverviewData,
  TimeseriesData,
  AccuracyData,
  FilterParams
} from './types/analytics';
import { analyticsApi } from './services/api';

export const App: React.FC = () => {
  const [filters, setFilters] = useState<FilterParams>({
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    cutoffTime: '11:00',
  });

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [timeseriesData, setTimeseriesData] = useState<TimeseriesData | null>(null);
  const [accuracyData, setAccuracyData] = useState<AccuracyData | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dbConnected, setDbConnected] = useState<boolean>(true);
  const [syncNotification, setSyncNotification] = useState<string | null>(null);

  const loadData = async (filterParams: FilterParams) => {
    setIsLoading(true);
    setError(null);
    try {
      try {
        const health = await analyticsApi.getHealth();
        setDbConnected(health.database_connected);
      } catch {
        setDbConnected(false);
      }

      const [overview, timeseries, accuracy] = await Promise.all([
        analyticsApi.getOverview(filterParams),
        analyticsApi.getTimeseries(filterParams),
        analyticsApi.getAccuracy(filterParams),
      ]);

      setOverviewData(overview);
      setTimeseriesData(timeseries);
      setAccuracyData(accuracy);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Unable to connect to analytics backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(filters);
  }, [filters]);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncNotification(null);
    try {
      const res = await analyticsApi.triggerSync(filters);
      setSyncNotification(res.message);
      await loadData(filters);
      setTimeout(() => setSyncNotification(null), 6000);
    } catch (err: any) {
      setError(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportCsv = () => {
    const url = analyticsApi.getExportCsvUrl(filters);
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-black text-[#F4F4F5] flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        filters={filters}
        onFilterChange={setFilters}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSync={handleSync}
        isSyncing={isSyncing}
        onExportCsv={handleExportCsv}
        dbConnected={dbConnected}
      />

      {/* Sync Notification Banner */}
      {syncNotification && (
        <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2 text-center text-xs text-neutral-300 font-mono flex items-center justify-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>{syncNotification}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6">
        {isLoading && !overviewData ? (
          <div className="flex flex-col items-center justify-center min-h-[460px] space-y-3 font-mono">
            <div className="h-6 w-6 rounded-full border-2 border-neutral-600 border-t-white animate-spin" />
            <div className="text-center space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                Evaluating Day-Ahead Decision Cutoffs...
              </h3>
              <p className="text-[11px] text-neutral-500 max-w-sm font-sans">
                Aligning Elexon WINDFOR forecast publications ({filters.cutoffTime} UK cutoff) with FUELHH metered outturn.
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="obsidian-card rounded-lg p-6 text-center max-w-md mx-auto my-12 space-y-3">
            <div className="h-10 w-10 rounded-full bg-neutral-900 text-rose-400 flex items-center justify-center mx-auto border border-neutral-800">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">Data Pipeline Notice</h3>
              <p className="text-xs text-neutral-400 mt-1">{error}</p>
            </div>
            <button
              onClick={() => loadData(filters)}
              className="rounded-md bg-white hover:bg-neutral-200 px-3 py-1.5 text-xs font-semibold text-black transition-colors inline-flex items-center gap-1.5"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry Pipeline</span>
            </button>
          </div>
        ) : (
          <div>
            {activeTab === 'overview' && overviewData && (
              <OverviewSection
                overviewData={overviewData}
                timeseriesData={timeseriesData}
                accuracyData={accuracyData}
                onNavigateToExplorer={() => setActiveTab('explorer')}
                onNavigateToAccuracy={() => setActiveTab('accuracy')}
                onNavigateToTable={() => setActiveTab('table')}
                onExportCsv={handleExportCsv}
              />
            )}

            {activeTab === 'explorer' && timeseriesData && (
              <ForecastExplorer data={timeseriesData} />
            )}

            {activeTab === 'accuracy' && accuracyData && (
              <AccuracySection data={accuracyData} />
            )}

            {activeTab === 'table' && (
              <DataTableSection
                filters={filters}
                onExportCsv={handleExportCsv}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-black px-4 py-4 text-xs text-neutral-400 font-mono">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-tight">GRIDBRICKS</span>
            <span className="text-neutral-700">/</span>
            <span>UK Wind Forecast Analytics &bull; January 2026 Wholesale Procurement</span>
          </div>

          <div className="flex items-center gap-5">
            <span>Elexon BMRS Live Data</span>
            <span className="text-neutral-700">/</span>
            <span>Cutoff: <strong className="text-white">{filters.cutoffTime} London</strong></span>
            <span className="text-neutral-700">/</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="h-3 w-3" />
              Pilot Ready
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
