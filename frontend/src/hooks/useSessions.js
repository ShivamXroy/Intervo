import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { sessionApi } from "../api/sessions";

export const useCreateSession = () => {
  const result = useMutation({
    mutationKey: ["createSession"],
    mutationFn: sessionApi.createSession,
    onSuccess: () => toast.success("Session created successfully!"),
    onError: (error) => toast.error(error.response?.data?.message || "Failed to create room"),
  });

  return result;
};

export const useActiveSessions = () => {
  const result = useQuery({
    queryKey: ["activeSessions"],
    queryFn: sessionApi.getActiveSessions,
  });

  return result;
};

export const useMyRecentSessions = () => {
  const result = useQuery({
    queryKey: ["myRecentSessions"],
    queryFn: sessionApi.getMyRecentSessions,
  });

  return result;
};

export const useSessionById = (id, inviteToken = "") => {
  const result = useQuery({
    queryKey: ["session", id, inviteToken],
    queryFn: () => sessionApi.getSessionById({ id, inviteToken }),
    enabled: !!id,
    refetchInterval: 5000, // refetch every 5 seconds to detect session status changes
  });

  return result;
};

export const useJoinSession = () => {
  const result = useMutation({
    mutationKey: ["joinSession"],
    mutationFn: sessionApi.joinSession,
    onSuccess: () => toast.success("Joined session successfully!"),
    onError: (error) => toast.error(error.response?.data?.message || "Failed to join session"),
  });

  return result;
};

export const useJoinSessionByInvite = () => {
  const result = useMutation({
    mutationKey: ["joinSessionByInvite"],
    mutationFn: sessionApi.joinSessionByInvite,
    onSuccess: () => toast.success("Private session joined"),
    onError: (error) => toast.error(error.response?.data?.message || "Failed to join invite"),
  });

  return result;
};

export const useEndSession = () => {
  const result = useMutation({
    mutationKey: ["endSession"],
    mutationFn: sessionApi.endSession,
    onSuccess: () => toast.success("Session ended successfully!"),
    onError: (error) => toast.error(error.response?.data?.message || "Failed to end session"),
  });

  return result;
};

export const useUpdateSessionEvaluation = () => {
  const result = useMutation({
    mutationKey: ["updateSessionEvaluation"],
    mutationFn: sessionApi.updateSessionEvaluation,
    onSuccess: () => toast.success("Evaluation saved"),
    onError: (error) => toast.error(error.response?.data?.message || "Failed to save evaluation"),
  });

  return result;
};
