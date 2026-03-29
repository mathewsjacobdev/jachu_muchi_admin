import { api } from "../client";
import type { Category } from "@/types";

export const CATEGORIES_LIST_PATH = "/categories/all";
export const CATEGORIES_FILTER_PATH = "/categories/filter";
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

export type CategoryFilterSortBy = "createdAt" | "name" | "productCount";
export type CategoryFilterOrder = "asc" | "desc";

export type CategoriesFilterParams = {
  page?: number;
  limit?: number;
  search?: string;
  date?: string;
  sortBy?: CategoryFilterSortBy | string;
  order?: CategoryFilterOrder;
};

export type CategoriesFilterResult = {
  data: Category[];
  total: number;
  page: number;
  limit: number;
};

export const filterCategories = async (
  params: CategoriesFilterParams,
  signal?: AbortSignal
): Promise<CategoriesFilterResult> => {
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
    total: number;
    page: number;
    limit: number;
    data: CategoryApiRow[];
  }>(`${CATEGORIES_FILTER_PATH}?${q.toString()}`, signal ? { signal } : undefined);

  return {
    data: Array.isArray(res.data.data) ? res.data.data.map(mapApiCategoryToCategory) : [],
    total: res.data.total ?? 0,
    page: res.data.page ?? params.page ?? 1,
    limit: res.data.limit ?? params.limit ?? 10,
  };
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
