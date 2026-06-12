import { api } from "./client";
import type {
  ProjectDto,
  ProjectTaskDto,
  CreateProjectDto,
  CreateTaskDto,
  UpdateTaskDto,
} from "../types/api";

export const tasksApi = {
  getProjects:   ()                          => api.get<ProjectDto[]>("/api/projects"),
  createProject: (dto: CreateProjectDto)     => api.post<ProjectDto>("/api/projects", dto),
  addTask:       (projectId: string, dto: CreateTaskDto) =>
    api.post<ProjectTaskDto>(`/api/projects/${projectId}/tasks`, dto),
  updateTask:    (taskId: string, dto: UpdateTaskDto) =>
    api.put<ProjectTaskDto>(`/api/tasks/${taskId}`, dto),
};
