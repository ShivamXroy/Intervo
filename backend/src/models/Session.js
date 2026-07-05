import mongoose from "mongoose"

const sessionSchema = new mongoose.Schema({
    problem:{
        type:String,
        required:true,
    },
    problems: {
        type: [String],
        default: [],
    },
    difficulty:{
       type: String,
       enum: ["easy","medium","hard"],
        required:true, 
    },
    host:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: true
    },   
    participant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default:null
    },
    status:{
        type: String,
        enum: ["active","completed"],
        default:"active"
    },
    callId: {
        type:String,
        default: "",
    },
    inviteToken: {
        type: String,
        default: () => Math.random().toString(36).slice(2) + Date.now().toString(36),
        unique: true,
        sparse: true,
    },
    inviteCode: {
        type: String,
        default: () => Math.random().toString(36).slice(2, 8).toUpperCase(),
        unique: true,
        sparse: true,
    },
    hostRole: {
        type: String,
        enum: ["interviewer"],
        default: "interviewer",
    },
    participantRole: {
        type: String,
        enum: ["candidate"],
        default: "candidate",
    },
    evaluation: {
        notes: {
            type: String,
            default: "",
        },
        score: {
            type: Number,
            min: 0,
            max: 10,
            default: null,
        },
        decision: {
            type: String,
            enum: ["pending", "strong-no", "no", "hold", "yes", "strong-yes"],
            default: "pending",
        },
    },
  },
  { timestamps: true }
);

const Session = mongoose.model("Session",sessionSchema);

export default Session;
