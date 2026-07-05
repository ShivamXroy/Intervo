import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useState } from "react";
import {
  useActiveSessions,
  useCreateSession,
  useJoinSessionByInvite,
  useMyRecentSessions,
} from "../hooks/useSessions";

import Navbar from "../components/Navbar";
import WelcomeSection from "../components/WelcomeSection";
import StatsCards from "../components/StatsCards";
import ActiveSessions from "../components/ActiveSessions";
import RecentSessions from "../components/RecentSessions";
import CreateSessionModal from "../components/CreateSessionModal";
import JoinPrivateSession from "../components/JoinPrivateSession";

function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomConfig, setRoomConfig] = useState({ problems: [] });
  const [inviteInput, setInviteInput] = useState("");

  const createSessionMutation = useCreateSession();
  const joinInviteMutation = useJoinSessionByInvite();

  const { data: activeSessionsData, isLoading: loadingActiveSessions } = useActiveSessions();
  const { data: recentSessionsData, isLoading: loadingRecentSessions } = useMyRecentSessions();

  const handleCreateRoom = () => {
    if (!roomConfig.problems.length) return;

    const difficultyRank = { Easy: 1, Medium: 2, Hard: 3 };
    const primaryProblem = roomConfig.problems[0];
    const hardestProblem = roomConfig.problems.reduce((hardest, problem) =>
      difficultyRank[problem.difficulty] > difficultyRank[hardest.difficulty] ? problem : hardest
    );

    createSessionMutation.mutate(
      {
        problem: primaryProblem.title,
        problems: roomConfig.problems.map((problem) => problem.title),
        difficulty: hardestProblem.difficulty.toLowerCase(),
      },
      {
        onSuccess: (data) => {
          setShowCreateModal(false);
          setRoomConfig({ problems: [] });
          navigate(`/session/${data.session._id}`);
        },
      }
    );
  };

  const handleJoinInvite = () => {
    const invite = inviteInput.trim();
    if (!invite) return;

    joinInviteMutation.mutate(invite, {
      onSuccess: (data) => {
        setInviteInput("");
        navigate(`/session/${data.session._id}`);
      },
    });
  };

  const activeSessions = activeSessionsData?.sessions || [];
  const recentSessions = recentSessionsData?.sessions || [];

  const isUserInSession = (session) => {
    if (!user.id) return false;

    return session.host?.clerkId === user.id || session.participant?.clerkId === user.id;
  };

  return (
    <>
      <div className="min-h-screen bg-base-300">
        <Navbar />
        <WelcomeSection onCreateSession={() => setShowCreateModal(true)} />

        {/* Grid layout */}
        <div className="container mx-auto px-6 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <StatsCards
              activeSessionsCount={activeSessions.length}
              recentSessionsCount={recentSessions.length}
            />
            <ActiveSessions
              sessions={activeSessions}
              isLoading={loadingActiveSessions}
              isUserInSession={isUserInSession}
            />
          </div>

          <div className="mt-6">
            <JoinPrivateSession
              inviteInput={inviteInput}
              setInviteInput={setInviteInput}
              onJoinInvite={handleJoinInvite}
              isJoining={joinInviteMutation.isPending}
            />
          </div>

          <RecentSessions sessions={recentSessions} isLoading={loadingRecentSessions} />
        </div>
      </div>

      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        roomConfig={roomConfig}
        setRoomConfig={setRoomConfig}
        onCreateRoom={handleCreateRoom}
        isCreating={createSessionMutation.isPending}
      />
    </>
  );
}

export default DashboardPage;
