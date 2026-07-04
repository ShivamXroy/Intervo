import { clerkClient } from "@clerk/express";
import User from "../models/User.js";
import { upsertStreamUser } from "./stream.js";

function buildName(firstName, lastName, fallbackEmail) {
  const fullName = `${firstName || ""} ${lastName || ""}`.trim();
  return fullName || fallbackEmail || "Intervo User";
}

export async function ensureUserFromClerkPayload(clerkUser) {
  const primaryEmail =
    clerkUser.email_addresses?.[0]?.email_address ||
    clerkUser.emailAddresses?.[0]?.emailAddress;
  const email = primaryEmail || `${clerkUser.id}@clerk.local`;

  const userData = {
    clerkId: clerkUser.id,
    email,
    name: buildName(
      clerkUser.first_name || clerkUser.firstName,
      clerkUser.last_name || clerkUser.lastName,
      primaryEmail
    ),
    profileImage: clerkUser.image_url || clerkUser.imageUrl || "",
  };

  const user = await User.findOneAndUpdate(
    { clerkId: userData.clerkId },
    { $setOnInsert: userData },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await upsertStreamUser({
    id: user.clerkId.toString(),
    name: user.name,
    image: user.profileImage,
  });

  return user;
}

export async function ensureUserFromClerkId(clerkId) {
  const existingUser = await User.findOne({ clerkId });
  if (existingUser) return existingUser;

  const clerkUser = await clerkClient.users.getUser(clerkId);
  return ensureUserFromClerkPayload(clerkUser);
}
