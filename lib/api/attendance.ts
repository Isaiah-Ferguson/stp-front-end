import { api } from "./client";
import type {
  AttendanceSessionDto,
  UpdateAttendanceDto,
} from "../types/api";

export const attendanceApi = {
  getSession:    (sessionId: string)                      => api.get<AttendanceSessionDto>(`/api/attendance/session/${sessionId}`),
  updateRecord:  (recordId: string, dto: UpdateAttendanceDto) => api.put<void>(`/api/attendance/${recordId}`, dto),
};
