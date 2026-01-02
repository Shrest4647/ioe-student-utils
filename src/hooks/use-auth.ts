"use client"

import { useSession } from "@/lib/auth-client"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export const useAuth = () => {
  const session = useSession()
  const user = useQuery(api.auth.getCurrentUser)

  return {
    user: user || null,
    isLoading: session.isPending || user === undefined,
    isAuthenticated: !!user,
    session,
  }
}
