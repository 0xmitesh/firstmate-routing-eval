import type { User } from "../types";

export type Action =
  | "catalog:read"
  | "catalog:write"
  | "inventory:reserve"
  | "admin:manage";

export function can(user: User, action: Action): boolean {
  if (user.role === "admin") {
    return true;
  }

  if (user.role === "editor") {
    return action !== "admin:manage";
  }

  return action === "catalog:read";
}
