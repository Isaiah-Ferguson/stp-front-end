import { api } from "./client";
import type {
  StaffSummaryDto,
  StaffDetailDto,
  CreateStaffDto,
  UpdateStaffDto,
  ChecklistTemplateItemDto,
} from "../types/api";

export const staffApi = {
  getAll:  ()                          => api.get<StaffSummaryDto[]>("/api/staff"),
  getById: (id: string)                => api.get<StaffDetailDto>(`/api/staff/${id}`),
  create:  (dto: CreateStaffDto)       => api.post<StaffDetailDto>("/api/staff", dto),
  update:  (id: string, dto: UpdateStaffDto) => api.put<StaffDetailDto>(`/api/staff/${id}`, dto),
  setOnboardingItem: (staffId: string, itemId: string, isCompleted: boolean) =>
    api.put<StaffDetailDto>(`/api/staff/${staffId}/onboarding/${itemId}`, { isCompleted }),
  getChecklistTemplate: () =>
    api.get<ChecklistTemplateItemDto[]>("/api/staff/checklist-template"),
  updateChecklistTemplate: (items: ChecklistTemplateItemDto[]) =>
    api.put<ChecklistTemplateItemDto[]>("/api/staff/checklist-template", { items }),
};
