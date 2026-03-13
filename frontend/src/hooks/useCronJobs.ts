import { useState } from "react";
import type { CronJob } from "../types";

export function useCronJobs() {
  const [jobs] = useState<CronJob[]>([]);
  const failureCount = jobs.filter((j) => j.status === "disabled").length;

  return {
    jobs,
    failureCount,
    isLoading: false,
    error: null,
    refetch: () => {},
  };
}
