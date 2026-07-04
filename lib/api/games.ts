import { api } from "./client";
import type {
  GameSummaryDto,
  GameDetailDto,
  GameFilter,
  CreateGameDto,
  UpdateGameDto,
} from "../types/api";

function toQuery(filter?: GameFilter): string {
  if (!filter) return "";
  const p = new URLSearchParams();
  if (filter.tier) p.set("tier", filter.tier);
  if (filter.objectiveAreaId) p.set("objectiveAreaId", filter.objectiveAreaId);
  if (filter.subSkillId) p.set("subSkillId", filter.subSkillId);
  if (filter.category) p.set("category", filter.category);
  if (filter.q && filter.q.trim()) p.set("q", filter.q.trim());
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const gamesApi = {
  list:    (filter?: GameFilter)        => api.get<GameSummaryDto[]>(`/api/games${toQuery(filter)}`),
  getById: (id: string)                 => api.get<GameDetailDto>(`/api/games/${id}`),
  create:  (dto: CreateGameDto)         => api.post<GameDetailDto>("/api/games", dto),
  update:  (id: string, dto: UpdateGameDto) => api.put<GameDetailDto>(`/api/games/${id}`, dto),
};
