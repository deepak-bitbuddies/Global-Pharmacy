export const SystemRoleCode = {
  SUPER_ADMIN: "super_admin",
  CUSTOMER: "customer",
  DELIVERY_BOY: "delivery_boy",
} as const
export type SystemRoleCode = (typeof SystemRoleCode)[keyof typeof SystemRoleCode]

export type UserRole = string
