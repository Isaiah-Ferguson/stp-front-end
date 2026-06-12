import { api } from "./client";
import type {
  AttendanceSessionDto,
  AttendanceRosterEntryDto,
  AttendanceNoteDto,
  CreateAttendanceNoteDto,
  UpdateAttendanceDto,
} from "../types/api";

export const attendanceApi = {
  getTodayRoster: ()                                       => api.get<AttendanceRosterEntryDto[]>("/api/attendance/today"),
  getSession:    (sessionId: string)                      => api.get<AttendanceSessionDto>(`/api/attendance/session/${sessionId}`),
  updateRecord:  (recordId: string, dto: UpdateAttendanceDto) => api.put<void>(`/api/attendance/${recordId}`, dto),
  addNote:       (recordId: string, dto: CreateAttendanceNoteDto) => api.post<AttendanceNoteDto>(`/api/attendance/${recordId}/notes`, dto),
};
