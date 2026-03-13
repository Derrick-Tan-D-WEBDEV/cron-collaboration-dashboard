import { useState } from "react";

interface DashboardOptions {
  refreshInterval?: number;
  autoRefresh?: boolean;
}

export function useDashboard(_options?: DashboardOptions) {
  return {
    dashboardData: null,
    recentExecutions: [],
    performanceMetrics: null,
    predictions: null,
    isLoading: false,
    error: null,
    refetch: () => {},
  };
}
