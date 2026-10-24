import React from 'react';
import {
  Clock,
  Calendar,
  Download,
  RefreshCw,
  Layers,
  Activity,
  BarChart3,
  Table
} from 'lucide-react';
import { FilterParams } from '../types/analytics';

interface NavbarProps {
  filters: FilterParams;
  onFilterChange: (newFilters: FilterParams) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSync: () => void;
  isSyncing: boolean;
  onExportCsv: () => void;
  dbConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  filters,
  onFilterChange,
  activeTab,
  onTabChange,
  onSync,
  isSyncing,
  onExportCsv,
  dbConnected
}) => {
  const handleCutoffChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      cutoffTime: e.target.value,
    });
  };

  const handleDatePreset = (start: string, end: string) => {
    onFilterChange({
      ...filters,
      startDate: start,
      endDate: end,
    });
  };

  const navItems = [
    { id: 'overview', label: 'Executive Board', icon: Layers },
    { id: 'explorer', label: 'Forecast Explorer', icon: Activity },
    { id: 'accuracy', label: 'Accuracy & Risk', icon: BarChart3 },
    { id: 'table', label: 'Tabular Ledger', icon: Table },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800/80 bg-black/95 backdrop-blur-sm">
      {/* Top Status Bar */}
      <div className="border-b border-neutral-900 bg-neutral-950 px-4 py-1.5 text-[11px] text-neutral-400 font-mono">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-neutral-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              UK DAY-AHEAD WHOLESALE MARKET
            </span>
            <span className="text-neutral-700">/</span>
            <span className="text-neutral-400">Target: National Wind Generation (Elexon BMRS)</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-neutral-400">
              <span className={`h-1.5 w-1.5 rounded-full ${dbConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {dbConnected ? 'MongoDB Atlas' : 'Local Fallback'}
            </span>
            <span className="text-neutral-700">/</span>
            <span className="text-neutral-400">Streams: WINDFOR &bull; FUELHH</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-sm bg-emerald-400" />
              <span className="font-mono text-base font-bold tracking-tight text-white">
                GRIDBRICKS
              </span>
            </div>
            <span className="rounded bg-neutral-900 px-1.5 py-0.5 text-[10px] font-mono uppercase text-neutral-400 border border-neutral-800">
              Procurement Analytics
            </span>
          </div>

          {/* Action Filters Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Presets */}
            <div className="flex items-center rounded-md bg-neutral-900/90 p-0.5 border border-neutral-800 text-xs font-mono">
              <button
                onClick={() => handleDatePreset('2026-01-01', '2026-01-31')}
                className={`rounded px-2.5 py-1 text-[11px] transition-colors ${
                  filters.startDate === '2026-01-01' && filters.endDate === '2026-01-31'
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Jan Full
              </button>
              <button
                onClick={() => handleDatePreset('2026-01-01', '2026-01-07')}
                className={`rounded px-2.5 py-1 text-[11px] transition-colors ${
                  filters.startDate === '2026-01-01' && filters.endDate === '2026-01-07'
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                W1
              </button>
              <button
                onClick={() => handleDatePreset('2026-01-08', '2026-01-14')}
                className={`rounded px-2.5 py-1 text-[11px] transition-colors ${
                  filters.startDate === '2026-01-08' && filters.endDate === '2026-01-14'
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                W2
              </button>
              <button
                onClick={() => handleDatePreset('2026-01-15', '2026-01-21')}
                className={`rounded px-2.5 py-1 text-[11px] transition-colors ${
                  filters.startDate === '2026-01-15' && filters.endDate === '2026-01-21'
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                W3
              </button>
              <button
                onClick={() => handleDatePreset('2026-01-22', '2026-01-31')}
                className={`rounded px-2.5 py-1 text-[11px] transition-colors ${
                  filters.startDate === '2026-01-22' && filters.endDate === '2026-01-31'
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                W4
              </button>
            </div>

            {/* Cutoff Selector */}
            <div className="flex items-center gap-1.5 rounded-md bg-neutral-900/90 px-2.5 py-1 border border-neutral-800 text-xs">
              <Clock className="h-3 w-3 text-neutral-400" />
              <span className="text-neutral-400 text-[11px] font-mono">Cutoff:</span>
              <select
                value={filters.cutoffTime}
                onChange={handleCutoffChange}
                aria-label="Gate closure cutoff time"
                className="bg-transparent font-mono text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="11:00" className="bg-neutral-950 text-white">11:00 UK (EPEX/N2EX)</option>
                <option value="12:00" className="bg-neutral-950 text-white">12:00 UK (Noon Gate)</option>
                <option value="09:00" className="bg-neutral-950 text-white">09:00 UK (Early Morning)</option>
                <option value="14:00" className="bg-neutral-950 text-white">14:00 UK (Afternoon)</option>
              </select>
            </div>

            {/* Date Inputs */}
            <div className="flex items-center gap-1.5 rounded-md bg-neutral-900/90 px-2 py-1 border border-neutral-800 text-xs">
              <Calendar className="h-3 w-3 text-neutral-400" />
              <input
                type="date"
                value={filters.startDate}
                min="2026-01-01"
                max="2026-01-31"
                aria-label="Decision start date"
                onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
                className="bg-transparent text-white font-mono text-[11px] focus:outline-none cursor-pointer"
              />
              <span className="text-neutral-600">&rarr;</span>
              <input
                type="date"
                value={filters.endDate}
                min="2026-01-01"
                max="2026-01-31"
                aria-label="Decision end date"
                onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
                className="bg-transparent text-white font-mono text-[11px] focus:outline-none cursor-pointer"
              />
            </div>

            {/* Sync Button */}
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 px-2.5 py-1.5 text-xs text-neutral-300 border border-neutral-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 text-neutral-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={onExportCsv}
              className="flex items-center gap-1.5 rounded-md bg-white hover:bg-neutral-200 px-3 py-1.5 text-xs font-semibold text-black transition-colors"
            >
              <Download className="h-3 w-3" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-3 flex space-x-1 border-t border-neutral-900 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
