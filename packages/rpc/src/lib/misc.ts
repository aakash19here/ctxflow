export interface DateRange {
  start_date: string;
  end_date: string;
  granularity?: "hourly" | "daily";
  timezone?: string;
}

// Base params builder - following use-analytics.ts pattern
export function buildParams(
  websiteId: string,
  dateRange?: DateRange,
  additionalParams?: Record<string, string | number>
): URLSearchParams {
  const params = new URLSearchParams({
    website_id: websiteId,
    ...additionalParams,
  });

  if (dateRange?.start_date) {
    params.append("start_date", dateRange.start_date);
  }

  if (dateRange?.end_date) {
    params.append("end_date", dateRange.end_date);
  }

  if (dateRange?.granularity) {
    params.append("granularity", dateRange.granularity);
  }

  // Add cache busting
  params.append("_t", Date.now().toString());

  return params;
}
