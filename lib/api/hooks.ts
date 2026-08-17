"use client";

// Shared TanStack Query hooks (#34) — one place for cache keys and fetchers so pages
// stop re-implementing useState + useEffect + .catch(() => setX([])) per resource.
// Reference data (programs, staff, taxonomy) is cached for 60s across page navigations.

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { auditApi } from "./audit";
import { programsApi } from "./programs";
import { participantsApi } from "./participants";
import { staffApi } from "./staff";
import { dashboardApi } from "./dashboard";
import { tasksApi } from "./tasks";
import { authApi } from "./auth";
import { reportsApi } from "./reports";
import { calendarApi } from "./calendar";
import { scriptsApi } from "./scripts";
import { taxonomyApi } from "./taxonomy";
import { volunteersApi } from "./volunteers";
import type { AuditQueryParams } from "../types/api";

export const queryKeys = {
  programs: ["programs"] as const,
  myPrograms: ["programs", "mine"] as const,
  participants: ["participants"] as const,
  staff: ["staff"] as const,
  checklistTemplate: ["staff", "checklist-template"] as const,
  dashboard: ["dashboard"] as const,
  projects: ["projects"] as const,
  users: ["users"] as const,
  reports: ["reports"] as const,
  calendarEvents: (month: number, year: number) => ["calendar-events", month, year] as const,
  scripts: ["scripts"] as const,
  objectiveAreas: ["taxonomy", "objective-areas"] as const,
  subSkills: ["taxonomy", "sub-skills"] as const,
  volunteers: ["volunteers"] as const,
  audit: (params: AuditQueryParams) => ["audit", params] as const,
};

export const usePrograms = () =>
  useQuery({ queryKey: queryKeys.programs, queryFn: () => programsApi.getAll() });

export const useMyPrograms = () =>
  useQuery({ queryKey: queryKeys.myPrograms, queryFn: () => programsApi.getMine() });

export const useParticipants = () =>
  useQuery({ queryKey: queryKeys.participants, queryFn: () => participantsApi.getAll() });

export const useStaff = () =>
  useQuery({ queryKey: queryKeys.staff, queryFn: () => staffApi.getAll() });

export const useVolunteers = () =>
  useQuery({ queryKey: queryKeys.volunteers, queryFn: () => volunteersApi.getAll() });

export const useChecklistTemplate = () =>
  useQuery({ queryKey: queryKeys.checklistTemplate, queryFn: () => staffApi.getChecklistTemplate(), staleTime: 60_000 });

export const useDashboard = () =>
  useQuery({ queryKey: queryKeys.dashboard, queryFn: () => dashboardApi.get(), staleTime: 15_000 });

export const useProjects = () =>
  useQuery({ queryKey: queryKeys.projects, queryFn: () => tasksApi.getProjects() });

export const useUsers = (enabled = true) =>
  useQuery({ queryKey: queryKeys.users, queryFn: () => authApi.listUsers(), enabled });

export const useReports = () =>
  useQuery({ queryKey: queryKeys.reports, queryFn: () => reportsApi.get() });

export const useCalendarEvents = (month: number, year: number) =>
  useQuery({
    queryKey: queryKeys.calendarEvents(month, year),
    queryFn: () => calendarApi.getEvents(month, year),
  });

export const useScripts = () =>
  useQuery({ queryKey: queryKeys.scripts, queryFn: () => scriptsApi.getAll() });

// Sites + star groups + progress levels — near-static reference data.
export const useReferenceLists = () =>
  useQuery({ queryKey: ["reference-lists"], queryFn: () => taxonomyApi.getLists(), staleTime: 5 * 60_000 });

// The skills taxonomy is near-static reference data — cache it for 5 minutes.
export const useObjectiveAreas = () =>
  useQuery({ queryKey: queryKeys.objectiveAreas, queryFn: () => taxonomyApi.getObjectiveAreas(), staleTime: 5 * 60_000 });

export const useSubSkills = () =>
  useQuery({ queryKey: queryKeys.subSkills, queryFn: () => taxonomyApi.getSubSkills(), staleTime: 5 * 60_000 });

/**
 * Audit log search. Unlike everything else here the filters and page live in the key, so
 * each combination caches separately.
 *
 * `keepPreviousData` holds the current page on screen while the next one loads instead of
 * collapsing the table back to skeletons — which matters more here than elsewhere: reading
 * this log writes an audit.view row of its own, so a flicker that tempts an admin into
 * clicking again costs a spurious entry in the very table they are reading.
 *
 * `staleTime: 0` is set explicitly rather than left to the default, because the default here
 * is NOT zero: QueryProvider sets 60 seconds app-wide. Inheriting it meant an admin who
 * loaded /audit, stepped away to /users and came back within the minute saw a cached page —
 * so a refresh-token replay recorded in between simply was not there. An audit log is read to
 * check what just happened; a minute is the wrong amount of stale for that.
 */
export const useAuditEvents = (params: AuditQueryParams) =>
  useQuery({
    queryKey: queryKeys.audit(params),
    queryFn: () => auditApi.search(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
