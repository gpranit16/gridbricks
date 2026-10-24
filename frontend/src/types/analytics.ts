export interface SummaryMetrics {
  totalExpectedIntervals: number;
  matchedIntervals: number;
  missingForecastCount: number;
  missingActualCount: number;
  missingBothCount: number;
  forecastCoveragePercent: number;
  mae: number | null;
  rmse: number | null;
  bias: number | null;
  mape: number | null;
  avgForecastMw: number | null;
  avgActualMw: number | null;
  maxForecastMw: number | null;
  maxActualMw: number | null;
  maxAbsoluteErrorMw: number | null;
  unit: string;
}

export interface IntervalRecord {
  deliveryInterval: string;
  deliveryIntervalLocal: string;
  decisionDate: string;
  deliveryDate: string;
  decisionCutoffUtc: string;
  settlementPeriod: number;
  publishTime: string | null;
  forecastGeneration: number | null;
  actualGeneration: number | null;
  signedError: number | null;
  absoluteError: number | null;
  squaredError: number | null;
  percentageError: number | null;
  status: 'MATCHED' | 'MISSING_FORECAST' | 'MISSING_ACTUAL' | 'MISSING_BOTH';
  unit: string;
}

export interface ErrorDistributionBin {
  range: string;
  min: number;
  max: number;
  count: number;
  type: 'underforecast' | 'overforecast';
}

export interface OutlierInterval {
  deliveryInterval: string;
  deliveryIntervalLocal: string;
  settlementPeriod: number;
  forecastGeneration: number;
  actualGeneration: number;
  signedError: number;
  absoluteError: number;
  publishTime: string | null;
  impact: string;
}

export interface ProcurementContext {
  energyVolumes: {
    totalForecastMwh: number;
    totalActualMwh: number;
    netVolumeDifferenceMwh: number;
    unit: string;
  };
  riskProfile: {
    shortfallIntervalsCount: number;
    shortfallPercentage: number;
    avgShortfallMw: number;
    surplusIntervalsCount: number;
    surplusPercentage: number;
    avgSurplusMw: number;
  };
  procurementLimitations: Array<{
    title: string;
    description: string;
  }>;
  traderGuidance: string;
}

export interface OverviewData {
  decisionPeriod: {
    startDate: string;
    endDate: string;
  };
  deliveryPeriod: {
    startDate: string;
    endDate: string;
  };
  decisionCutoffTime: string;
  latestForecastPublishTime: string | null;
  metrics: SummaryMetrics;
  dataFreshness: {
    lastSyncTime: string;
    dataSourceActuals: string;
    dataSourceForecasts: string;
    storageEngine: string;
  };
  metadata: {
    timezone: string;
    gateClosureRationale: string;
  };
}

export interface TimeseriesData {
  decisionPeriod: {
    startDate: string;
    endDate: string;
  };
  deliveryPeriod: {
    startDate: string;
    endDate: string;
  };
  decisionCutoffTime: string;
  totalIntervals: number;
  intervals: IntervalRecord[];
}

export interface AccuracyData {
  decisionPeriod: {
    startDate: string;
    endDate: string;
  };
  decisionCutoffTime: string;
  metrics: SummaryMetrics;
  errorDistribution: ErrorDistributionBin[];
  largestErrorIntervals: OutlierInterval[];
  procurementContext: ProcurementContext;
}

export interface PaginatedRecordsData {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  records: IntervalRecord[];
}

export interface FilterParams {
  startDate: string;
  endDate: string;
  cutoffTime: string;
}
