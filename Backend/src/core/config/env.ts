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

  DATABASE_URL: z.url("DATABASE_URL must be a valid PostgreSQL connection URL"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  // Symmetric key a super_admin's "reveal branch password" screen decrypts with — separate from
  // JWT_SECRET so rotating one never invalidates the other. See `shared/helpers/password-crypto.ts`.
  PASSWORD_ENCRYPTION_KEY: z.string().min(16, "PASSWORD_ENCRYPTION_KEY must be at least 16 characters"),

  // File storage — local disk doesn't survive this app's deploy target (a read-only filesystem at
  // runtime), so every uploaded/generated file (expense proofs, report exports) goes to Cloudinary
  // instead. See `core/storage/cloudinary-storage.ts`.
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),

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
