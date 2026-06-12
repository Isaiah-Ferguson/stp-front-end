import { api } from "./client";
import type {
  CalendarEventDto,
  CreateCalendarEventDto,
} from "../types/api";

export const calendarApi = {
  getEvents: (month: number, year: number) =>
    api.get<CalendarEventDto[]>(`/api/calendar/events?month=${month}&year=${year}`),
  create: (dto: CreateCalendarEventDto) =>
    api.post<CalendarEventDto>("/api/calendar/events", dto),
};
