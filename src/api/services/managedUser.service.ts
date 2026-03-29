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

const USERS_LIST_PATH = "/users/all";
const USERS_PATH = "/users";
export const USERS_FILTER_PATH = "/users/filter";
export const managedUserDetailPath = (id: string) => `/users/${id}`;

type BackendUserRow = {
  _id: string;
  name: string;
  email: string;
  role?: string;
  status?: string;
};

const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null;

const isBackendUserRow = (x: unknown): x is BackendUserRow =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as BackendUserRow)._id === "string" &&
  typeof (x as BackendUserRow).email === "string";

const isManagedRow = (x: unknown): x is ManagedUser => {
  if (typeof x !== "object" || x === null) return false;
  const m = x as ManagedUser;
  return (
    typeof m.id === "string" &&
    (m.role === "Admin" || m.role === "Sub Admin" || m.role === "Editor")
  );
};

const normalizeRole = (raw: unknown): ManagedUserRole => {
  const role = String(raw ?? "").trim().toLowerCase();
  if (role === "admin") return "Admin";
  if (role === "sub admin" || role === "sub-admin" || role === "subadmin") return "Sub Admin";
  if (role === "editor") return "Editor";
  return "Editor";
};

const normalizeStatus = (raw: unknown): ManagedUserStatus =>
  String(raw ?? "").trim().toLowerCase() === "inactive" ? "Inactive" : "Active";

const toBackendRole = (role: ManagedUserRole): string => role;

const mapBackendToManaged = (u: BackendUserRow): ManagedUser => ({
  id: u._id,
  name: typeof u.name === "string" ? u.name : "",
  email: typeof u.email === "string" ? u.email : "",
  role: normalizeRole(u.role),
  status: normalizeStatus(u.status),
});

const rowToManaged = (raw: Record<string, unknown>): ManagedUser => ({
  id: String(raw.id ?? raw._id ?? ""),
  name: String(raw.name ?? ""),
  email: String(raw.email ?? ""),
  role: normalizeRole(raw.role),
  status: normalizeStatus(raw.status),
});

export const getManagedUsers = async (): Promise<ManagedUser[]> => {
  const res = await api.get<unknown>(USERS_LIST_PATH);
  const data = res.data;
  const list = isRecord(data) && Array.isArray(data.data) ? data.data : data;
  if (!Array.isArray(list) || list.length === 0) return [];
  if (isManagedRow(list[0])) return list as ManagedUser[];
  if (isBackendUserRow(list[0])) {
    return (list as BackendUserRow[]).map(mapBackendToManaged);
  }
  return list
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => rowToManaged(item));
};

export type ManagedUserFilterSortBy = "createdAt" | "name" | "email";
export type ManagedUserFilterOrder = "asc" | "desc";

export type ManagedUserFilterParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  date?: string;
  sortBy?: ManagedUserFilterSortBy | string;
  order?: ManagedUserFilterOrder;
};

export type ManagedUserFilterResult = {
  data: ManagedUser[];
  total: number;
  page: number;
  limit: number;
};

export const filterManagedUsers = async (
  params: ManagedUserFilterParams,
  signal?: AbortSignal
): Promise<ManagedUserFilterResult> => {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search?.trim()) q.set("search", params.search.trim());
  if (params.status && params.status !== "All") q.set("status", params.status);
  if (params.type && params.type !== "All") q.set("type", params.type);
  if (params.date) q.set("date", params.date);
  if (params.sortBy) if (params.date) q.set("date", params.date);
  q.set("sortBy", params.sortBy);
  if (params.order) q.set("order", params.order);

  const res = await api.get<{
    success: boolean;
    data: unknown;
    pagination?: { total: number; page: number; pages: number };
  }>(`${USERS_FILTER_PATH}?${q.toString()}`, signal ? { signal } : undefined);

  let parsed: ManagedUser[] = [];
  const list = res.data?.data;
  if (Array.isArray(list)) {
    parsed = list
      .filter((item): item is Record<string, unknown> => isRecord(item))
      .map((item) => rowToManaged(item));
  }

  return {
    data: parsed,
    total: res.data?.pagination?.total ?? 0,
    page: res.data?.pagination?.page ?? params.page ?? 1,
    limit: params.limit ?? 10,
  };
};

export const createManagedUser = async (
  payload: Omit<ManagedUser, "id"> & { password: string },
): Promise<ManagedUser> => {
  const res = await api.post<Record<string, unknown>>(USERS_PATH, {
    name: payload.name,
    email: payload.email,
    role: toBackendRole(payload.role),
    status: payload.status,
    password: payload.password,
  });
  const row = isRecord(res.data) && isRecord(res.data.data) ? res.data.data : res.data;
  const id =
    isRecord(row) && row._id != null
      ? String(row._id)
      : isRecord(row) && row.id != null
        ? String(row.id)
        : Date.now().toString();
  return { id, ...payload };
};

export const updateManagedUserApi = async (
  id: string,
  payload: Omit<ManagedUser, "id"> & { password?: string },
): Promise<void> => {
  await api.put(managedUserDetailPath(id), {
    name: payload.name,
    email: payload.email,
    role: toBackendRole(payload.role),
    status: payload.status,
    ...(payload.password?.trim() ? { password: payload.password } : {}),
  });
};

export const deleteManagedUserApi = async (id: string): Promise<void> => {
  await api.delete(managedUserDetailPath(id));
};
