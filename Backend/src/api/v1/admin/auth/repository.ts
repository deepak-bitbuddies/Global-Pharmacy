import { AuthUserModel, type AuthUserDocument } from "./model.js"

export async function findAuthUserByEmail(email: string): Promise<AuthUserDocument | null> {
  return AuthUserModel.findOne({ email: email.toLowerCase() }).select("+passwordHash").lean()
}

export async function createAuthUser(input: {
  name: string
  email: string
  passwordHash: string
  role: string
}): Promise<AuthUserDocument> {
  return AuthUserModel.create(input)
}
