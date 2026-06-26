import express from "express";
import path from "path";
import cors from "cors";
import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express"
import { inngest,functions } from "./lib/inngest.js";
import { protectRoute } from "./middleware/protectRoute.js";
import chatRoutes from "./routes/chatRoutes.js"
import sessionRoutes from "./routes/sessionRoute.js";  
const app = express()

const __dirname = path.resolve()

//middleware
app.use(express.json())
//credentials:true meaning?? => server allows a browser to include cokkies on request
app.use(cors({origin:ENV.CLIENT_URL,credentials:true}))
app.use(clerkMiddleware()); //this adds auth field to request object: req.auth()

app.use("/api/inngest",serve({client: inngest, functions}));
app.use("/api/chat", chatRoutes);
app.use("/api/sessions", sessionRoutes);

app.get("/health",(req,res) => {
    req.auth
    res.status(200).json({msg:"api is up and running"});
}); 
app.get("/books",(req,res) => {
    res.status(200).json({msg:"this  is the books endpoint"});
});
//when u pass an array of middleware to express,it automatically flattens and executes 
//them sequentially,one by one
app.get("/video-calls", protectRoute,(req,res) => {
    res.status(200).json({msg:"this  is a protected route"});
});

if(ENV.NODE_ENV === "production"){
     app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("/{*any}",(req,res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
});
}


    const startServer = async () => {
        try{
            await connectDB();
        app.listen(ENV.PORT, () =>console.log("Server is running on port:", ENV.PORT)); 
        }catch(error){
         console.error("💥Error starting the server",error)
        }
    };
    startServer(); 