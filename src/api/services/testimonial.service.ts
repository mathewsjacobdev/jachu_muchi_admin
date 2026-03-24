import { api } from "../client";
import type { Testimonial } from "@/lib/testimonial-store";

export const TESTIMONIALS_LIST_PATH = "/comments";
export const testimonialDetailPath = (id: string) => `/comments/${id}`;

type JsonPlaceholderComment = {
  id: number;
  postId: number;
  name: string;
  email: string;
  body: string;
};

const isJpComment = (x: unknown): x is JsonPlaceholderComment =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as JsonPlaceholderComment).id === "number" &&
  typeof (x as JsonPlaceholderComment).body === "string" &&
  "postId" in x;

const isTestimonialRow = (x: unknown): x is Testimonial =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as Testimonial).id === "string" &&
  "message" in x;

const mapCommentToTestimonial = (c: JsonPlaceholderComment): Testimonial => ({
  id: String(c.id),
  name: c.name || `Student ${c.id}`,
  message: c.body,
  course: `Course ref #${c.postId}`,
  image: "",
});

const rowToTestimonial = (raw: Record<string, unknown>): Testimonial => ({
  id: String(raw.id),
  name: String(raw.name ?? ""),
  message: String(raw.message ?? raw.body ?? ""),
  course: String(raw.course ?? ""),
  image: typeof raw.image === "string" ? raw.image : "",
});

export const getTestimonials = async (): Promise<Testimonial[]> => {
  const res = await api.get<unknown>(`${TESTIMONIALS_LIST_PATH}?_limit=50`);
  const data = res.data;
  if (!Array.isArray(data) || data.length === 0) return [];
  if (isTestimonialRow(data[0])) return data as Testimonial[];
  if (isJpComment(data[0])) {
    return (data as JsonPlaceholderComment[]).slice(0, 20).map(mapCommentToTestimonial);
  }
  return data.map((item) => rowToTestimonial(item as Record<string, unknown>));
};

export const getTestimonialByIdApi = async (id: string): Promise<Testimonial | null> => {
  try {
    const res = await api.get<unknown>(testimonialDetailPath(id));
    const row = res.data;
    if (row && typeof row === "object") {
      if (isTestimonialRow(row)) return row;
      if (isJpComment(row)) return mapCommentToTestimonial(row);
      return rowToTestimonial(row as Record<string, unknown>);
    }
    return null;
  } catch {
    return null;
  }
};

export const createTestimonial = async (payload: Omit<Testimonial, "id">): Promise<Testimonial> => {
  const res = await api.post<Record<string, unknown>>(TESTIMONIALS_LIST_PATH, {
    name: payload.name,
    body: payload.message,
    email: "testimonial@example.com",
    postId: 1,
    course: payload.course,
    image: payload.image,
  });
  const id = res.data.id != null ? String(res.data.id) : Date.now().toString();
  return { id, ...payload };
};

export const updateTestimonialApi = async (id: string, payload: Omit<Testimonial, "id">): Promise<void> => {
  await api.put(testimonialDetailPath(id), {
    id: Number(id) || id,
    name: payload.name,
    body: payload.message,
    postId: 1,
    course: payload.course,
    image: payload.image,
  });
};

export const deleteTestimonialApi = async (id: string): Promise<void> => {
  await api.delete(testimonialDetailPath(id));
};
