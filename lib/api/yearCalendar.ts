import { api } from "./client";
import type { YearCalendarDto, KeyArtsDateDto, CalendarThemeDto, UpsertCalendarThemeDto } from "../types/api";

export const yearCalendarApi = {
  getCalendar:     () => api.get<YearCalendarDto>("/api/year-calendar"),
  getKeyArtsDates: () => api.get<KeyArtsDateDto[]>("/api/year-calendar/key-arts-dates"),
  upsertTheme:     (dto: UpsertCalendarThemeDto) => api.put<CalendarThemeDto>("/api/year-calendar/theme", dto),
};
