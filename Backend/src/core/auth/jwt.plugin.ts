import jwt from "@fastify/jwt"
import type { FastifyInstance } from "fastify"

import { env } from "../config/env.js"

export async function registerJwtPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  })
}
