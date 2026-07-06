import { api } from "./client";
import type { PerStarPlanDto, UpsertPerStarPlanDto } from "../types/api";

export const planningApi = {
  getPerStar: (month: string, programId?: string) => {
    const p = new URLSearchParams({ month });
    if (programId) p.set("programId", programId);
    return api.get<PerStarPlanDto[]>(`/api/planning/per-star?${p.toString()}`);
  },
  upsertPerStar: (dto: UpsertPerStarPlanDto) => api.put<PerStarPlanDto>("/api/planning/per-star", dto),
};
