import type { UserRole } from "../enums/index.js"

export interface AuthTokenPayload {
  id: string
  role: UserRole
  branchId: string | null
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AuthTokenPayload
    user: AuthTokenPayload
  }
}
