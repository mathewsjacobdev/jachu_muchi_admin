import { api } from "../client";

export const COURSES_LIST_PATH = "/courses/all";
const COURSES_BASE_PATH = "/courses";
const courseDetailPath = (id: string) => `${COURSES_BASE_PATH}/${id}`;

export type CourseListItem = {
  id: string;
  courseName: string;
  type: string;
  duration: string;
  eligibility: string;
  keyDetails: string;
  status: "Active" | "Inactive";
  image: string;
};

export type CoursePayload = {
  // New backend shape
  courseName?: string;
  keyDetails?: string;
  duration?: string;
  eligibility?: string;
  type?: string;
  imageUrl?: string;
  imageFile?: File | null;
  status?: "Active" | "Inactive";
  // Backward-compat keys used by existing UI calls
  title?: string;
  body?: string;
  image?: string;
};

type CourseListApiRow = {
  _id: string;
  name: string;
  type?: string;
  duration?: string;
  eligibility?: string;
  keyDetails?: string;
  status?: boolean | "Active" | "Inactive";
  imageUrl?: string;
};

const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);

const isCourseListApiRow = (x: unknown): x is CourseListApiRow =>
  isRecord(x) && typeof x._id === "string" && typeof x.name === "string";

const toAbsoluteImageUrl = (imageUrl?: string): string => {
  if (!imageUrl) return "";
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  const apiBase =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "";
  return apiBase ? `${apiBase}${imageUrl}` : imageUrl;
};

// const mapListRowToUi = (item: CourseListApiRow): CourseListItem => ({
//   id: item._id,
//   courseName: item.name,
//   type: item.type ?? "",
//   duration: item.duration ?? "",
//   eligibility: item.eligibility ?? "",
//   keyDetails: item.keyDetails ?? "",
//   status:
//     item.status === "Active" || item.status === true
//       ? "Active"
//       : "Inactive",
//   image: item.imageUrl || "",
// });
const mapListRowToUi = (item: CourseListApiRow): CourseListItem => ({
  id: item._id,
  courseName: item.name,
  type: item.type ?? "",
  duration: item.duration ?? "",
  eligibility: item.eligibility ?? "",
  keyDetails: item.keyDetails ?? "",
  status:
    item.status === "Active" || item.status === true
      ? "Active"
      : "Inactive",
  image: toAbsoluteImageUrl(item.imageUrl),
});

export const mapCoursesResponse = (data: unknown): CourseListItem[] => {
  if (!isRecord(data)) return [];

  const nested = data.data;
  const actual = isRecord(nested) ? nested.data : nested;

  if (!Array.isArray(actual)) return [];
  return actual
    .filter((row): row is CourseListApiRow => isCourseListApiRow(row))
    .map(mapListRowToUi);
};

export const getCourses = async (signal?: AbortSignal): Promise<CourseListItem[]> => {
  const res = await api.get<unknown>(COURSES_LIST_PATH, signal ? { signal } : undefined);
  return mapCoursesResponse(res.data);
};

export type FilterCoursesParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  date?: string;
  sortBy?: string;
  order?: "asc" | "desc";
};

export type FilterCoursesResponse = {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: CourseListItem[];
};

export const filterCourses = async (params: FilterCoursesParams, signal?: AbortSignal): Promise<FilterCoursesResponse> => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());
  if (params.search) query.append("search", params.search);
  if (params.status && params.status !== "all") query.append("status", params.status);
  if (params.type && params.type !== "all") query.append("type", params.type);
  if (params.sortBy) query.append("sortBy", params.sortBy);
  if (params.order) query.append("order", params.order);

  const url = `${COURSES_BASE_PATH}/filter?${query.toString()}`;
  const res = await api.get<{
    success: boolean;
    total: number;
    page: number;
    limit: number;
    data: CourseListApiRow[];
  }>(url, signal ? { signal } : undefined);

  return {
    success: res.data.success,
    total: res.data.total ?? 0,
    page: res.data.page ?? params.page ?? 1,
    limit: res.data.limit ?? params.limit ?? 10,
    data: Array.isArray(res.data.data) ? res.data.data.map(mapListRowToUi) : [],
  };
};

export type CourseFormState = {
  courseName: string;
  type: string;
  duration: string;
  eligibility: string;
  keyDetails: string;
  imageUrl?: string;
};

export const mapCourseDetailToForm = (raw: Record<string, unknown>): CourseFormState => {
  const detail = isRecord(raw.data) ? raw.data : raw;
  return {
    courseName: String(detail.name ?? ""),
    type: String(detail.type ?? ""),
    duration: String(detail.duration ?? ""),
    eligibility: String(detail.eligibility ?? ""),
    keyDetails: String(detail.keyDetails ?? ""),
    imageUrl: typeof detail.imageUrl === "string" ? detail.imageUrl : undefined,
  };
};

export const getCourse = async (id: string, signal?: AbortSignal): Promise<CourseFormState> => {
  const res = await api.get<unknown>(courseDetailPath(id), signal ? { signal } : undefined);
  if (isRecord(res.data)) {
    return mapCourseDetailToForm(res.data);
  }
  return {
    courseName: "",
    type: "",
    duration: "",
    eligibility: "",
    keyDetails: "",
  };
};

const toFormData = (data: CoursePayload): FormData => {
  const formData = new FormData();
  const courseName = data.courseName ?? data.title ?? "";
  const keyDetails = data.keyDetails ?? data.body ?? "";

  formData.append("name", courseName);
  formData.append("type", data.type ?? "");
  formData.append("duration", data.duration ?? "");
  formData.append("keyDetails", keyDetails);
  formData.append("eligibility", data.eligibility ?? "");
  formData.append("status", data.status ?? "Active");

  if (data.imageFile) {
    formData.append("courseImage", data.imageFile);
  }

  return formData;
};

export const createCourse = async (data: CoursePayload) => {
  const res = await api.post<Record<string, unknown>>(COURSES_BASE_PATH, toFormData(data));
  return res.data;
};

export const updateCourse = async (id: string, data: CoursePayload) => {
  const res = await api.put<Record<string, unknown>>(courseDetailPath(id), toFormData(data));
  return res.data;
};

export const deleteCourse = async (id: string) => {
  const res = await api.delete<unknown>(courseDetailPath(id));
  return res.data;
};
