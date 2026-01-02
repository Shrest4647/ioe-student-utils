import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession, getSession } = authClient;

export type Session = typeof authClient.$Infer.Session;
