import { api } from "./client";
import type {
  LoginDto,
  LoginResponseDto,
  RegisterUserDto,
  UpdateUserDto,
  ResetPasswordDto,
  ChangePasswordDto,
  UserDto,
  MfaVerifyDto,
  MfaStatusDto,
  MfaSetupResultDto,
  MfaEnableDto,
  MfaEnableResultDto,
  MfaDisableDto,
  AdminResetMfaDto,
} from "../types/api";

export const authApi = {
  /**
   * The password step. For an enrolled account this sets NO session cookies and comes back
   * with `mfaRequired: true` plus a short-lived challenge cookie — finish with `verifyMfa`.
   */
  login:    (dto: LoginDto)        => api.post<LoginResponseDto>("/api/auth/login", dto),
  /** The code step: exchanges the challenge cookie plus a TOTP or recovery code for a session. */
  verifyMfa: (dto: MfaVerifyDto)   => api.post<LoginResponseDto>("/api/auth/login/mfa", dto),
  /** Revokes the refresh token and clears the httpOnly session cookies. */
  logout:   ()                     => api.post<void>("/api/auth/logout", {}),
  me:       ()                     => api.get<UserDto>("/api/auth/me"),
  register: (dto: RegisterUserDto) => api.post<UserDto>("/api/auth/register", dto),
  listUsers:()                     => api.get<UserDto[]>("/api/auth/users"),
  update:   (id: string, dto: UpdateUserDto)    => api.put<UserDto>(`/api/auth/users/${id}`, dto),
  resetPassword: (id: string, dto: ResetPasswordDto) => api.post<void>(`/api/auth/users/${id}/reset-password`, dto),
  changePassword: (dto: ChangePasswordDto) => api.post<void>("/api/auth/change-password", dto),
  remove:   (id: string)           => api.delete<void>(`/api/auth/users/${id}`),

  // ── Multi-factor authentication ─────────────────────────────────────────────
  // Every one of these is rate-limited by the backend's "login" policy (10 requests per
  // minute per IP, shared with sign-in), so callers must have something to say about a 429.

  mfaStatus: ()                    => api.get<MfaStatusDto>("/api/auth/mfa/status"),
  /** Begins enrollment. 409 when a second factor is already confirmed. Nothing is enabled yet. */
  mfaSetup:  ()                    => api.post<MfaSetupResultDto>("/api/auth/mfa/setup", {}),
  /** Confirms enrollment and returns the recovery codes. THE ONLY TIME THEY ARE EVER SHOWN. */
  mfaEnable: (dto: MfaEnableDto)   => api.post<MfaEnableResultDto>("/api/auth/mfa/enable", dto),
  /** Replaces all ten recovery codes; needs a current code so a hijacked session can't mint its own. */
  mfaRegenerateRecoveryCodes: (dto: MfaVerifyDto) =>
    api.post<MfaEnableResultDto>("/api/auth/mfa/recovery-codes", dto),
  /** Removes the caller's authenticator — password AND code. See the note in _mfa.tsx about naming. */
  mfaDisable: (dto: MfaDisableDto) => api.post<void>("/api/auth/mfa/disable", dto),
  /**
   * Clears a user's second factor. Admin only, for the lost-phone case.
   *
   * Targeting your OWN account requires currentPassword — an admin session by itself must not
   * be able to strip its own factor, or a stolen cookie routes around mfaDisable's
   * password-AND-code guard. Resetting anyone else needs no password.
   */
  adminResetMfa: (id: string, dto?: AdminResetMfaDto) =>
    api.post<void>(`/api/auth/users/${id}/mfa/reset`, dto ?? {}),
};
