import {
  OverviewData,
  TimeseriesData,
  AccuracyData,
  PaginatedRecordsData,
  FilterParams
} from '../types/analytics';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    let errorMessage = `API Error: HTTP ${response.status} ${response.statusText}`;
    try {
      const errObj = await response.json();
      if (errObj && errObj.detail) {
        errorMessage = errObj.detail;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

export const analyticsApi = {
  async getHealth(): Promise<{ status: string; database_connected: boolean; version: string }> {
    return fetchJson(`${API_BASE_URL}/api/health`);
  },

  async getOverview(params: FilterParams): Promise<OverviewData> {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      cutoffTime: params.cutoffTime,
    });
    return fetchJson<OverviewData>(`${API_BASE_URL}/api/analytics/overview?${query.toString()}`);
  },

  async getTimeseries(params: FilterParams): Promise<TimeseriesData> {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      cutoffTime: params.cutoffTime,
    });
    return fetchJson<TimeseriesData>(`${API_BASE_URL}/api/analytics/timeseries?${query.toString()}`);
  },

  async getAccuracy(params: FilterParams): Promise<AccuracyData> {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      cutoffTime: params.cutoffTime,
    });
    return fetchJson<AccuracyData>(`${API_BASE_URL}/api/analytics/accuracy?${query.toString()}`);
  },

  async getRecords(
    params: FilterParams,
    page: number = 1,
    pageSize: number = 50,
    sortBy: string = 'deliveryInterval',
    sortOrder: string = 'asc',
    status?: string
  ): Promise<PaginatedRecordsData> {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      cutoffTime: params.cutoffTime,
      page: page.toString(),
      pageSize: pageSize.toString(),
      sortBy,
      sortOrder,
    });
    if (status && status !== 'ALL') {
      query.set('status', status);
    }
    return fetchJson<PaginatedRecordsData>(`${API_BASE_URL}/api/analytics/records?${query.toString()}`);
  },

  async triggerSync(params: FilterParams): Promise<{ status: string; message: string }> {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      cutoffTime: params.cutoffTime,
    });
    const response = await fetch(`${API_BASE_URL}/api/analytics/sync?${query.toString()}`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Sync failed: HTTP ${response.status}`);
    }
    return response.json();
  },

  getExportCsvUrl(params: FilterParams): string {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      cutoffTime: params.cutoffTime,
    });
    return `${API_BASE_URL}/api/analytics/export.csv?${query.toString()}`;
  }
};
