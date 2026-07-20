import api from "./api";
import type { AuthResponse, User } from "@/types";

const AUTH_BASE = "/api/v1/auth";

export const authService = {
  async register(data: { email: string; password: string; full_name: string }): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>(`${AUTH_BASE}/register`, data);
    return res.data;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>(`${AUTH_BASE}/login`, data);
    return res.data;
  },

  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    const res = await api.post<{ access_token: string }>(`${AUTH_BASE}/refresh-token`, {
      authorization: `Bearer ${refreshToken}`,
    });
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get<User>(`${AUTH_BASE}/me`);
    return res.data;
  },
};
