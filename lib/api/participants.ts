import { api } from "./client";
import type {
  ParticipantSummaryDto,
  ParticipantDetailDto,
  CreateParticipantDto,
  UpdateParticipantDto,
} from "../types/api";

export const participantsApi = {
  getAll:   ()                              => api.get<ParticipantSummaryDto[]>("/api/participants"),
  getById:  (id: string)                    => api.get<ParticipantDetailDto>(`/api/participants/${id}`),
  create:   (dto: CreateParticipantDto)     => api.post<ParticipantDetailDto>("/api/participants", dto),
  update:   (id: string, dto: UpdateParticipantDto) => api.put<ParticipantDetailDto>(`/api/participants/${id}`, dto),
  remove:   (id: string)                    => api.delete<void>(`/api/participants/${id}`),
};
