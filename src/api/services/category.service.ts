import { api } from "../client";
import type { Category } from "@/types";

export const CATEGORIES_LIST_PATH = "/categories/all";
const CATEGORIES_BASE_PATH = "/categories";
export const categoryDetailPath = (id: string) => `${CATEGORIES_BASE_PATH}/${id}`;

type CategoryApiRow = {
  _id: string;
  name: string;
  productCount?: number;
  status?: boolean;
  createdAt?: string;
};

const isCategoryApiRow = (x: unknown): x is CategoryApiRow =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as CategoryApiRow)._id === "string" &&
  typeof (x as CategoryApiRow).name === "string";

const isCategoryRow = (x: unknown): x is Category =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as Category).id === "string" &&
  typeof (x as Category).name === "string" &&
  typeof (x as Category).productCount === "number";

const mapApiCategoryToCategory = (row: CategoryApiRow): Category => ({
  id: row._id,
  name: row.name,
  productCount: typeof row.productCount === "number" ? row.productCount : 0,
});

const rowToCategory = (raw: Record<string, unknown>): Category => ({
  id: String(raw.id ?? raw._id ?? ""),
  name: String(raw.name ?? ""),
  productCount: typeof raw.productCount === "number" ? raw.productCount : 0,
});

export const getCategories = async (): Promise<Category[]> => {
  const res = await api.get<unknown>(CATEGORIES_LIST_PATH);
  const data = res.data;
  const list = (
    typeof data === "object" &&
    data !== null &&
    "data" in data &&
    Array.isArray((data as { data?: unknown }).data)
      ? (data as { data: unknown[] }).data
      : data
  );
  if (!Array.isArray(list) || list.length === 0) return [];
  const first = list[0];
  if (isCategoryRow(first)) return list as Category[];
  if (isCategoryApiRow(first)) {
    return (list as CategoryApiRow[]).map(mapApiCategoryToCategory);
  }
  try {
    return list.map((item) => rowToCategory(item as Record<string, unknown>));
  } catch (e) {
    console.warn("[category.service] Generic mapping failed.", e);
    return [];
  }
};

export const createCategory = async (payload: Omit<Category, "id">): Promise<Category> => {
  const categoryName = payload.name.trim();
  const res = await api.post<Record<string, unknown>>(CATEGORIES_BASE_PATH, {
    name: categoryName,
  });
  const data = res.data ?? {};
  const createdRow =
    typeof data === "object" &&
    data !== null &&
    "data" in data &&
    typeof (data as { data?: unknown }).data === "object" &&
    (data as { data?: unknown }).data !== null
      ? ((data as { data: Record<string, unknown> }).data ?? {})
      : (data as Record<string, unknown>);
  const id =
    createdRow._id != null
      ? String(createdRow._id)
      : createdRow.id != null
        ? String(createdRow.id)
        : Date.now().toString();
  return {
    id,
    name:
      typeof createdRow.name === "string" && createdRow.name.trim()
        ? createdRow.name
        : payload.name,
    productCount:
      typeof createdRow.productCount === "number"
        ? createdRow.productCount
        : payload.productCount,
  };
};

export const updateCategoryApi = async (id: string, payload: Partial<Omit<Category, "id">>): Promise<void> => {
  const categoryName = typeof payload.name === "string" ? payload.name.trim() : "";
  await api.put(categoryDetailPath(id), {
    ...(categoryName ? { name: categoryName } : {}),
  });
};

export const deleteCategoryApi = async (id: string): Promise<void> => {
  await api.delete(categoryDetailPath(id));
};
