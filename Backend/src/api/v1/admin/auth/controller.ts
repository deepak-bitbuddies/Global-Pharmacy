import type { FastifyReply, FastifyRequest } from "fastify"

import { validateSchema } from "../../../../shared/validators/validate-schema.js"
import { sendSuccess } from "../../../../shared/helpers/http-response.js"
import { loginSchema } from "./schema.js"
import { authenticate } from "./service.js"

export async function loginHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const credentials = validateSchema(loginSchema, request.body)
  const data = await authenticate(credentials)
  data.token = await reply.jwtSign({ id: data.user.id, role: data.user.role })
  sendSuccess(reply, data, "Login successful")
}
