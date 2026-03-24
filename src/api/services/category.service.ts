import { api } from "../client";
import type { Category } from "@/types";

/**
 * Dummy API: uses `/photos` so courses can own `/albums` without clashing.
 * (Other features also use `/photos` for JP; production should use dedicated routes.)
 */
export const CATEGORIES_LIST_PATH = "/photos";
export const categoryDetailPath = (id: string) => `/photos/${id}`;

type JsonPlaceholderPhoto = {
  id: number;
  albumId: number;
  title: string;
  url: string;
  thumbnailUrl?: string;
};

const isJpPhoto = (x: unknown): x is JsonPlaceholderPhoto =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as JsonPlaceholderPhoto).id === "number" &&
  typeof (x as JsonPlaceholderPhoto).title === "string" &&
  typeof (x as JsonPlaceholderPhoto).url === "string" &&
  "albumId" in x;

const isCategoryRow = (x: unknown): x is Category =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as Category).id === "string" &&
  typeof (x as Category).name === "string" &&
  typeof (x as Category).productCount === "number";

const mapPhotoToCategory = (p: JsonPlaceholderPhoto): Category => ({
  id: String(p.id),
  name: p.title,
  productCount: (p.albumId * 7 + p.id * 3) % 200,
});

const rowToCategory = (raw: Record<string, unknown>): Category => ({
  id: String(raw.id),
  name: String(raw.name ?? raw.title ?? ""),
  productCount: typeof raw.productCount === "number" ? raw.productCount : 0,
});

export const getCategories = async (): Promise<Category[]> => {
  const res = await api.get<unknown>(`${CATEGORIES_LIST_PATH}?_limit=100`);
  const data = res.data;
  if (!Array.isArray(data) || data.length === 0) return [];
  const first = data[0];
  if (isCategoryRow(first)) return data as Category[];
  if (isJpPhoto(first)) {
    return (data as JsonPlaceholderPhoto[]).map(mapPhotoToCategory);
  }
  console.warn(
    "[category.service] Unrecognized category list shape; attempting generic row mapping.",
    first,
  );
  try {
    return data.map((item) => rowToCategory(item as Record<string, unknown>));
  } catch (e) {
    console.warn("[category.service] Generic mapping failed.", e);
    return [];
  }
};

export const createCategory = async (payload: Omit<Category, "id">): Promise<Category> => {
  const res = await api.post<Record<string, unknown>>(CATEGORIES_LIST_PATH, {
    albumId: 1,
    title: payload.name,
    url: "https://via.placeholder.com/150",
    thumbnailUrl: "https://via.placeholder.com/150",
  });
  const data = res.data ?? {};
  const id = data.id != null ? String(data.id) : Date.now().toString();
  return {
    id,
    name: payload.name,
    productCount: payload.productCount,
  };
};

export const updateCategoryApi = async (id: string, payload: Partial<Omit<Category, "id">>): Promise<void> => {
  await api.put(categoryDetailPath(id), {
    id: Number(id) || id,
    albumId: 1,
    title: payload.name,
    url: "https://via.placeholder.com/150",
    productCount: payload.productCount,
  });
};

export const deleteCategoryApi = async (id: string): Promise<void> => {
  await api.delete(categoryDetailPath(id));
};
