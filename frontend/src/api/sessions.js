import axiosInstance from "../lib/axios";

export const sessionApi = {
  createSession: async (data) => {
    const response = await axiosInstance.post("/sessions", data);
    return response.data;
  },

  getActiveSessions: async () => {
    const response = await axiosInstance.get("/sessions/active");
    return response.data;
  },
  getMyRecentSessions: async () => {
    const response = await axiosInstance.get("/sessions/my-recent");
    return response.data;
  },

  getSessionById: async ({ id, inviteToken }) => {
    const response = await axiosInstance.get(`/sessions/${id}`, {
      params: inviteToken ? { invite: inviteToken } : {},
    });
    return response.data;
  },

  joinSession: async ({ id, inviteToken }) => {
    const response = await axiosInstance.post(`/sessions/${id}/join`, { inviteToken });
    return response.data;
  },
  joinSessionByInvite: async (invite) => {
    const response = await axiosInstance.post(`/sessions/join-by-invite`, { invite });
    return response.data;
  },
  endSession: async (id) => {
    const response = await axiosInstance.post(`/sessions/${id}/end`);
    return response.data;
  },
  updateSessionEvaluation: async ({ id, evaluation }) => {
    const response = await axiosInstance.patch(`/sessions/${id}/evaluation`, evaluation);
    return response.data;
  },
  getStreamToken: async () => {
    const response = await axiosInstance.get(`/chat/token`);
    return response.data;
  },
};
