import { api } from "../client";
import type { Alumni } from "@/lib/alumni-store";

export const ALUMNI_LIST_PATH = "/alumni/all";
export const ALUMNI_FILTER_PATH = "/alumni/filter";
const ALUMNI_BASE_PATH = "/alumni";
export const alumniDetailPath = (id: string) => `${ALUMNI_BASE_PATH}/${id}`;

type AlumniApiRow = {
  _id: string;
  name: string;
  role?: string;
  company?: string;
  profileImageUrl?: string;
};

const isAlumniRow = (x: unknown): x is Alumni =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as Alumni).id === "string" &&
  "company" in x &&
  typeof (x as Alumni).company === "string" &&
  !("phones" in x);

const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null;

const isApiAlumniRow = (x: unknown): x is AlumniApiRow =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as AlumniApiRow)._id === "string" &&
  typeof (x as AlumniApiRow).name === "string";

const mapApiRowToAlumni = (row: AlumniApiRow): Alumni => ({
  id: row._id,
  name: row.name,
  role: row.role ?? "",
  company: row.company ?? "",
  image: row.profileImageUrl ?? "",
});

const rowToAlumni = (raw: Record<string, unknown>): Alumni => ({
  id: String(raw.id ?? raw._id ?? ""),
  name: String(raw.name ?? ""),
  role: String(raw.role ?? ""),
  company: String(raw.company ?? ""),
  image:
    typeof raw.image === "string"
      ? raw.image
      : typeof raw.profileImageUrl === "string"
        ? raw.profileImageUrl
        : "",
});

export const getAlumniList = async (): Promise<Alumni[]> => {
  const res = await api.get<unknown>(ALUMNI_LIST_PATH);
  const data = res.data;
  const list = isRecord(data) && Array.isArray(data.data) ? data.data : data;
  if (!Array.isArray(list) || list.length === 0) return [];
  if (isAlumniRow(list[0])) return list as Alumni[];
  if (isApiAlumniRow(list[0])) {
    return (list as AlumniApiRow[]).map(mapApiRowToAlumni);
  }
  return list
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => rowToAlumni(item));
};

export type AlumniFilterSortBy = "createdAt" | "name" | "company";
export type AlumniFilterOrder = "asc" | "desc";

export type AlumniFilterParams = {
  page?: number;
  limit?: number;
  search?: string;
  date?: string;
  sortBy?: AlumniFilterSortBy | string;
  order?: AlumniFilterOrder;
};

export type AlumniFilterResult = {
  data: Alumni[];
  total: number;
  page: number;
  limit: number;
};

export const filterAlumni = async (
  params: AlumniFilterParams,
  signal?: AbortSignal
): Promise<AlumniFilterResult> => {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search?.trim()) q.set("search", params.search.trim());
  if (params.date) q.set("date", params.date);
  if (params.sortBy) if (params.date) q.set("date", params.date);
  q.set("sortBy", params.sortBy);
  if (params.order) q.set("order", params.order);

  const res = await api.get<{
    success: boolean;
    data: AlumniApiRow[];
    pagination?: { total: number; page: number; pages: number };
  }>(`${ALUMNI_FILTER_PATH}?${q.toString()}`, signal ? { signal } : undefined);

  return {
    data: Array.isArray(res.data.data) ? res.data.data.map(mapApiRowToAlumni) : [],
    total: res.data.pagination?.total ?? 0,
    page: res.data.pagination?.page ?? params.page ?? 1,
    limit: params.limit ?? 10,
  };
};

export const getAlumniById = async (id: string): Promise<Alumni | null> => {
  try {
    const res = await api.get<unknown>(alumniDetailPath(id));
    const row = isRecord(res.data) && isRecord(res.data.data) ? res.data.data : res.data;
    if (row && typeof row === "object") {
      if (isAlumniRow(row)) return row;
      if (isApiAlumniRow(row)) return mapApiRowToAlumni(row);
      return rowToAlumni(row as Record<string, unknown>);
    }
    return null;
  } catch {
    return null;
  }
};

export const createAlumni = async (payload: Omit<Alumni, "id">): Promise<Alumni> => {
  const res = await api.post<Record<string, unknown>>(ALUMNI_BASE_PATH, {
    name: payload.name,
    role: payload.role,
    company: payload.company,
    ...(payload.image ? { profileImageUrl: payload.image } : {}),
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

export const updateAlumniApi = async (id: string, payload: Omit<Alumni, "id">): Promise<void> => {
  await api.put(alumniDetailPath(id), {
    name: payload.name,
    role: payload.role,
    company: payload.company,
    ...(payload.image ? { profileImageUrl: payload.image } : {}),
  });
};

export const deleteAlumniApi = async (id: string): Promise<void> => {
  await api.delete(alumniDetailPath(id));
};
