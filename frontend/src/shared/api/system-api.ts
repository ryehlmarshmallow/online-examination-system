import { apiClient } from "../lib/apiClient";
import type { SystemLimitsResponse } from "../types/system";

export const getSystemLimits = async (): Promise<SystemLimitsResponse> => {
  const response = await apiClient.get<SystemLimitsResponse>("/api/system/limits");
  return response.data;
};
