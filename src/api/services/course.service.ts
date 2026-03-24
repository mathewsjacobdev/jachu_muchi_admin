import { api } from "../client";

/**
 * Dummy API: uses `/albums` so it does not clash with enquiries (`/posts`) or news (`/comments`).
 */
export const COURSES_LIST_PATH = "/albums";
const courseDetailPath = (id: string) => `/albums/${id}`;

const DEFAULT_CARD_IMAGE =
  "https://images.unsplash.com/photo-1581093458791-9d2c6c3f0c0f?w=600";

export type CourseListItem = {
  id: number;
  courseName: string;
  type: string;
  duration: string;
  eligibility: string;
  keyDetails: string;
  image: string;
};

export type CoursePayload = {
  title: string;
  body: string;
  duration?: string;
  eligibility?: string;
  type?: string;
  image?: string;
};

type JsonPlaceholderAlbum = {
  id: number;
  userId: number;
  title: string;
};

const isPlaceholderAlbum = (x: unknown): x is JsonPlaceholderAlbum =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as JsonPlaceholderAlbum).id === "number" &&
  typeof (x as JsonPlaceholderAlbum).title === "string" &&
  "userId" in x &&
  !("body" in x);

/** Row already shaped like our list item (real API). */
const isCourseListRow = (x: unknown): x is CourseListItem =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as CourseListItem).id === "number" &&
  typeof (x as CourseListItem).courseName === "string";

const mapAlbumToListItem = (a: JsonPlaceholderAlbum): CourseListItem => ({
  id: a.id,
  courseName: a.title,
  keyDetails: `Course programme · cohort ref #${a.userId}`,
  type: "Demo Type",
  duration: "12 Months",
  eligibility: "Plus Two",
  image: DEFAULT_CARD_IMAGE,
});

const rowToListItem = (raw: Record<string, unknown>): CourseListItem => {
  const rawId = raw.id;
  const id =
    typeof rawId === "number" && Number.isFinite(rawId)
      ? rawId
      : Number(rawId);
  return {
    id: Number.isFinite(id) ? id : 0,
    courseName: String(raw.courseName ?? raw.title ?? ""),
    keyDetails: String(raw.keyDetails ?? raw.body ?? ""),
    type: String(raw.type ?? "General"),
    duration: String(raw.duration ?? ""),
    eligibility: String(raw.eligibility ?? ""),
    image: typeof raw.image === "string" && raw.image ? raw.image : DEFAULT_CARD_IMAGE,
  };
};

export const mapCoursesResponse = (data: unknown): CourseListItem[] => {
  if (!Array.isArray(data) || data.length === 0) return [];
  const first = data[0];
  if (isCourseListRow(first)) return data as CourseListItem[];
  if (isPlaceholderAlbum(first)) {
    return (data as JsonPlaceholderAlbum[]).slice(0, 30).map(mapAlbumToListItem);
  }
  console.warn(
    "[course.service] Unrecognized course list shape; attempting generic row mapping.",
    first,
  );
  try {
    return (data as Record<string, unknown>[]).map((item) => rowToListItem(item));
  } catch (e) {
    console.warn("[course.service] Generic mapping failed.", e);
    return [];
  }
};

export const getCourses = async (signal?: AbortSignal): Promise<CourseListItem[]> => {
  const res = await api.get<unknown>(COURSES_LIST_PATH, signal ? { signal } : undefined);
  return mapCoursesResponse(res.data);
};

export type CourseFormState = {
  courseName: string;
  type: string;
  duration: string;
  eligibility: string;
  keyDetails: string;
  imageUrl?: string;
};

export const mapCourseDetailToForm = (raw: Record<string, unknown>): CourseFormState => ({
  courseName: String(raw.courseName ?? raw.title ?? ""),
  type: String(raw.type ?? ""),
  duration: String(raw.duration ?? ""),
  eligibility: String(raw.eligibility ?? ""),
  keyDetails: String(raw.keyDetails ?? raw.body ?? ""),
  imageUrl: typeof raw.image === "string" && raw.image ? raw.image : undefined,
});

export const getCourse = async (id: string, signal?: AbortSignal): Promise<CourseFormState> => {
  const res = await api.get<unknown>(courseDetailPath(id), signal ? { signal } : undefined);
  const row = res.data;
  if (row && typeof row === "object" && !Array.isArray(row)) {
    if (isPlaceholderAlbum(row)) {
      return {
        courseName: row.title,
        type: "Fellowship",
        duration: "12 Months",
        eligibility: "Demo",
        keyDetails: `Details for "${row.title}" (program #${row.id}).`,
      };
    }
    return mapCourseDetailToForm(row as Record<string, unknown>);
  }
  return {
    courseName: "",
    type: "",
    duration: "",
    eligibility: "",
    keyDetails: "",
  };
};

export const createCourse = async (data: CoursePayload) => {
  const res = await api.post<Record<string, unknown>>(COURSES_LIST_PATH, {
    userId: 1,
    title: data.title,
  });
  return res.data;
};

export const updateCourse = async (id: string, data: CoursePayload) => {
  const res = await api.put<Record<string, unknown>>(courseDetailPath(id), {
    id: Number(id),
    userId: 1,
    title: data.title,
  });
  return res.data;
};

export const deleteCourse = async (id: string) => {
  const res = await api.delete<unknown>(courseDetailPath(id));
  return res.data;
};
