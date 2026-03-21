import { MOCK_NEWS } from "@/lib/mock-data";
import { NewsItem } from "@/types";

export type NewsStatus = NewsItem["status"];

const STORAGE_KEY = "admin_news_v1";

const seedNews = (): NewsItem[] => MOCK_NEWS;

const normalizeNews = (raw: unknown): NewsItem | null => {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const id = typeof item.id === "string" ? item.id : "";
  if (!id) return null;
  return {
    id,
    title: typeof item.title === "string" ? item.title : "",
    description: typeof item.description === "string" ? item.description : "",
    image: typeof item.image === "string" ? item.image : "",
    date: typeof item.date === "string" ? item.date : "",
    status: item.status === "Published" || item.status === "Draft" ? item.status : "Draft",
  };
};

const readNews = (): NewsItem[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedNews();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) {
      const seeded = seedNews();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const normalized = parsed
      .map(normalizeNews)
      .filter((item): item is NewsItem => item !== null);
    if (normalized.length === 0) {
      const seeded = seedNews();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const serialized = JSON.stringify(normalized);
    if (serialized !== raw) {
      localStorage.setItem(STORAGE_KEY, serialized);
    }
    return normalized;
  } catch {
    const seeded = seedNews();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
};

const writeNews = (items: NewsItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const listNews = (): NewsItem[] => readNews();

export const getNewsById = (id: string): NewsItem | undefined =>
  readNews().find((item) => item.id === id);

export const upsertNews = (payload: Omit<NewsItem, "id"> & { id?: string }): NewsItem => {
  const items = readNews();
  if (payload.id) {
    const idx = items.findIndex((item) => item.id === payload.id);
    if (idx !== -1) {
      const updated: NewsItem = { ...items[idx], ...payload, id: payload.id };
      items[idx] = updated;
      writeNews(items);
      return updated;
    }
  }
  const created: NewsItem = {
    id: Date.now().toString(),
    ...payload,
  };
  writeNews([created, ...items]);
  return created;
};

export const removeNews = (id: string) => {
  writeNews(readNews().filter((item) => item.id !== id));
};
