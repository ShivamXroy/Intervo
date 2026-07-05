import { chatClient, streamClient } from "../lib/stream.js";
import Session from "../models/Session.js";
import crypto from "crypto";

const DECISIONS = ["pending", "strong-no", "no", "hold", "yes", "strong-yes"];

function normalizeProblems(problem, problems) {
    const selectedProblems = Array.isArray(problems) && problems.length > 0 ? problems : [problem];

    return selectedProblems
        .filter(Boolean)
        .map((item) => item.toString().trim())
        .filter(Boolean);
}

function getInviteToken(req) {
    return req.body?.inviteToken || req.query?.invite || req.query?.inviteToken;
}

function generateInviteCode() {
    return crypto.randomBytes(4).toString("hex").toUpperCase();
}

function parseInviteInput(input) {
    const value = input?.toString().trim();
    if(!value) return {};

    try {
        const url = new URL(value);
        const pathParts = url.pathname.split("/").filter(Boolean);
        const sessionIndex = pathParts.findIndex((part) => part === "session");

        return {
            sessionId: sessionIndex >= 0 ? pathParts[sessionIndex + 1] : undefined,
            inviteToken: url.searchParams.get("invite") || undefined,
            inviteCode: url.searchParams.get("code") || undefined,
        };
    } catch {
        return value.length > 16
            ? { inviteToken: value }
            : { inviteCode: value.toUpperCase() };
    }
}

function getDocumentId(value) {
    return value?._id || value;
}

function isSessionMember(session, userId) {
    return (
        getDocumentId(session.host)?.toString() === userId.toString() ||
        getDocumentId(session.participant)?.toString() === userId.toString()
    );
}

function canAccessSession(session, userId, inviteToken) {
    return isSessionMember(session, userId) || (inviteToken && inviteToken === session.inviteToken);
}

function serializeSessionForUser(session, userId) {
    const payload = typeof session.toObject === "function" ? session.toObject() : session;
    const isHost = getDocumentId(payload.host)?.toString() === userId.toString();

    if(!isHost && payload.evaluation){
        payload.evaluation = {
            score: payload.evaluation.score,
            decision: payload.evaluation.decision,
        };
    }

    return payload;
}

async function ensureInviteToken(session) {
    let needsSave = false;

    if(!session.inviteToken){
        session.inviteToken = crypto.randomBytes(24).toString("hex");
        needsSave = true;
    }

    if(!session.inviteCode){
        session.inviteCode = generateInviteCode();
        needsSave = true;
    }

    if(needsSave) await session.save();
}

export async function createSession(req,res) {
    try {
        const {problem, difficulty, problems} = req.body
        const userID = req.user._id
        const clerkId = req.user.clerkId
        const selectedProblems = normalizeProblems(problem, problems)

        if(selectedProblems.length === 0 || !difficulty){
            return res.status(400).json({message:"At least one problem and difficulty are required"})
        }
        const callId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
        const inviteToken = crypto.randomBytes(24).toString("hex")
        const inviteCode = generateInviteCode()
        const primaryProblem = selectedProblems[0]
        
        const session = await Session.create({
            problem: primaryProblem,
            problems: selectedProblems,
            difficulty,
            host: userID,
            callId,
            inviteToken,
            inviteCode,
        });

        await streamClient.video.call("default",callId).getOrCreate({
            data: {
                created_by_id: clerkId,
                custom: { problem: primaryProblem, problems: selectedProblems, difficulty, getSessionId: session._id.toString() },

            },
        });
        
        //chat messaging 
        const channel = chatClient.channel("messaging",callId,{
            name: `${primaryProblem} Session`,
            created_by_id: clerkId,
            members: [clerkId]

        })

        await channel.create()
        res.status(201).json({session})  

    } catch (error) {
        console.log("Error in createSession controller:", error.message);
        res.status(500).json({message: "Internal Server Error"});
        
    }
}

export async function getActiveSessions(req,res) {
    try {
        const userId = req.user._id
        const sessions = await Session.find({
            status: "active",
            $or: [{host: userId}, {participant: userId}],
        })
            .populate("host", "name profileImage email clerkId")
            .populate("participant", "name profileImage email clerkId")
            .sort({ createdAt: -1})
            .limit(20);
        
            res.status(200).json({sessions: sessions.map((session) => serializeSessionForUser(session, userId))})
    } catch (error) {
     console.log("Error in getActiveSession controller:", error.message);
     res.status(500).json({message: "Internal Server Error"});

        
    }
}

export async function getMyRecentSessions(req,res) {
    try {
        const userId = req.user._id
        //where user is either host or participant
       const sessions =  await Session.find({
            status:"completed",
            $or: [{host: userId}, {participant: userId}],
            
        })
        .sort({createdAt: -1})
        .limit(20);

        res.status(200).json({sessions: sessions.map((session) => serializeSessionForUser(session, userId))})

    } catch (error) {
    console.log("Error in getMyRecentSessions controller:", error.message);
        res.status(500).json({message: "Internal Server Error"});

        
    }
}

export async function getSessionById(req,res) {
    try {
        const{id}=req.params
        const inviteToken = getInviteToken(req)
        const userId = req.user._id

        const session = await Session.findById(id)
        .populate("host","name email profileImage clerkId")
        .populate("participant","name email profileImage clerkId")

        if(!session)return res.status(404).json({message:"Session not found"})

        if(!canAccessSession(session, userId, inviteToken)){
            return res.status(403).json({message:"This is a private session. Use the invite link to join."})
        }

        if(isSessionMember(session, userId)){
            await ensureInviteToken(session);
        }

        res.status(200).json({session: serializeSessionForUser(session, userId)})
        
    } catch (error) {
        console.log("Error in getSessionById controller:", error.message);
        res.status(500).json({message: "Internal Server Error"});      
    }
}

export async function joinSession(req,res) {
    try {
        const {id} = req.params;
        const userId = req.user._id;
        const clerkId = req.user.clerkId;
        const inviteToken = getInviteToken(req)

        const session = await Session.findById(id);
        if(!session)return res.status(404).json({message: "Session not found"});

        if(session.status !== "active"){
            return res.status(400).json({message: "Cannot join a completed session"});
        }
        if(session.host.toString()=== userId.toString()){
            return res.status(400).json({message: "Host cannot join their own session as participant"});
        }
        if(session.participant?.toString() === userId.toString()){
            return res.status(200).json({session});
        }
        if(!inviteToken || inviteToken !== session.inviteToken){
            return res.status(403).json({message: "A valid invite link is required to join this private session"});
        }
         
        //check if session is already full - has participant
if(session.participant)return res.status(409).json({message: "Session is full"})

    session.participant = userId
    await session.save()

    const channel = chatClient.channel("messaging", session.callId)
    await channel.addMembers([clerkId])

    res.status(200).json({session})

    } catch (error) { 
      console.log("Error in joinSession controller:", error.message);
        res.status(500).json({message: "Internal Server Error"});

    }
}

export async function joinSessionByInvite(req,res) {
    try {
        const {invite} = req.body;
        const userId = req.user._id;
        const clerkId = req.user.clerkId;
        const {sessionId, inviteToken, inviteCode} = parseInviteInput(invite);

        if(!sessionId && !inviteToken && !inviteCode){
            return res.status(400).json({message: "Invite link or code is required"});
        }

        const query = sessionId
            ? {_id: sessionId}
            : inviteToken
              ? {inviteToken}
              : {inviteCode};

        const session = await Session.findOne(query);
        if(!session)return res.status(404).json({message: "Invite not found"});

        await ensureInviteToken(session);

        const hasValidInvite =
            inviteToken === session.inviteToken ||
            inviteCode?.toUpperCase() === session.inviteCode ||
            (sessionId && inviteToken === session.inviteToken);

        if(!hasValidInvite){
            return res.status(403).json({message: "Invalid invite link or code"});
        }

        if(session.status !== "active"){
            return res.status(400).json({message: "Cannot join a completed session"});
        }

        if(session.host.toString() === userId.toString() || session.participant?.toString() === userId.toString()){
            return res.status(200).json({session});
        }

        if(session.participant){
            return res.status(409).json({message: "Session is full"});
        }

        session.participant = userId;
        await session.save();

        const channel = chatClient.channel("messaging", session.callId);
        await channel.addMembers([clerkId]);

        const updatedSession = await Session.findById(session._id)
            .populate("host","name email profileImage clerkId")
            .populate("participant","name email profileImage clerkId");

        res.status(200).json({session: serializeSessionForUser(updatedSession, userId)});
    } catch (error) {
        console.log("Error in joinSessionByInvite controller:", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
}

export async function updateSessionEvaluation(req,res) {
    try {
        const {id} = req.params;
        const userId = req.user._id;
        const {notes = "", score = null, decision = "pending"} = req.body;

        const session = await Session.findById(id);
        if(!session) return res.status(404).json({message: "Session not found"});

        if(session.host.toString() !== userId.toString()){
            return res.status(403).json({message: "Only the interviewer can update evaluation"});
        }

        const numericScore = score === "" || score === null ? null : Number(score);

        if(numericScore !== null && (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 10)){
            return res.status(400).json({message: "Score must be between 0 and 10"});
        }

        if(!DECISIONS.includes(decision)){
            return res.status(400).json({message: "Invalid decision"});
        }

        session.evaluation = {
            notes: notes.toString().slice(0, 3000),
            score: numericScore,
            decision,
        };

        await session.save();

        const updatedSession = await Session.findById(id)
            .populate("host","name email profileImage clerkId")
            .populate("participant","name email profileImage clerkId");

        res.status(200).json({session: serializeSessionForUser(updatedSession, userId), message: "Evaluation updated successfully"});
    } catch (error) {
        console.log("Error in updateSessionEvaluation controller:", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
}

export async function endSession(req,res) {
    try {
        const {id} = req.params;
        const userId = req.user._id;

        const session = await Session.findById(id);

        if(!session) return res.status(400).json({message: "Session not found"});

        //check if user is the host
        if(session.host.toString() !== userId.toString()){
            return res.status(403).json({message: "Only the host can end the session"});
        }
     //check if session is already completred
     if(session.status === "completed"){
        return res.status(403).json({message: "Session is already completed"});
     }
       
     //delete stream video call
     const call = streamClient.video.call("default", session.callId);
     await call.delete({ hard: true});

     //delete stream chatr channel
     const channel = chatClient.channel("messaging", session.callId);
     await channel.delete();

     session.status = "completed"
     await session.save();


     res.status(200).json({ session, message: "Session ended successfully"});
    } catch (error) {
     console.log("Error in endSession controller:", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
}

    
