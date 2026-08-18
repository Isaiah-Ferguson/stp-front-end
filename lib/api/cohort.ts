import { api } from "./client";
import type { CohortRollUpDto, CohortStarDto, ProgressLevel } from "../types/api";

export const cohortApi = {
  getRollUp: (month: string, programId?: string) => {
    const p = new URLSearchParams({ month });
    if (programId) p.set("programId", programId);
    return api.get<CohortRollUpDto>(`/api/cohort/roll-up?${p.toString()}`);
  },
  /** Which Stars sit behind one roll-up count. Fetched on demand — see CohortStarDto. */
  getStarsAtLevel: (month: string, subSkillId: string, level: ProgressLevel, programId?: string) => {
    const p = new URLSearchParams({ month, subSkillId, level });
    if (programId) p.set("programId", programId);
    return api.get<CohortStarDto[]>(`/api/cohort/roll-up/stars?${p.toString()}`);
  },
};
