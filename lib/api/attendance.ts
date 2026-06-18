import { api } from "./client";
import type {
  AttendanceSessionDto,
  AttendanceRosterEntryDto,
  AttendanceNoteDto,
  CreateAttendanceNoteDto,
  UpdateAttendanceDto,
  ScheduledSessionDto,
  SessionRosterDto,
} from "../types/api";

export const attendanceApi = {
  /** Session cards for a date (defaults to today), scoped to the signed-in user's programs. */
  getScheduled:  (date?: string)                          => api.get<ScheduledSessionDto[]>(`/api/attendance/scheduled${date ? `?date=${date}` : ""}`),
  /** Gets or creates the session for a program on a date and returns its roster. */
  getProgramSession: (programId: string, date?: string)   => api.get<SessionRosterDto>(`/api/attendance/session?programId=${programId}${date ? `&date=${date}` : ""}`),
  /** Finalizes a session, locking its records. */
  submitSession: (sessionId: string)                      => api.post<void>(`/api/attendance/session/${sessionId}/submit`, {}),

  getSession:    (sessionId: string)                      => api.get<AttendanceSessionDto>(`/api/attendance/session/${sessionId}`),
  updateRecord:  (recordId: string, dto: UpdateAttendanceDto) => api.put<void>(`/api/attendance/${recordId}`, dto),
  addNote:       (recordId: string, dto: CreateAttendanceNoteDto) => api.post<AttendanceNoteDto>(`/api/attendance/${recordId}/notes`, dto),

  /** @deprecated Superseded by getScheduled + getProgramSession. */
  getTodayRoster: ()                                      => api.get<AttendanceRosterEntryDto[]>("/api/attendance/today"),
};
