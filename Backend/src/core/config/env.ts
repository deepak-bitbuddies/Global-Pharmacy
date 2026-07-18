import { existsSync } from "node:fs"
import { z } from "zod"

// Local dev convenience only — inside Docker, docker-compose injects env vars
// directly and no .env file is present in the container.
if (process.env.NODE_ENV !== "production" && existsSync(".env")) {
  try {
    process.loadEnvFile(".env")
  } catch {
    // Older Node runtime without loadEnvFile support: env vars must already
    // be exported in the shell.
  }
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default("0.0.0.0"),

  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  CORS_ORIGIN: z.string().default("*"),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error("Invalid environment configuration:")
  console.error(z.flattenError(parsed.error).fieldErrors)
  process.exit(1)
}

export const env = parsed.data
export type Env = typeof env
