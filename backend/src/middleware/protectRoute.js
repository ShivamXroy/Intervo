import { requireAuth } from '@clerk/express';
import { ensureUserFromClerkId } from '../lib/userSync.js';

 export const protectRoute = [
    requireAuth(),
    async(req,res,next) => {
        try{
            const clerkId = req.auth().userId;
            if(!clerkId) return res.status(401).json({msg: "Unauthorized- invalid token"});
                //find or create user in db by Clerk ID
            const user = await ensureUserFromClerkId(clerkId);

            if(!user)return res.status(404).json({message: "User not found"});
            
            req.user=user;
            
            next();
        
        } catch (error){
           console.error("Error in protectRoute middleware",error)
           res.status(500).json({message: "Internal Server Error"});
        }
    },
    
];
