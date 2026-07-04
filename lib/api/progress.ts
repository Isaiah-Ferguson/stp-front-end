import { api } from "./client";
import type {
  StarMonthDto,
  WeeklyDataEntryDto,
  MonthlyProgressSnapshotDto,
  RecordWeeklyScoreDto,
  ConfirmMonthEndDto,
  WeeklyFocusSkillDto,
  SetFocusSkillsDto,
} from "../types/api";

export const progressApi = {
  getStarMonth:   (participantId: string, month: string) =>
    api.get<StarMonthDto>(`/api/progress/star/${participantId}?month=${encodeURIComponent(month)}`),
  recordWeekly:   (dto: RecordWeeklyScoreDto) =>
    api.post<WeeklyDataEntryDto>("/api/progress/weekly", dto),
  computeMonthEnd: (participantId: string, month: string) =>
    api.post<MonthlyProgressSnapshotDto[]>(`/api/progress/star/${participantId}/compute?month=${encodeURIComponent(month)}`, {}),
  confirmMonthEnd: (participantId: string, month: string, dto: ConfirmMonthEndDto) =>
    api.post<MonthlyProgressSnapshotDto>(`/api/progress/star/${participantId}/confirm?month=${encodeURIComponent(month)}`, dto),

  getFocusSkills: (programId: string, month: string) =>
    api.get<WeeklyFocusSkillDto[]>(`/api/progress/focus-skills?programId=${programId}&month=${encodeURIComponent(month)}`),
  setFocusSkills: (dto: SetFocusSkillsDto) =>
    api.put<WeeklyFocusSkillDto[]>("/api/progress/focus-skills", dto),
};
