import { api } from "../client";

export const ENQUIRIES_LIST_PATH = "/enquiries";
export const ENQUIRIES_FILTER_PATH = "/enquiries/filter";
export const enquiryDetailPath = (id: string) => `/enquiries/${id}`;
export const enquiryStatusPath = (id: string) => `/enquiries/${id}/status`;
export const enquiryNotesPath = (id: string) => `/enquiries/${id}/notes`;

export type EnquiryStatus = "New" | "Contacted" | "Interested" | "Converted" | "Closed";

export type EnquiryType = "Course Enquiry" | "Normal Enquiry";

/** Matches backend `sortBy` (default `"date"`). */
export type EnquiryFilterSortBy = "date" | "name";

export type EnquiryFilterOrder = "asc" | "desc";

export type EnquiriesFilterParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: EnquiryStatus | "All";
  type?: EnquiryType | "All";
  sortBy?: EnquiryFilterSortBy;
  order?: EnquiryFilterOrder;
};

export type EnquiriesFilterResult = {
  data: Enquiry[];
  total: number;
  page: number;
  limit: number;
};

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: EnquiryType;
  message: string;
  date: string;
  status: EnquiryStatus;
  notes?: string;
}

const isEnquiryRow = (x: unknown): x is Enquiry =>
  typeof x === "object" &&
  x !== null &&
  "id" in x &&
  "name" in x &&
  "status" in x &&
  typeof (x as Enquiry).name === "string";

type BackendEnquiryRow = {
  _id: string;
  name?: string;
  phone?: string;
  type?: string;
  status?: string;
  email?: string;
  message?: string;
  date?: string;
  notes?: string;
};

const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null;

const isBackendEnquiryRow = (x: unknown): x is BackendEnquiryRow =>
  isRecord(x) && typeof x._id === "string";

const isEnquiryStatus = (x: unknown): x is EnquiryStatus =>
  x === "New" ||
  x === "Contacted" ||
  x === "Interested" ||
  x === "Converted" ||
  x === "Closed";

const normalizeType = (raw: unknown): EnquiryType =>
  String(raw ?? "").trim() === "Normal Enquiry" ? "Normal Enquiry" : "Course Enquiry";

const mapBackendRowToEnquiry = (row: BackendEnquiryRow): Enquiry => ({
  id: row._id,
  name: String(row.name ?? ""),
  phone: String(row.phone ?? ""),
  email: String(row.email ?? ""),
  type: normalizeType(row.type),
  message: String(row.message ?? ""),
  date: String(row.date ?? ""),
  status: isEnquiryStatus(row.status) ? row.status : "New",
  notes: typeof row.notes === "string" ? row.notes : undefined,
});

const mapFilterList = (list: unknown[]): Enquiry[] => {
  if (list.length === 0) return [];
  if (isEnquiryRow(list[0])) return list as Enquiry[];
  if (isBackendEnquiryRow(list[0])) return (list as BackendEnquiryRow[]).map(mapBackendRowToEnquiry);
  return list
    .filter((x): x is Record<string, unknown> => isRecord(x))
    .map((x) => mapBackendRowToEnquiry(x as unknown as BackendEnquiryRow));
};

const buildEnquiriesFilterQuery = (params: EnquiriesFilterParams): string => {
  const q = new URLSearchParams();
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  q.set("page", String(page));
  q.set("limit", String(limit));
  const search = params.search?.trim();
  if (search) q.set("search", search);
  if (params.status && params.status !== "All") q.set("status", params.status);
  if (params.type && params.type !== "All") q.set("type", params.type);
  q.set("sortBy", params.sortBy?.trim() || "date");
  if (params.order) q.set("order", params.order);
  return `${ENQUIRIES_FILTER_PATH}?${q.toString()}`;
};

export const getEnquiriesFilter = async (
  params: EnquiriesFilterParams,
  signal?: AbortSignal,
): Promise<EnquiriesFilterResult> => {
  const path = buildEnquiriesFilterQuery(params);
  const res = await api.get<unknown>(path, signal ? { signal } : undefined);
  const root = res.data;
  if (!isRecord(root)) {
    return { data: [], total: 0, page: params.page ?? 1, limit: params.limit ?? 10 };
  }
  const rawList = Array.isArray(root.data) ? root.data : [];
  const total = typeof root.total === "number" && Number.isFinite(root.total) ? root.total : 0;
  const page = typeof root.page === "number" && Number.isFinite(root.page) ? root.page : params.page ?? 1;
  const limit =
    typeof root.limit === "number" && Number.isFinite(root.limit) ? root.limit : params.limit ?? 10;
  return {
    data: mapFilterList(rawList),
    total,
    page,
    limit,
  };
};

export const getEnquiries = async (): Promise<Enquiry[]> => {
  const res = await api.get<unknown>(ENQUIRIES_LIST_PATH);
  const root = res.data;
  const list = isRecord(root) && Array.isArray(root.data) ? root.data : root;
  if (!Array.isArray(list) || list.length === 0) return [];
  return mapFilterList(list);
};

export const getEnquiryById = async (
  id: string,
  signal?: AbortSignal,
): Promise<Enquiry | null> => {
  const res = await api.get<unknown>(
    enquiryDetailPath(id),
    signal ? { signal } : undefined,
  );
  const root = res.data;
  const row = isRecord(root) && isRecord(root.data) ? (root.data as Record<string, unknown>) : root;
  if (isEnquiryRow(row)) return row as Enquiry;
  if (isBackendEnquiryRow(row)) return mapBackendRowToEnquiry(row);
  if (isRecord(row) && isBackendEnquiryRow(row)) return mapBackendRowToEnquiry(row);
  return null;
};

export const deleteEnquiry = async (id: string): Promise<void> => {
  await api.delete(enquiryDetailPath(id));
};

export const updateEnquiryStatus = async (id: string, status: EnquiryStatus): Promise<void> => {
  await api.patch(enquiryStatusPath(id), { status });
};

export const updateEnquiryNotes = async (id: string, notes: string): Promise<void> => {
  await api.patch(enquiryNotesPath(id), { notes });
};
