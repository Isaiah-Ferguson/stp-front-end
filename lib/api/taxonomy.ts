import { api } from "./client";
import type {
  ObjectiveAreaDto,
  SubSkillDto,
  ReferenceListsDto,
} from "../types/api";

export const taxonomyApi = {
  getObjectiveAreas: () => api.get<ObjectiveAreaDto[]>("/api/taxonomy/objective-areas"),
  getSubSkills:      () => api.get<SubSkillDto[]>("/api/taxonomy/sub-skills"),
  getLists:          () => api.get<ReferenceListsDto>("/api/lists"),
};
