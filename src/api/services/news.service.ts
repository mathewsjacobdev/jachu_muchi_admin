import { api } from "../client";
import type { NewsItem } from "@/types";

/**
 * Dummy API: uses `/comments` so it does not clash with enquiries (`/posts`) or courses (`/albums`).
 * For production: set `NEWS_LIST_PATH` / `newsDetailPath` to your routes.
 */
export const NEWS_LIST_PATH = "/comments";
export const newsDetailPath = (id: string) => `/comments/${id}`;

type JsonPlaceholderComment = {
  id: number;
  postId: number;
  name: string;
  email: string;
  body: string;
};

const isJsonPlaceholderComment = (x: unknown): x is JsonPlaceholderComment =>
  typeof x === "object" &&
  x !== null &&
  "postId" in x &&
  "body" in x &&
  typeof (x as JsonPlaceholderComment).name === "string" &&
  typeof (x as JsonPlaceholderComment).body === "string";

export const rowToNewsItem = (raw: Record<string, unknown>): NewsItem => ({
  id: String(raw.id),
  title: String(raw.title ?? ""),
  description: String(raw.description ?? raw.body ?? raw.content ?? ""),
  image: typeof raw.image === "string" ? raw.image : "",
  date: typeof raw.date === "string" ? raw.date : new Date().toISOString().split("T")[0],
  status: raw.status === "Published" || raw.status === "Draft" ? raw.status : "Draft",
});

const mapCommentToNews = (c: JsonPlaceholderComment): NewsItem => ({
  id: String(c.id),
  title: c.name.trim() || `News ${c.id}`,
  description: c.body,
  image: "",
  date: new Date(2026, 0, (c.id % 27) + 1).toISOString().split("T")[0],
  status: c.id % 2 === 0 ? "Published" : "Draft",
});

const isLikelyNewsItemRow = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" &&
  x !== null &&
  "title" in x &&
  ("description" in x || "body" in x || "date" in x);

export const getNews = async (): Promise<NewsItem[]> => {
  const res = await api.get<unknown>(NEWS_LIST_PATH);
  const data = res.data;
  if (!Array.isArray(data) || data.length === 0) return [];
  const first = data[0];
  if (isJsonPlaceholderComment(first)) {
    return (data as JsonPlaceholderComment[]).slice(0, 12).map(mapCommentToNews);
  }
  if (isLikelyNewsItemRow(first)) {
    return data.map((item) => rowToNewsItem(item as Record<string, unknown>));
  }
  console.warn(
    "[news.service] Unrecognized news list shape; attempting generic rowToNewsItem.",
    first,
  );
  try {
    return data.map((item) => rowToNewsItem(item as Record<string, unknown>));
  } catch (e) {
    console.warn("[news.service] Generic mapping failed.", e);
    return [];
  }
};

export const getNewsById = async (id: string): Promise<NewsItem | null> => {
  try {
    const res = await api.get<unknown>(newsDetailPath(id));
    const row = res.data;
    if (row && typeof row === "object") {
      if (isJsonPlaceholderComment(row)) {
        return mapCommentToNews(row);
      }
      return rowToNewsItem(row as Record<string, unknown>);
    }
    return null;
  } catch {
    return null;
  }
};

export const createNews = async (payload: Omit<NewsItem, "id">): Promise<NewsItem> => {
  const res = await api.post<Record<string, unknown>>(NEWS_LIST_PATH, {
    postId: 1,
    name: payload.title,
    email: "news@example.com",
    body: payload.description,
    image: payload.image,
    date: payload.date,
    status: payload.status,
  });
  const data = res.data ?? {};
  const newId = data.id != null ? String(data.id) : Date.now().toString();
  return {
    id: newId,
    title: String(data.name ?? data.title ?? payload.title),
    description: String(data.body ?? data.description ?? payload.description),
    image: typeof data.image === "string" ? data.image : payload.image,
    date: typeof data.date === "string" ? data.date : payload.date,
    status: data.status === "Published" || data.status === "Draft" ? data.status : payload.status,
  };
};

export const updateNews = async (id: string, payload: Omit<NewsItem, "id">): Promise<NewsItem> => {
  const res = await api.put<Record<string, unknown>>(newsDetailPath(id), {
    id: Number(id),
    postId: 1,
    name: payload.title,
    email: "news@example.com",
    body: payload.description,
    image: payload.image,
    date: payload.date,
    status: payload.status,
  });
  const data = res.data ?? {};
  return {
    id: String(data.id ?? id),
    title: String(data.name ?? data.title ?? payload.title),
    description: String(data.body ?? data.description ?? payload.description),
    image: typeof data.image === "string" ? data.image : payload.image,
    date: typeof data.date === "string" ? data.date : payload.date,
    status: data.status === "Published" || data.status === "Draft" ? data.status : payload.status,
  };
};

export const deleteNews = async (id: string): Promise<void> => {
  await api.delete(newsDetailPath(id));
};
