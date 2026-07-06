import { api } from "./client";
import type { CohortRollUpDto } from "../types/api";

export const cohortApi = {
  getRollUp: (month: string, programId?: string) => {
    const p = new URLSearchParams({ month });
    if (programId) p.set("programId", programId);
    return api.get<CohortRollUpDto>(`/api/cohort/roll-up?${p.toString()}`);
  },
};
