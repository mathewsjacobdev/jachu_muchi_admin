import { api } from "../client";
import type { Branch, BranchStatus } from "@/lib/branch-store";

/**
 * Set `BRANCHES_LIST_PATH` / `branchDetailPath` when your backend routes differ.
 * Placeholder: `GET /users` and map to `Branch`.
 */
export const BRANCHES_LIST_PATH = "/users";
export const branchDetailPath = (id: string) => `/users/${id}`;

type JsonPlaceholderUser = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: { street?: string; city?: string };
};

const isBranchRow = (x: unknown): x is Branch =>
  typeof x === "object" &&
  x !== null &&
  "phones" in x &&
  Array.isArray((x as Branch).phones) &&
  typeof (x as Branch).id === "string";

const isJpUser = (x: unknown): x is JsonPlaceholderUser =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as JsonPlaceholderUser).id === "number" &&
  typeof (x as JsonPlaceholderUser).name === "string" &&
  "email" in x;

const websiteToMapUrl = (w: string | undefined): string => {
  if (!w?.trim()) return "https://maps.google.com";
  return w.startsWith("http") ? w : `https://${w}`;
};

const mapJpUserToBranch = (u: JsonPlaceholderUser): Branch => {
  const phone = u.phone?.trim() ?? "";
  const city = u.address?.city ?? "";
  const street = u.address?.street ?? "";
  const location = [city, street].filter(Boolean).join(", ") || "—";
  return {
    id: String(u.id),
    name: u.name,
    phones: phone ? phone.split(/\s*,\s*|\s*;\s*/).filter(Boolean) : [],
    email: typeof u.email === "string" ? u.email : "",
    location,
    mapUrl: websiteToMapUrl(u.website),
    status: u.id % 2 === 0 ? "Active" : "Inactive",
  };
};

const rowToBranch = (raw: Record<string, unknown>): Branch => {
  const id = raw.id != null ? String(raw.id) : "";
  const phones =
    Array.isArray(raw.phones) && raw.phones.every((p) => typeof p === "string")
      ? (raw.phones as string[])
      : typeof raw.phone === "string" && raw.phone.trim()
        ? raw.phone.split(/\s*,\s*|\s*;\s*/).filter(Boolean)
        : [];
  const status =
    raw.status === "Active" || raw.status === "Inactive" ? raw.status : "Active";
  return {
    id,
    name: String(raw.name ?? ""),
    phones,
    email: String(raw.email ?? ""),
    location: String(raw.location ?? ""),
    mapUrl: String(raw.mapUrl ?? ""),
    status,
  };
};

export const getBranches = async (): Promise<Branch[]> => {
  const res = await api.get<unknown>(BRANCHES_LIST_PATH);
  const data = res.data;
  if (!Array.isArray(data) || data.length === 0) return [];
  if (isBranchRow(data[0])) return data as Branch[];
  if (isJpUser(data[0])) {
    return (data as JsonPlaceholderUser[]).slice(0, 12).map(mapJpUserToBranch);
  }
  return data.map((item) => rowToBranch(item as Record<string, unknown>));
};

export const getBranchById = async (id: string): Promise<Branch | null> => {
  try {
    const res = await api.get<unknown>(branchDetailPath(id));
    const row = res.data;
    if (row && typeof row === "object") {
      if (isBranchRow(row)) return row;
      if (isJpUser(row)) return mapJpUserToBranch(row);
      if (!Array.isArray(row)) return rowToBranch(row as Record<string, unknown>);
    }
    return null;
  } catch {
    return null;
  }
};

const branchToJpBody = (payload: Omit<Branch, "id">) => ({
  name: payload.name,
  email: payload.email,
  phone: payload.phones.length > 0 ? payload.phones.join(", ") : "—",
  username: payload.location.slice(0, 20) || "branch",
  website: payload.mapUrl.replace(/^https?:\/\//, "") || "maps.google.com",
});

export const createBranch = async (payload: Omit<Branch, "id">): Promise<Branch> => {
  const res = await api.post<Record<string, unknown>>(BRANCHES_LIST_PATH, branchToJpBody(payload));
  const id = res.data.id != null ? String(res.data.id) : Date.now().toString();
  return { id, ...payload };
};

export const updateBranchApi = async (id: string, payload: Omit<Branch, "id">): Promise<void> => {
  await api.put(branchDetailPath(id), { id: Number(id) || id, ...branchToJpBody(payload) });
};

export const deleteBranchApi = async (id: string): Promise<void> => {
  await api.delete(branchDetailPath(id));
};
