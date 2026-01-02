"use client";

import { useSession } from "@/lib/auth-client";

export const useAuth = () => {
	const session = useSession();
	const user = session.data?.user;

	return {
		user: user || null,
		isLoading: session.isPending || user === undefined,
		isAuthenticated: !!user,
		session,
	};
};
