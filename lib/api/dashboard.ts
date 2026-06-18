import { api } from "./client";
import type { DashboardDto } from "../types/api";

export const dashboardApi = {
  /** The entire dashboard payload in a single request. */
  get: () => api.get<DashboardDto>("/api/dashboard"),
};
