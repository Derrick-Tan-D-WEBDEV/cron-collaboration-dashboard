import { User } from "../types";

const API_URL = process.env.NODE_ENV === "development" ? "http://localhost:5001/api" : "/api";

export const authService = {
  async login(email: string, password: string): Promise<{ user: User; token: string; refreshToken: string }> {
    // Stub: return a mock user for development
    return {
      user: {
        id: "1",
        email,
        name: email.split("@")[0],
        role: "admin",
        workspaceId: "default",
        preferences: {
          theme: "auto",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: "en",
          notifications: { email: true, push: true, slack: false, jobFailures: true, jobSuccess: false, systemAlerts: true, weeklyReports: true },
          dashboard: { defaultView: "grid", refreshInterval: 30, chartType: "line", showPredictions: true, compactMode: false },
        },
        createdAt: new Date().toISOString(),
      },
      token: "dev-token",
      refreshToken: "dev-refresh-token",
    };
  },

  async logout(): Promise<void> {},

  async verifyToken(token: string): Promise<User> {
    return {
      id: "1",
      email: "dev@example.com",
      name: "Developer",
      role: "admin",
      workspaceId: "default",
      preferences: {
        theme: "auto",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: "en",
        notifications: { email: true, push: true, slack: false, jobFailures: true, jobSuccess: false, systemAlerts: true, weeklyReports: true },
        dashboard: { defaultView: "grid", refreshInterval: 30, chartType: "line", showPredictions: true, compactMode: false },
      },
      createdAt: new Date().toISOString(),
    };
  },

  async refreshToken(refreshToken: string): Promise<{ token: string; user: User }> {
    const user = await authService.verifyToken("");
    return { token: "dev-token-refreshed", user };
  },
};
