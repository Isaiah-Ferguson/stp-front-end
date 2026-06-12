import { api } from "./client";
import type {
  LoginDto,
  AuthResultDto,
  RegisterUserDto,
  UpdateUserDto,
  ResetPasswordDto,
  ChangePasswordDto,
  UserDto,
} from "../types/api";

export const authApi = {
  login:    (dto: LoginDto)        => api.post<AuthResultDto>("/api/auth/login", dto),
  me:       ()                     => api.get<UserDto>("/api/auth/me"),
  register: (dto: RegisterUserDto) => api.post<UserDto>("/api/auth/register", dto),
  listUsers:()                     => api.get<UserDto[]>("/api/auth/users"),
  update:   (id: string, dto: UpdateUserDto)    => api.put<UserDto>(`/api/auth/users/${id}`, dto),
  resetPassword: (id: string, dto: ResetPasswordDto) => api.post<void>(`/api/auth/users/${id}/reset-password`, dto),
  changePassword: (dto: ChangePasswordDto) => api.post<void>("/api/auth/change-password", dto),
  remove:   (id: string)           => api.delete<void>(`/api/auth/users/${id}`),
};
