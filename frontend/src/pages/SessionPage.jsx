import { useUser } from "@clerk/clerk-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  useEndSession,
  useJoinSession,
  useSessionById,
  useUpdateSessionEvaluation,
} from "../hooks/useSessions";
import { PROBLEMS } from "../data/problems";
import { executeCode } from "../lib/piston";
import Navbar from "../components/Navbar";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { getDifficultyBadgeClass } from "../lib/utils";
import {
  ClipboardCheckIcon,
  CopyIcon,
  Loader2Icon,
  LogOutIcon,
  PhoneOffIcon,
  SaveIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react";
import CodeEditorPanel from "../components/CodeEditorPanel";
import OutputPanel from "../components/OutputPanel";
import toast from "react-hot-toast";

import useStreamClient from "../hooks/useStreamClient";
import { StreamCall, StreamVideo } from "@stream-io/video-react-sdk";
import VideoCallUI from "../components/VideoCallUI";

function SessionPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeProblemTitle, setActiveProblemTitle] = useState("");
  const [evaluationForm, setEvaluationForm] = useState({
    notes: "",
    score: "",
    decision: "pending",
  });
  const [inviteCopied, setInviteCopied] = useState(false);
  const inviteToken = searchParams.get("invite") || "";

  const {
    data: sessionData,
    isLoading: loadingSession,
    error: sessionError,
    refetch,
  } = useSessionById(id, inviteToken);

  const joinSessionMutation = useJoinSession();
  const endSessionMutation = useEndSession();
  const updateEvaluationMutation = useUpdateSessionEvaluation();

  const session = sessionData?.session;
  const isHost = session?.host?.clerkId === user?.id;
  const isParticipant = session?.participant?.clerkId === user?.id;

  const { call, channel, chatClient, isInitializingCall, streamClient } = useStreamClient(
    session,
    loadingSession,
    isHost,
    isParticipant
  );

  const sessionProblems = useMemo(
    () => (session?.problems?.length ? session.problems : session?.problem ? [session.problem] : []),
    [session?.problem, session?.problems]
  );
  const selectedProblemTitle = activeProblemTitle || sessionProblems[0] || "";

  // find the problem data based on selected session problem title
  const problemData = selectedProblemTitle
    ? Object.values(PROBLEMS).find((p) => p.title === selectedProblemTitle)
    : null;

  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState(problemData?.starterCode?.[selectedLanguage] || "");
  const [codeByProblem, setCodeByProblem] = useState({});

  // auto-join session if user is not already a participant and not the host
  useEffect(() => {
    if (!session || !user || loadingSession) return;
    if (isHost || isParticipant) return;

    joinSessionMutation.mutate({ id, inviteToken }, { onSuccess: refetch });

    // remove the joinSessionMutation, refetch from dependencies to avoid infinite loop
  }, [
    session,
    user,
    loadingSession,
    isHost,
    isParticipant,
    id,
    inviteToken,
    joinSessionMutation,
    refetch,
  ]);

  // redirect the "participant" when session ends
  useEffect(() => {
    if (!session || loadingSession) return;

    if (session.status === "completed") navigate("/dashboard");
  }, [session, loadingSession, navigate]);

  // update code when problem loads or changes
  useEffect(() => {
    if (!problemData?.starterCode?.[selectedLanguage] || !selectedProblemTitle) return;

    const codeKey = `${selectedProblemTitle}:${selectedLanguage}`;
    const savedCode = codeByProblem[codeKey];

    if (savedCode !== undefined) {
      setCode(savedCode);
      setOutput(null);
      return;
    }

    const starterCode = problemData.starterCode[selectedLanguage];
    setCode(starterCode);
    setCodeByProblem((current) => ({
      ...current,
      [codeKey]: starterCode,
    }));
    setOutput(null);
  }, [problemData, selectedLanguage, selectedProblemTitle, codeByProblem]);

  useEffect(() => {
    if (!activeProblemTitle && sessionProblems.length > 0) {
      setActiveProblemTitle(sessionProblems[0]);
    }
  }, [activeProblemTitle, sessionProblems]);

  useEffect(() => {
    if (!session?.evaluation) return;

    setEvaluationForm({
      notes: session.evaluation.notes || "",
      score: session.evaluation.score ?? "",
      decision: session.evaluation.decision || "pending",
    });
  }, [session?.evaluation]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setSelectedLanguage(newLang);
    setOutput(null);
  };

  const handleCodeChange = (value) => {
    const nextCode = value || "";
    setCode(nextCode);

    if (!selectedProblemTitle) return;

    setCodeByProblem((current) => ({
      ...current,
      [`${selectedProblemTitle}:${selectedLanguage}`]: nextCode,
    }));
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput(null);

    const result = await executeCode(selectedLanguage, code);
    setOutput(result);
    setIsRunning(false);
  };

  const handleEndSession = () => {
    if (confirm("Are you sure you want to end this session? All participants will be notified.")) {
      // this will navigate the HOST to dashboard
      endSessionMutation.mutate(id, { onSuccess: () => navigate("/dashboard") });
    }
  };

  const handleCopyInvite = async () => {
    if (!session?.inviteToken) return;

    const inviteLink = `${window.location.origin}/session/${session._id}?invite=${session.inviteToken}&code=${session.inviteCode}`;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      toast.success("Invite link copied");
      setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      toast.error("Could not copy invite link");
    }
  };

  const handleSaveEvaluation = () => {
    updateEvaluationMutation.mutate(
      {
        id,
        evaluation: evaluationForm,
      },
      { onSuccess: refetch }
    );
  };

  if (sessionError) {
    return (
      <div className="min-h-screen bg-base-200">
        <Navbar />
        <div className="container mx-auto px-6 py-20">
          <div className="card bg-base-100 max-w-xl mx-auto shadow-xl">
            <div className="card-body items-center text-center">
              <ShieldCheckIcon className="size-12 text-error" />
              <h1 className="card-title text-2xl">Private Session</h1>
              <p className="text-base-content/70">
                This session is invite-only. Ask the interviewer for the correct invite link.
              </p>
              <button className="btn btn-primary mt-4" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-base-100 flex flex-col">
      <Navbar />

      <div className="flex-1">
        <PanelGroup direction="horizontal">
          {/* LEFT PANEL - CODE EDITOR & PROBLEM DETAILS */}
          <Panel defaultSize={50} minSize={30}>
            <PanelGroup direction="vertical">
              {/* PROBLEM DSC PANEL */}
              <Panel defaultSize={50} minSize={20}>
                <div className="h-full overflow-y-auto bg-base-200">
                  {/* HEADER SECTION */}
                  <div className="p-6 bg-base-100 border-b border-base-300">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h1 className="text-3xl font-bold text-base-content">
                          {selectedProblemTitle || "Loading..."}
                        </h1>
                        {problemData?.category && (
                          <p className="text-base-content/60 mt-1">{problemData.category}</p>
                        )}
                        <p className="text-base-content/60 mt-2">
                          Host: {session?.host?.name || "Loading..."} •{" "}
                          {session?.participant ? 2 : 1}/2 participants
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className="badge badge-primary gap-1">
                            <ShieldCheckIcon className="size-3" />
                            Interviewer
                          </span>
                          <span className="badge badge-secondary gap-1">
                            <UserRoundIcon className="size-3" />
                            Candidate
                          </span>
                          <span className="badge badge-outline">Private invite-only room</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`badge badge-lg ${getDifficultyBadgeClass(
                            session?.difficulty
                          )}`}
                        >
                          {session?.difficulty.slice(0, 1).toUpperCase() +
                            session?.difficulty.slice(1) || "Easy"}
                        </span>
                        {isHost && session?.status === "active" && (
                          <>
                            {session?.inviteCode && (
                              <span className="badge badge-info badge-lg">
                                Code: {session.inviteCode}
                              </span>
                            )}
                            <button
                              onClick={handleCopyInvite}
                              className="btn btn-outline btn-sm gap-2"
                              disabled={!session?.inviteToken}
                            >
                              {inviteCopied ? (
                                <ClipboardCheckIcon className="w-4 h-4" />
                              ) : (
                                <CopyIcon className="w-4 h-4" />
                              )}
                              Invite Link
                            </button>
                            <button
                              onClick={handleEndSession}
                              disabled={endSessionMutation.isPending}
                              className="btn btn-error btn-sm gap-2"
                            >
                              {endSessionMutation.isPending ? (
                                <Loader2Icon className="w-4 h-4 animate-spin" />
                              ) : (
                                <LogOutIcon className="w-4 h-4" />
                              )}
                              End Session
                            </button>
                          </>
                        )}
                        {session?.status === "completed" && (
                          <span className="badge badge-ghost badge-lg">Completed</span>
                        )}
                      </div>
                    </div>

                    {sessionProblems.length > 1 && (
                      <div className="flex flex-wrap gap-2 mt-5">
                        {sessionProblems.map((problemTitle, index) => (
                          <button
                            key={problemTitle}
                            type="button"
                            onClick={() => setActiveProblemTitle(problemTitle)}
                            className={`btn btn-sm ${
                              selectedProblemTitle === problemTitle ? "btn-primary" : "btn-ghost"
                            }`}
                          >
                            {index + 1}. {problemTitle}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-6 space-y-6">
                    {/* problem desc */}
                    {problemData?.description && (
                      <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                        <h2 className="text-xl font-bold mb-4 text-base-content">Description</h2>
                        <div className="space-y-3 text-base leading-relaxed">
                          <p className="text-base-content/90">{problemData.description.text}</p>
                          {problemData.description.notes?.map((note, idx) => (
                            <p key={idx} className="text-base-content/90">
                              {note}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* examples section */}
                    {problemData?.examples && problemData.examples.length > 0 && (
                      <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                        <h2 className="text-xl font-bold mb-4 text-base-content">Examples</h2>

                        <div className="space-y-4">
                          {problemData.examples.map((example, idx) => (
                            <div key={idx}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="badge badge-sm">{idx + 1}</span>
                                <p className="font-semibold text-base-content">Example {idx + 1}</p>
                              </div>
                              <div className="bg-base-200 rounded-lg p-4 font-mono text-sm space-y-1.5">
                                <div className="flex gap-2">
                                  <span className="text-primary font-bold min-w-[70px]">
                                    Input:
                                  </span>
                                  <span>{example.input}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-secondary font-bold min-w-[70px]">
                                    Output:
                                  </span>
                                  <span>{example.output}</span>
                                </div>
                                {example.explanation && (
                                  <div className="pt-2 border-t border-base-300 mt-2">
                                    <span className="text-base-content/60 font-sans text-xs">
                                      <span className="font-semibold">Explanation:</span>{" "}
                                      {example.explanation}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Constraints */}
                    {problemData?.constraints && problemData.constraints.length > 0 && (
                      <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                        <h2 className="text-xl font-bold mb-4 text-base-content">Constraints</h2>
                        <ul className="space-y-2 text-base-content/90">
                          {problemData.constraints.map((constraint, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="text-primary">•</span>
                              <code className="text-sm">{constraint}</code>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>

              <PanelResizeHandle className="h-2 bg-base-300 hover:bg-primary transition-colors cursor-row-resize" />

              <Panel defaultSize={50} minSize={20}>
                <PanelGroup direction="vertical">
                  <Panel defaultSize={70} minSize={30}>
                    <CodeEditorPanel
                      selectedLanguage={selectedLanguage}
                      code={code}
                      isRunning={isRunning}
                      onLanguageChange={handleLanguageChange}
                      onCodeChange={handleCodeChange}
                      onRunCode={handleRunCode}
                    />
                  </Panel>

                  <PanelResizeHandle className="h-2 bg-base-300 hover:bg-primary transition-colors cursor-row-resize" />

                  <Panel defaultSize={30} minSize={15}>
                    <OutputPanel output={output} />
                  </Panel>
                </PanelGroup>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-2 bg-base-300 hover:bg-primary transition-colors cursor-col-resize" />

          {/* RIGHT PANEL - VIDEO CALLS & CHAT */}
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full bg-base-200 p-4 overflow-auto">
              <div className="card bg-base-100 border border-base-300 mb-4">
                <div className="card-body p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-lg">
                        {isHost ? "Interviewer Dashboard" : "Candidate View"}
                      </h2>
                      <p className="text-sm text-base-content/60">
                        {isHost
                          ? "Track notes, score, and final decision for this session."
                          : "You are joining this private room as the candidate."}
                      </p>
                    </div>
                    <span className="badge badge-primary">
                      {isHost ? "Interviewer" : "Candidate"}
                    </span>
                  </div>

                  {isHost ? (
                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="form-control">
                          <span className="label-text font-semibold mb-1">Score</span>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            className="input input-bordered input-sm"
                            value={evaluationForm.score}
                            onChange={(e) =>
                              setEvaluationForm((current) => ({
                                ...current,
                                score: e.target.value,
                              }))
                            }
                            placeholder="0-10"
                          />
                        </label>
                        <label className="form-control">
                          <span className="label-text font-semibold mb-1">Decision</span>
                          <select
                            className="select select-bordered select-sm"
                            value={evaluationForm.decision}
                            onChange={(e) =>
                              setEvaluationForm((current) => ({
                                ...current,
                                decision: e.target.value,
                              }))
                            }
                          >
                            <option value="pending">Pending</option>
                            <option value="strong-no">Strong No</option>
                            <option value="no">No</option>
                            <option value="hold">Hold</option>
                            <option value="yes">Yes</option>
                            <option value="strong-yes">Strong Yes</option>
                          </select>
                        </label>
                      </div>

                      <label className="form-control">
                        <span className="label-text font-semibold mb-1">Private Notes</span>
                        <textarea
                          className="textarea textarea-bordered min-h-24"
                          value={evaluationForm.notes}
                          onChange={(e) =>
                            setEvaluationForm((current) => ({
                              ...current,
                              notes: e.target.value,
                            }))
                          }
                          placeholder="Capture communication, approach, edge cases, and final feedback."
                        />
                      </label>

                      <button
                        className="btn btn-primary btn-sm gap-2"
                        onClick={handleSaveEvaluation}
                        disabled={updateEvaluationMutation.isPending}
                      >
                        {updateEvaluationMutation.isPending ? (
                          <Loader2Icon className="size-4 animate-spin" />
                        ) : (
                          <SaveIcon className="size-4" />
                        )}
                        Save Evaluation
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-base-200 p-3">
                        <p className="font-semibold">Interviewer</p>
                        <p className="text-base-content/70">{session?.host?.name || "Loading..."}</p>
                      </div>
                      <div className="rounded-lg bg-base-200 p-3">
                        <p className="font-semibold">Questions</p>
                        <p className="text-base-content/70">{sessionProblems.length || 1} selected</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {isInitializingCall ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Loader2Icon className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
                    <p className="text-lg">Connecting to video call...</p>
                  </div>
                </div>
              ) : !streamClient || !call ? (
                <div className="h-full flex items-center justify-center">
                  <div className="card bg-base-100 shadow-xl max-w-md">
                    <div className="card-body items-center text-center">
                      <div className="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center mb-4">
                        <PhoneOffIcon className="w-12 h-12 text-error" />
                      </div>
                      <h2 className="card-title text-2xl">Connection Failed</h2>
                      <p className="text-base-content/70">Unable to connect to the video call</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full">
                  <StreamVideo client={streamClient}>
                    <StreamCall call={call}>
                      <VideoCallUI chatClient={chatClient} channel={channel} />
                    </StreamCall>
                  </StreamVideo>
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default SessionPage;
