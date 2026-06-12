import { api } from "./client";
import type {
  ProgramSummaryDto,
  ProgramDetailDto,
  CreateProgramDto,
} from "../types/api";

export const programsApi = {
  getAll:    ()           => api.get<ProgramSummaryDto[]>("/api/programs"),
  getBySlug: (slug: string) => api.get<ProgramSummaryDto>(`/api/programs/${slug}`),
  getDetail: (slug: string) => api.get<ProgramDetailDto>(`/api/programs/${slug}/detail`),
  create:    (dto: CreateProgramDto) => api.post<ProgramSummaryDto>("/api/programs", dto),
};
