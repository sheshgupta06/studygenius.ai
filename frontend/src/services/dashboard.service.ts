import api from "./api";

export interface DashboardActivity {
  id: string;
  action: string;
  created_at: string;
  document_title: string | null;
}

export interface DashboardStatsResponse {
  learning_progress: number;
  weekly_goal: number;
  docs_read: number;
  quiz_score: number;
  study_time_hours: number;
  day_streak: number;
  recent_activities: DashboardActivity[];
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStatsResponse> => {
    const response = await api.get("/api/v1/users/me/dashboard");
    return response.data;
  },
};
