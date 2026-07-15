"use client";

// Shared TanStack Query hooks (#34) — one place for cache keys and fetchers so pages
// stop re-implementing useState + useEffect + .catch(() => setX([])) per resource.
// Reference data (programs, staff, taxonomy) is cached for 60s across page navigations.

import { useQuery } from "@tanstack/react-query";
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
};

export const usePrograms = () =>
  useQuery({ queryKey: queryKeys.programs, queryFn: () => programsApi.getAll() });

export const useMyPrograms = () =>
  useQuery({ queryKey: queryKeys.myPrograms, queryFn: () => programsApi.getMine() });

export const useParticipants = () =>
  useQuery({ queryKey: queryKeys.participants, queryFn: () => participantsApi.getAll() });

export const useStaff = () =>
  useQuery({ queryKey: queryKeys.staff, queryFn: () => staffApi.getAll() });

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
