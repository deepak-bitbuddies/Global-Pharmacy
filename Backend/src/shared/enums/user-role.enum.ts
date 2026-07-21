export const SystemRoleCode = {
  SUPER_ADMIN: "super_admin",
  CUSTOMER: "customer",
  DELIVERY_BOY: "delivery_boy",
  BRANCH_USER: "branch_user",
} as const
export type SystemRoleCode = (typeof SystemRoleCode)[keyof typeof SystemRoleCode]

export type UserRole = string
