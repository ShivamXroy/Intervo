import { KeyRoundIcon, LoaderIcon, LogInIcon } from "lucide-react";

function JoinPrivateSession({ inviteInput, setInviteInput, onJoinInvite, isJoining }) {
  return (
    <div className="card bg-base-100 border-2 border-info/20 hover:border-info/40">
      <div className="card-body">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-info/10 rounded-2xl">
            <KeyRoundIcon className="w-6 h-6 text-info" />
          </div>
          <div>
            <h2 className="text-xl font-black">Join Private Session</h2>
            <p className="text-sm opacity-60">Paste an invite link or short code.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="input input-bordered flex-1"
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value)}
            placeholder="Invite link or code"
            onKeyDown={(e) => {
              if (e.key === "Enter") onJoinInvite();
            }}
          />
          <button
            className="btn btn-info gap-2"
            onClick={onJoinInvite}
            disabled={isJoining || !inviteInput.trim()}
          >
            {isJoining ? (
              <LoaderIcon className="size-5 animate-spin" />
            ) : (
              <LogInIcon className="size-5" />
            )}
            Join
          </button>
        </div>
      </div>
    </div>
  );
}

export default JoinPrivateSession;
