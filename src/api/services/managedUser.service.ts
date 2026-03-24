import { api } from "../client";

export type ManagedUserRole = "Admin" | "Sub Admin" | "Editor";
export type ManagedUserStatus = "Active" | "Inactive";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: ManagedUserRole;
  status: ManagedUserStatus;
}

const USERS_PATH = "/users";
export const managedUserDetailPath = (id: string) => `/users/${id}`;

type JsonPlaceholderUser = {
  id: number;
  name: string;
  email: string;
};

const isJpUser = (x: unknown): x is JsonPlaceholderUser =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as JsonPlaceholderUser).id === "number" &&
  typeof (x as JsonPlaceholderUser).name === "string";

const isManagedRow = (x: unknown): x is ManagedUser => {
  if (typeof x !== "object" || x === null) return false;
  const m = x as ManagedUser;
  return (
    typeof m.id === "string" &&
    (m.role === "Admin" || m.role === "Sub Admin" || m.role === "Editor")
  );
};

const roleFromIndex = (id: number): ManagedUserRole => {
  const r = id % 3;
  if (r === 0) return "Admin";
  if (r === 1) return "Sub Admin";
  return "Editor";
};

const statusFromIndex = (id: number): ManagedUserStatus => (id % 4 === 0 ? "Inactive" : "Active");

const mapJpToManaged = (u: JsonPlaceholderUser): ManagedUser => ({
  id: String(u.id),
  name: u.name,
  email: typeof u.email === "string" ? u.email : "",
  role: roleFromIndex(u.id),
  status: statusFromIndex(u.id),
});

const rowToManaged = (raw: Record<string, unknown>): ManagedUser => ({
  id: String(raw.id),
  name: String(raw.name ?? ""),
  email: String(raw.email ?? ""),
  role:
    raw.role === "Admin" || raw.role === "Sub Admin" || raw.role === "Editor"
      ? raw.role
      : "Editor",
  status: raw.status === "Inactive" ? "Inactive" : "Active",
});

export const getManagedUsers = async (): Promise<ManagedUser[]> => {
  const res = await api.get<unknown>(USERS_PATH);
  const data = res.data;
  if (!Array.isArray(data) || data.length === 0) return [];
  if (isManagedRow(data[0])) return data as ManagedUser[];
  if (isJpUser(data[0])) {
    return (data as JsonPlaceholderUser[]).slice(0, 12).map(mapJpToManaged);
  }
  return data.map((item) => rowToManaged(item as Record<string, unknown>));
};

export const createManagedUser = async (
  payload: Omit<ManagedUser, "id">,
): Promise<ManagedUser> => {
  const res = await api.post<Record<string, unknown>>(USERS_PATH, {
    name: payload.name,
    email: payload.email,
    username: payload.role.replace(/\s+/g, "-").toLowerCase(),
    role: payload.role,
    status: payload.status,
  });
  const id = res.data.id != null ? String(res.data.id) : Date.now().toString();
  return { id, ...payload };
};

export const updateManagedUserApi = async (
  id: string,
  payload: Omit<ManagedUser, "id">,
): Promise<void> => {
  await api.put(managedUserDetailPath(id), {
    id: Number(id) || id,
    name: payload.name,
    email: payload.email,
    username: payload.role.replace(/\s+/g, "-").toLowerCase(),
    role: payload.role,
    status: payload.status,
  });
};

export const deleteManagedUserApi = async (id: string): Promise<void> => {
  await api.delete(managedUserDetailPath(id));
};
