import { CheckCircle2Icon, Code2Icon, LoaderIcon, PlusIcon } from "lucide-react";
import { PROBLEMS } from "../data/problems";

function CreateSessionModal({
  isOpen,
  onClose,
  roomConfig,
  setRoomConfig,
  onCreateRoom,
  isCreating,
}) {
  const problems = Object.values(PROBLEMS);
  const selectedProblems = roomConfig.problems || [];

  const toggleProblem = (problem) => {
    const isSelected = selectedProblems.some((item) => item.id === problem.id);

    setRoomConfig({
      problems: isSelected
        ? selectedProblems.filter((item) => item.id !== problem.id)
        : [...selectedProblems, problem],
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-2xl mb-6">Create New Session</h3>

        <div className="space-y-8">
          {/* PROBLEM SELECTION */}
          <div className="space-y-2">
            <label className="label">
              <span className="label-text font-semibold">Select Questions</span>
              <span className="label-text-alt text-error">*</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {problems.map((problem) => {
                const isSelected = selectedProblems.some((item) => item.id === problem.id);

                return (
                  <button
                    key={problem.id}
                    type="button"
                    onClick={() => toggleProblem(problem)}
                    className={`text-left rounded-xl border-2 p-4 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-base-300 bg-base-100 hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{problem.title}</p>
                        <p className="text-sm text-base-content/60">{problem.category}</p>
                      </div>
                      {isSelected && <CheckCircle2Icon className="size-5 text-primary shrink-0" />}
                    </div>
                    <span className="badge badge-sm mt-3">{problem.difficulty}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ROOM SUMMARY */}
          {selectedProblems.length > 0 && (
            <div className="alert alert-success">
              <Code2Icon className="size-5" />
              <div>
                <p className="font-semibold">Room Summary:</p>
                <p>
                  Questions: <span className="font-medium">{selectedProblems.length}</span>
                </p>
                <p className="text-sm">
                  {selectedProblems.map((problem) => problem.title).join(", ")}
                </p>
                <p>
                  Max Participants: <span className="font-medium">2 (1-on-1 session)</span>
                </p>
                <p>
                  Access: <span className="font-medium">Private invite link only</span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>

          <button
            className="btn btn-primary gap-2"
            onClick={onCreateRoom}
            disabled={isCreating || selectedProblems.length === 0}
          >
            {isCreating ? (
              <LoaderIcon className="size-5 animate-spin" />
            ) : (
              <PlusIcon className="size-5" />
            )}

            {isCreating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}
export default CreateSessionModal;
