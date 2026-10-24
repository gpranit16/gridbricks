import React, { useState, useEffect } from 'react';
import {
  Download,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle
} from 'lucide-react';
import { IntervalRecord, FilterParams } from '../types/analytics';
import { analyticsApi } from '../services/api';

interface DataTableSectionProps {
  filters: FilterParams;
  onExportCsv: () => void;
  onSelectInterval?: (record: IntervalRecord) => void;
}

export const DataTableSection: React.FC<DataTableSectionProps> = ({
  filters,
  onExportCsv,
  onSelectInterval,
}) => {
  const [records, setRecords] = useState<IntervalRecord[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [sortBy, setSortBy] = useState<string>('deliveryInterval');
  const [sortOrder, setSortOrder] = useState<string>('asc');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyticsApi.getRecords(
        filters,
        page,
        pageSize,
        sortBy,
        sortOrder,
        statusFilter
      );
      setRecords(data.records);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to load records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [filters, page, pageSize, sortBy, sortOrder, statusFilter]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const filteredRecords = records.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.deliveryInterval.toLowerCase().includes(q) ||
      r.deliveryIntervalLocal.toLowerCase().includes(q) ||
      r.decisionDate.toLowerCase().includes(q) ||
      (r.publishTime && r.publishTime.toLowerCase().includes(q))
    );
  });

  return (
    <div className="obsidian-card rounded-lg p-5 space-y-3 font-mono">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
            <span>Granular Delivery Intervals</span>
            <span className="text-neutral-500 font-normal">({total.toLocaleString()} total)</span>
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-neutral-500" />
            <input
              type="text"
              placeholder="Search date, SP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-md bg-neutral-950 pl-7 pr-2.5 py-1 text-xs text-white border border-neutral-800 focus:border-neutral-700 focus:outline-none w-36"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center rounded-md bg-neutral-950 p-0.5 border border-neutral-800 text-[11px]">
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setPage(1);
              }}
              className={`rounded px-2 py-0.5 transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setStatusFilter('MATCHED');
                setPage(1);
              }}
              className={`rounded px-2 py-0.5 transition-colors ${
                statusFilter === 'MATCHED'
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Matched
            </button>
            <button
              onClick={() => {
                setStatusFilter('MISSING_FORECAST');
                setPage(1);
              }}
              className={`rounded px-2 py-0.5 transition-colors ${
                statusFilter === 'MISSING_FORECAST'
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Missing
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 rounded-md bg-white hover:bg-neutral-200 px-2.5 py-1 text-xs font-semibold text-black transition-colors"
          >
            <Download className="h-3 w-3" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded border border-neutral-800">
        <table className="w-full text-left text-xs font-mono">
          <thead className="border-b border-neutral-800 bg-neutral-950 text-neutral-400 text-[11px] uppercase">
            <tr>
              <th
                onClick={() => handleSort('deliveryInterval')}
                className="py-2.5 px-3 cursor-pointer hover:text-white select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Delivery Interval</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-2.5 px-3">Decision</th>
              <th className="py-2.5 px-3">SP</th>
              <th
                onClick={() => handleSort('forecastGeneration')}
                className="py-2.5 px-3 cursor-pointer hover:text-white select-none text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Forecast</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('actualGeneration')}
                className="py-2.5 px-3 cursor-pointer hover:text-white select-none text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Actual</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('signedError')}
                className="py-2.5 px-3 cursor-pointer hover:text-white select-none text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Error</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('absoluteError')}
                className="py-2.5 px-3 cursor-pointer hover:text-white select-none text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Abs Error</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-2.5 px-3">Publish Time</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-900">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-neutral-500 font-sans">
                  Loading records...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-rose-400 font-sans">
                  <div className="flex items-center justify-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-neutral-500 font-sans">
                  No records found.
                </td>
              </tr>
            ) : (
              filteredRecords.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => onSelectInterval && onSelectInterval(row)}
                  className="hover:bg-neutral-900/40 transition-colors cursor-pointer"
                >
                  <td className="py-2 px-3 text-neutral-200">{row.deliveryIntervalLocal}</td>
                  <td className="py-2 px-3 text-neutral-400">{row.decisionDate}</td>
                  <td className="py-2 px-3 text-neutral-400">SP {row.settlementPeriod}</td>
                  <td className="py-2 px-3 text-right text-sky-400">
                    {row.forecastGeneration !== null ? `${row.forecastGeneration.toLocaleString()} MW` : '—'}
                  </td>
                  <td className="py-2 px-3 text-right text-emerald-400">
                    {row.actualGeneration !== null ? `${row.actualGeneration.toLocaleString()} MW` : '—'}
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-semibold ${
                      (row.signedError ?? 0) > 0 ? 'text-amber-400' : 'text-sky-400'
                    }`}
                  >
                    {row.signedError !== null
                      ? `${row.signedError > 0 ? '+' : ''}${row.signedError.toLocaleString()} MW`
                      : '—'}
                  </td>
                  <td className="py-2 px-3 text-right text-neutral-200">
                    {row.absoluteError !== null ? `${row.absoluteError.toLocaleString()} MW` : '—'}
                  </td>
                  <td className="py-2 px-3 text-neutral-400 text-[10px] truncate max-w-[130px]">
                    {row.publishTime || '—'}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] border ${
                        row.status === 'MATCHED'
                          ? 'bg-neutral-900 text-neutral-300 border-neutral-800'
                          : 'bg-neutral-900 text-neutral-500 border-neutral-800/80'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-neutral-400 pt-2 border-t border-neutral-800/80">
        <div className="flex items-center gap-2">
          <span>Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded bg-neutral-950 border border-neutral-800 px-2 py-0.5 text-white"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-neutral-500">
            {(page - 1) * pageSize + 1}&minus;{Math.min(page * pageSize, total)} of {total.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 rounded bg-neutral-900 hover:bg-neutral-800 px-2 py-1 text-neutral-300 border border-neutral-800 disabled:opacity-40"
          >
            <ChevronLeft className="h-3 w-3" />
            <span>Prev</span>
          </button>
          <span className="px-1 text-neutral-300">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 rounded bg-neutral-900 hover:bg-neutral-800 px-2 py-1 text-neutral-300 border border-neutral-800 disabled:opacity-40"
          >
            <span>Next</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
