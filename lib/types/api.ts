// ── Shared ────────────────────────────────────────────────────────────────────

export type Guid = string;

// ── Enums (mirror backend) ────────────────────────────────────────────────────

export type ParticipantStatus = "Active" | "Prospective" | "Attention" | "Former";
export type StaffRole = "Teacher" | "Coordinator" | "Admin";
export type AttendanceStatus = "Present" | "Absent" | "Unmarked";
export type TaskStatus = "Upcoming" | "InProgress" | "Done" | "Overdue" | "Blocked";
export type TaskPriority = "High" | "Medium" | "Low";
export type ScriptType = "Musical" | "Play" | "Scene" | "Skit";
export type ScriptStatus = "Active" | "Draft" | "Archived";
export type ProjectType = "Production" | "Staff" | "Admin" | "Event";
export type AlertSeverity = "Danger" | "Warning" | "Info";
export type UserRole = "Staff" | "Admin";
export type ProgressLevel = "Novice" | "Intermediate" | "Expert" | "NotApplicable";

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterUserDto {
  email: string;
  fullName: string;
  password: string;
  role: UserRole;
  staffMemberId?: Guid;
}

export interface UserDto {
  id: Guid;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  staffMemberId: Guid | null;
}

export interface UpdateUserDto {
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
  staffMemberId?: Guid;
}

export interface ResetPasswordDto {
  newPassword: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResultDto {
  token: string;
  expiresAt: string;
  user: UserDto;
}

// ── Programs ──────────────────────────────────────────────────────────────────

export interface ProgramSummaryDto {
  id: Guid;
  name: string;
  slug: string;
  colorHex: string;
  sessionSchedule: string | null;
  defaultLocation: string | null;
  /** Flags enum serialized as comma-separated names, e.g. "Monday, Wednesday, Friday" or "None". */
  meetingDays: string;
  /** "HH:mm:ss" or null. */
  startTime: string | null;
  endTime: string | null;
  enrolledCount: number;
  attendancePct: number | null;
  nextSessionDate: string | null;
  nextSessionMeta: string | null;
  alertCount: number;
}

export interface ProgramDetailDto {
  id: Guid;
  name: string;
  slug: string;
  colorHex: string;
  sessionSchedule: string | null;
  defaultLocation: string | null;
  enrolledCount: number;
  attendancePct: number | null;
  participants: ParticipantSummaryDto[];
  upcomingEvents: CalendarEventDto[];
  staff: StaffSummaryDto[];
  alerts: ProgramAlertDto[];
}

export interface ProgramAlertDto {
  severity: AlertSeverity;
  message: string;
}

export interface CreateProgramDto {
  name: string;
  colorHex: string;
  sessionSchedule?: string;
  defaultLocation?: string;
  /** Comma-separated day names ("Monday, Wednesday, Friday") or "None". */
  meetingDays?: string;
  /** "HH:mm:ss". */
  startTime?: string;
  endTime?: string;
}

export interface UpdateProgramDto {
  name: string;
  colorHex: string;
  sessionSchedule?: string;
  defaultLocation?: string;
  meetingDays: string;
  startTime?: string;
  endTime?: string;
}

// ── Participants ──────────────────────────────────────────────────────────────

export interface ParticipantSummaryDto {
  id: Guid;
  fullName: string;
  initials: string;
  status: ParticipantStatus;
  programId: Guid;
  programName: string;
  programSlug: string;
  attendancePct: number;
  startDate: string;
  hasDocAlerts: boolean;
}

export interface ParticipantDetailDto extends ParticipantSummaryDto {
  birthYear: number | null;
  serviceCoordinator: string | null;
  documents: DocumentRecordDto[];
  recentAttendance: AttendanceRecordDto[];
}

export interface CreateParticipantDto {
  fullName: string;
  initials: string;
  programId: Guid;
  status?: ParticipantStatus;
  birthYear?: number;
  serviceCoordinator?: string;
  startDate?: string;
}

export interface UpdateParticipantDto {
  fullName?: string;
  initials?: string;
  programId?: Guid;
  status?: ParticipantStatus;
  birthYear?: number;
  serviceCoordinator?: string;
}

// ── Staff ─────────────────────────────────────────────────────────────────────

export interface StaffSummaryDto {
  id: Guid;
  fullName: string;
  initials: string;
  role: StaffRole;
  startDate: string;
  onboardingProgressPct: number;
  programNames: string[];
}

export interface StaffDetailDto extends StaffSummaryDto {
  onboardingItems: OnboardingItemDto[];
}

export interface CreateStaffDto {
  fullName: string;
  initials: string;
  role: StaffRole;
  startDate?: string;
  programIds?: Guid[];
}

export interface UpdateStaffDto {
  fullName?: string;
  initials?: string;
  role?: StaffRole;
  programIds?: Guid[];
}

// ── Attendance ────────────────────────────────────────────────────────────────

export interface AttendanceSessionDto {
  sessionId: Guid;
  programId: Guid;
  date: string;
  room: string | null;
  timeRange: string | null;
  records: AttendanceRecordDto[];
}

export interface AttendanceRecordDto {
  id: Guid;
  participantId: Guid;
  participantName: string;
  participantInitials: string;
  status: AttendanceStatus;
  group: string | null;
  notes: AttendanceNoteDto[];
}

export interface AttendanceNoteDto {
  id: Guid;
  content: string;
  noteType: "observation" | "concern";
}

export interface UpdateAttendanceDto {
  status: AttendanceStatus;
}

export interface AttendanceRosterEntryDto {
  recordId: Guid;
  participantId: Guid;
  fullName: string;
  initials: string;
  programId: Guid;
  programSlug: string;
  programName: string;
  status: AttendanceStatus;
  notes: AttendanceNoteDto[];
}

export interface CreateAttendanceNoteDto {
  content: string;
  noteType: "observation" | "concern";
}

/** A session card on the attendance landing page (scoped to the current user's programs). */
export interface ScheduledSessionDto {
  sessionId: Guid | null;
  programId: Guid;
  programSlug: string;
  programName: string;
  colorHex: string;
  date: string;
  timeRange: string | null;
  room: string | null;
  status: "not-started" | "in-progress" | "submitted";
  markedCount: number;
  totalCount: number;
  isAdHoc: boolean;
}

/** A single session's roster plus meta — the working view for taking attendance. */
export interface SessionRosterDto {
  sessionId: Guid;
  programId: Guid;
  programSlug: string;
  programName: string;
  colorHex: string;
  date: string;
  timeRange: string | null;
  room: string | null;
  status: "open" | "submitted";
  submittedAt: string | null;
  entries: AttendanceRosterEntryDto[];
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardDto {
  participants: ParticipantSummaryDto[];
  todayRoster: AttendanceRosterEntryDto[];
  projects: ProjectDto[];
  staff: StaffSummaryDto[];
  programs: ProgramSummaryDto[];
  events: CalendarEventDto[];
}

// ── Reports ───────────────────────────────────────────────────────────────────

export interface ReportsDto {
  totals: ReportTotalsDto;
  programs: ProgramReportDto[];
  staffOnboarding: StaffOnboardingReportDto[];
  attendance: AttendanceSummaryDto;
}

export interface ReportTotalsDto {
  totalParticipants: number;
  activeParticipants: number;
  prospective: number;
  attention: number;
  former: number;
  programs: number;
  staff: number;
  fullyOnboardedStaff: number;
  avgAttendancePct: number;
  openTasks: number;
  overdueTasks: number;
}

export interface ProgramReportDto {
  slug: string;
  name: string;
  enrolled: number;
  attendancePct: number;
  sessions: number;
}

export interface StaffOnboardingReportDto {
  name: string;
  pct: number;
}

export interface AttendanceSummaryDto {
  sessions: number;
  present: number;
  absent: number;
  unmarked: number;
  presentRatePct: number;
}

// ── Projects & Tasks ──────────────────────────────────────────────────────────

export interface ProjectDto {
  id: Guid;
  title: string;
  type: ProjectType;
  status: string;
  scope: string | null;
  dueDate: string | null;
  tasks: ProjectTaskDto[];
}

export interface ProjectTaskDto {
  id: Guid;
  projectId: Guid;
  name: string;
  context: string | null;
  assignedToId: Guid | null;
  assignedToName: string | null;
  assignedToInitials: string | null;
  taskStatus: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  isOverdue: boolean;
}

export interface CreateProjectDto {
  title: string;
  type: ProjectType;
  status?: string;
  scope?: string;
  dueDate?: string;
}

export interface CreateTaskDto {
  projectId: Guid;
  name: string;
  context?: string;
  assignedToId?: Guid;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface UpdateTaskDto {
  name?: string;
  context?: string;
  assignedToId?: Guid | null;
  taskStatus?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}

// ── Scripts ───────────────────────────────────────────────────────────────────

export interface ScriptDto {
  id: Guid;
  title: string;
  subtitle: string | null;
  type: ScriptType;
  status: ScriptStatus;
  isOriginal: boolean;
  isAdapted: boolean;
  castMin: number | null;
  castMax: number | null;
  duration: string | null;
  lastUsed: string | null;
  programNames: string[];
}

export interface CreateScriptDto {
  title: string;
  subtitle?: string;
  type: ScriptType;
  status?: ScriptStatus;
  isOriginal?: boolean;
  isAdapted?: boolean;
  castMin?: number;
  castMax?: number;
  duration?: string;
  programIds?: Guid[];
}

export interface UpdateScriptDto {
  title?: string;
  subtitle?: string;
  type?: ScriptType;
  status?: ScriptStatus;
  programIds?: Guid[];
}

// ── Calendar ──────────────────────────────────────────────────────────────────

export interface CalendarEventDto {
  id: Guid;
  title: string;
  location: string | null;
  meta: string | null;
  date: string;
  timeRange: string | null;
  programId: Guid | null;
  programName: string | null;
  isUpcoming: boolean;
}

export interface CreateCalendarEventDto {
  title: string;
  date: string;
  programId?: Guid;
  location?: string;
  meta?: string;
  timeRange?: string;
}

// ── Taxonomy (shared skill framework) ─────────────────────────────────────────

export interface SubSkillDto {
  id: Guid;
  objectiveAreaId: Guid;
  name: string;
  slug: string;
  sectionNumber: number;
  sortOrder: number;
  isActive: boolean;
  objectiveAreaName: string | null;
  objectiveAreaColorHex: string | null;
}

export interface ObjectiveAreaDto {
  id: Guid;
  name: string;
  slug: string;
  colorHex: string;
  sortOrder: number;
  subSkills: SubSkillDto[];
}

export interface ReferenceListsDto {
  objectiveAreas: ObjectiveAreaDto[];
  subSkills: SubSkillDto[];
  progressLevels: ProgressLevel[];
}

// ── Documents & Onboarding ────────────────────────────────────────────────────

export interface DocumentRecordDto {
  id: Guid;
  documentType: string;
  expiryDate: string | null;
  isComplete: boolean;
}

export interface OnboardingItemDto {
  id: Guid;
  section: string;
  label: string;
  isCompleted: boolean;
  completedDate: string | null;
  expiryDate: string | null;
}
