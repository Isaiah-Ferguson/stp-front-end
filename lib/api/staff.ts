import { api } from "./client";
import type {
  StaffSummaryDto,
  StaffDetailDto,
  CreateStaffDto,
  UpdateStaffDto,
} from "../types/api";

export const staffApi = {
  getAll:  ()                          => api.get<StaffSummaryDto[]>("/api/staff"),
  getById: (id: string)                => api.get<StaffDetailDto>(`/api/staff/${id}`),
  create:  (dto: CreateStaffDto)       => api.post<StaffDetailDto>("/api/staff", dto),
  update:  (id: string, dto: UpdateStaffDto) => api.put<StaffDetailDto>(`/api/staff/${id}`, dto),
};
