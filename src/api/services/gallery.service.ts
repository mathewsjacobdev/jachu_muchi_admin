import { api, isApiRequestError } from "../client";

export type GalleryCategory = "Campus" | "Labs" | "Events";

export interface GalleryItem {
  id: string;
  title: string;
  category: GalleryCategory;
  image: string;
}

export const GALLERY_LIST_PATH = "/gallery/all";
export const GALLERY_PATH = "/gallery";
export const GALLERY_FILTER_PATH = "/gallery/filter";
export const galleryItemPath = (id: string) => `${GALLERY_PATH}/${id}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isGalleryCategory = (value: unknown): value is GalleryCategory =>
  value === "Campus" || value === "Labs" || value === "Events";

const rowToGalleryItem = (raw: Record<string, unknown>): GalleryItem => {
  const category = isGalleryCategory(raw.category) ? raw.category : "Campus";
  return {
    id: String(raw._id ?? raw.id ?? ""),
    title: String(raw.title ?? ""),
    category,
    image: String(raw.imageUrl ?? raw.image ?? ""),
  };
};

export const getGalleryItems = async (): Promise<GalleryItem[]> => {
  const res = await api.get<{ data: Record<string, unknown>[] }>(GALLERY_LIST_PATH);
  const data = res.data?.data || res.data || [];
  if (Array.isArray(data)) {
    return data.filter(isRecord).map(rowToGalleryItem);
  }
  return [];
};

export type GalleryFilterSortBy = "createdAt" | "title" | "category";
export type GalleryFilterOrder = "asc" | "desc";

export type GalleryFilterParams = {
  page?: number;
  limit?: number;
  search?: string;
  type?: string; 
  date?: string;
  sortBy?: GalleryFilterSortBy | string;
  order?: GalleryFilterOrder;
};

export type GalleryFilterResult = {
  data: GalleryItem[];
  total: number;
  page: number;
  limit: number;
};

export const filterGalleryItems = async (
  params: GalleryFilterParams,
  signal?: AbortSignal
): Promise<GalleryFilterResult> => {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search?.trim()) q.set("search", params.search.trim());
  if (params.date) q.set("date", params.date);
  if (params.sortBy) if (params.date) q.set("date", params.date);
  q.set("sortBy", params.sortBy);
  if (params.order) q.set("order", params.order);
  if (params.type && params.type !== "All") q.set("type", params.type);

  const res = await api.get<{
    success: boolean;
    data: unknown;
    pagination?: { total: number; page: number; pages: number };
  }>(`${GALLERY_FILTER_PATH}?${q.toString()}`, signal ? { signal } : undefined);

  let parsed: GalleryItem[] = [];
  const list = res.data?.data;
  if (Array.isArray(list)) {
    parsed = list.filter((item): item is Record<string, unknown> => isRecord(item)).map(rowToGalleryItem);
  }

  return {
    data: parsed,
    total: res.data?.pagination?.total ?? 0,
    page: res.data?.pagination?.page ?? params.page ?? 1,
    limit: params.limit ?? 10,
  };
};

export const createGalleryItem = async (
  payload: { title: string; category: GalleryCategory; imageFile: File }
): Promise<GalleryItem> => {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("category", payload.category);
  formData.append("image", payload.imageFile);

  const res = await api.post<{ data: Record<string, unknown> }>(GALLERY_PATH, formData);
  return rowToGalleryItem(res.data.data);
};

export const updateGalleryItemApi = async (
  id: string,
  payload: { title: string; category: GalleryCategory; imageFile?: File | null }
): Promise<GalleryItem> => {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("category", payload.category);
  if (payload.imageFile) {
    formData.append("image", payload.imageFile);
  }

  const res = await api.put<{ data: Record<string, unknown> }>(galleryItemPath(id), formData);
  return rowToGalleryItem(res.data.data);
};

export const deleteGalleryItemApi = async (id: string): Promise<void> => {
  await api.delete(galleryItemPath(id));
};
