export type UserRole = "reporter" | "organizer";

export type SessionUser = {
  name: string;
  role: UserRole;
};

const roleLabels: Record<UserRole, string> = {
  reporter: "回報與行動者",
  organizer: "資訊整理者",
};

export function labelForUserRole(role: UserRole) {
  return roleLabels[role];
}

export function getUserRoleEntries() {
  return Object.entries(roleLabels) as Array<[UserRole, string]>;
}
