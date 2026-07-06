import { api } from "./client";
import type { YearCalendarDto, KeyArtsDateDto } from "../types/api";

export const yearCalendarApi = {
  getCalendar:     () => api.get<YearCalendarDto>("/api/year-calendar"),
  getKeyArtsDates: () => api.get<KeyArtsDateDto[]>("/api/year-calendar/key-arts-dates"),
};
