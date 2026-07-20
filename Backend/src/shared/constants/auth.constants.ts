export const BCRYPT_SALT_ROUNDS = 10

/** Shared default password for system-created accounts (admin seed, branch-user registration) until a change-password flow exists. */
export const DEFAULT_USER_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!"
