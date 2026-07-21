import type { z } from "zod"

import type { loginSchema } from "./schema.js"

export type LoginRequestDto = z.infer<typeof loginSchema>

export interface AuthUserDto {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  branchId: string | null
  createdAt: Date
}

export interface LoginResponseDto {
  token: string
  user: AuthUserDto
}
