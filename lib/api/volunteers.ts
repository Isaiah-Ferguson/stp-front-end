import { api } from "./client";
import type {
  VolunteerDto,
  CreateVolunteerDto,
  UpdateVolunteerDto,
} from "../types/api";

export const volunteersApi = {
  getAll:  ()                                   => api.get<VolunteerDto[]>("/api/volunteers"),
  getById: (id: string)                         => api.get<VolunteerDto>(`/api/volunteers/${id}`),
  create:  (dto: CreateVolunteerDto)            => api.post<VolunteerDto>("/api/volunteers", dto),
  update:  (id: string, dto: UpdateVolunteerDto) => api.put<VolunteerDto>(`/api/volunteers/${id}`, dto),
  remove:  (id: string)                         => api.delete<void>(`/api/volunteers/${id}`),
};
