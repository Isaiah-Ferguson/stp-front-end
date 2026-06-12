import { api } from "./client";
import type {
  ScriptDto,
  CreateScriptDto,
  UpdateScriptDto,
} from "../types/api";

export const scriptsApi = {
  getAll:  ()                        => api.get<ScriptDto[]>("/api/scripts"),
  getById: (id: string)              => api.get<ScriptDto>(`/api/scripts/${id}`),
  create:  (dto: CreateScriptDto)    => api.post<ScriptDto>("/api/scripts", dto),
  update:  (id: string, dto: UpdateScriptDto) => api.put<ScriptDto>(`/api/scripts/${id}`, dto),
};
