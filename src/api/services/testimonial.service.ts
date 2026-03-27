import { api, isApiRequestError } from "../client";
import type { Testimonial } from "@/lib/testimonial-store";

export const TESTIMONIALS_LIST_PATH = "/testimonials/all";
const TESTIMONIALS_BASE_PATH = "/testimonials";
export const testimonialDetailPath = (id: string) => `${TESTIMONIALS_BASE_PATH}/${id}`;
const testimonialDeleteFallbackPath = (id: string) => `/gallery/${id}`;

type TestimonialApiRow = {
  _id: string;
  name: string;
  courseRef?: string;
  course?: string;
  avatar?: string;
  profileImageUrl?: string;
  testimonial?: string;
  message?: string;
};

const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null;

const isTestimonialApiRow = (x: unknown): x is TestimonialApiRow =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as TestimonialApiRow)._id === "string" &&
  typeof (x as TestimonialApiRow).name === "string";

const isTestimonialRow = (x: unknown): x is Testimonial =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as Testimonial).id === "string" &&
  "message" in x;

const mapApiRowToTestimonial = (row: TestimonialApiRow): Testimonial => ({
  id: row._id,
  name: row.name || "Student",
  message: row.testimonial ?? row.message ?? "",
  course: row.courseRef ?? row.course ?? "",
  image: row.profileImageUrl ?? "",
});

const rowToTestimonial = (raw: Record<string, unknown>): Testimonial => ({
  id: String(raw.id ?? raw._id ?? ""),
  name: String(raw.name ?? ""),
  message: String(raw.message ?? raw.testimonial ?? raw.body ?? ""),
  course: String(raw.course ?? raw.courseRef ?? ""),
  image:
    typeof raw.image === "string"
      ? raw.image
      : typeof raw.avatar === "string" && /^https?:\/\//i.test(raw.avatar)
        ? raw.avatar
        : "",
});

export const getTestimonials = async (): Promise<Testimonial[]> => {
  const res = await api.get<unknown>(TESTIMONIALS_LIST_PATH);
  const data = res.data;
  const list = isRecord(data) && Array.isArray(data.data) ? data.data : data;
  if (!Array.isArray(list) || list.length === 0) return [];
  if (isTestimonialRow(list[0])) return list as Testimonial[];
  if (isTestimonialApiRow(list[0])) {
    return (list as TestimonialApiRow[]).map(mapApiRowToTestimonial);
  }
  return list
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => rowToTestimonial(item));
};

export const getTestimonialByIdApi = async (id: string): Promise<Testimonial | null> => {
  try {
    const res = await api.get<unknown>(testimonialDetailPath(id));
    const row = isRecord(res.data) && isRecord(res.data.data) ? res.data.data : res.data;
    if (row && typeof row === "object") {
      if (isTestimonialRow(row)) return row;
      if (isTestimonialApiRow(row)) return mapApiRowToTestimonial(row);
      return rowToTestimonial(row as Record<string, unknown>);
    }
    return null;
  } catch {
    return null;
  }
};

export const createTestimonial = async (payload: Omit<Testimonial, "id">): Promise<Testimonial> => {
  const res = await api.post<Record<string, unknown>>(TESTIMONIALS_BASE_PATH, {
    name: payload.name,
    course: payload.course,
    message: payload.message,
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

export const updateTestimonialApi = async (id: string, payload: Omit<Testimonial, "id">): Promise<void> => {
  await api.put(testimonialDetailPath(id), {
    name: payload.name,
    course: payload.course,
    message: payload.message,
    ...(payload.image ? { profileImageUrl: payload.image } : {}),
  });
};

export const deleteTestimonialApi = async (id: string): Promise<void> => {
  try {
    await api.delete(testimonialDetailPath(id));
  } catch (error) {
    // Keep compatibility if backend delete route is temporarily wired under /gallery/:id.
    if (isApiRequestError(error) && error.status === 404) {
      await api.delete(testimonialDeleteFallbackPath(id));
      return;
    }
    throw error;
  }
};
