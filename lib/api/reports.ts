import { api } from "./client";
import type { ReportsDto } from "../types/api";

export const reportsApi = {
  /** Org-wide reporting snapshot in a single request. */
  get: () => api.get<ReportsDto>("/api/reports"),
};
