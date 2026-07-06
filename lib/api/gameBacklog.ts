import { api } from "./client";
import type {
  GameIdeaDto,
  CreateGameIdeaDto,
  AgeModificationDto,
  CreateAgeModificationDto,
} from "../types/api";

export const gameBacklogApi = {
  getIdeas:   ()                            => api.get<GameIdeaDto[]>("/api/game-backlog/ideas"),
  createIdea: (dto: CreateGameIdeaDto)      => api.post<GameIdeaDto>("/api/game-backlog/ideas", dto),
  promote:    (id: string)                  => api.post<GameIdeaDto>(`/api/game-backlog/ideas/${id}/promote`, {}),
  getAgeMods: ()                            => api.get<AgeModificationDto[]>("/api/game-backlog/age-mods"),
  createAgeMod: (dto: CreateAgeModificationDto) => api.post<AgeModificationDto>("/api/game-backlog/age-mods", dto),
};
