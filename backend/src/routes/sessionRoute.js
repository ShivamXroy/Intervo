import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import{
    createSession,
    endSession,
    getActiveSessions,
    getMyRecentSessions,
    getSessionById,
    joinSessionByInvite,
    joinSession,
    updateSessionEvaluation,
} from "../controllers/sessionController.js";

const router = express.Router()

router.post("/",protectRoute, createSession);
router.get("/active", protectRoute,getActiveSessions);
router.get("/my-recent", protectRoute,getMyRecentSessions);
router.post("/join-by-invite", protectRoute,joinSessionByInvite);

router.get("/:id", protectRoute,getSessionById);
router.post("/:id/join", protectRoute,joinSession);
router.patch("/:id/evaluation", protectRoute,updateSessionEvaluation);
router.post("/:id/end", protectRoute,endSession);

export default router;
