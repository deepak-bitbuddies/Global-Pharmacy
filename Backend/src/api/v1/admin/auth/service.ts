import { compare } from "bcryptjs"

import { findAuthUserByEmail } from "./repository.js"
import type { LoginRequestDto, LoginResponseDto } from "./dto.js"
import { AccountDisabledError, InvalidCredentialsError } from "./errors.js"

export async function authenticate(input: LoginRequestDto): Promise<LoginResponseDto> {
  const user = await findAuthUserByEmail(input.email)
  if (!user || !(await compare(input.password, user.passwordHash))) {
    throw new InvalidCredentialsError()
  }
  if (!user.isActive) {
    throw new AccountDisabledError()
  }

  return {
    token: "",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  }
}
