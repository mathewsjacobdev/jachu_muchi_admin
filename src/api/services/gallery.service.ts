import { api, isApiRequestError } from "../client";

export type GalleryCategory = "Campus" | "Labs" | "Events";

export interface GalleryItem {
  id: string;
  title: string;
  category: GalleryCategory;
  image: string;
}

const PHOTOS_PATH = "/photos";
const GALLERY_PATH = "/gallery";
const JP_FALLBACK_PATH = "/photos";
export const galleryItemPath = (id: string) => `${GALLERY_PATH}/${id}`;

type JsonPlaceholderPhoto = {
  id: number;
  albumId: number;
  title: string;
  url: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isGalleryCategory = (value: unknown): value is GalleryCategory =>
  value === "Campus" || value === "Labs" || value === "Events";

const isJpPhoto = (x: unknown): x is JsonPlaceholderPhoto =>
  isRecord(x) &&
  typeof x.id === "number" &&
  typeof x.url === "string" &&
  typeof x.title === "string" &&
  typeof x.albumId === "number";

const isGalleryRow = (x: unknown): x is GalleryItem =>
  isRecord(x) &&
  (typeof x.id === "string" || typeof x.id === "number") &&
  typeof x.title === "string" &&
  isGalleryCategory(x.category) &&
  typeof (x.image ?? x.url) === "string";

const albumIdToCategory = (albumId: number): GalleryCategory => {
  const m = albumId % 3;
  if (m === 0) return "Campus";
  if (m === 1) return "Labs";
  return "Events";
};

const mapPhotoToItem = (p: JsonPlaceholderPhoto): GalleryItem => ({
  id: String(p.id),
  title: p.title || `Photo ${p.id}`,
  category: albumIdToCategory(p.albumId),
  image: p.url,
});

const rowToGalleryItem = (raw: Record<string, unknown>): GalleryItem => {
  const category = isGalleryCategory(raw.category) ? raw.category : "Campus";
  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? ""),
    category,
    image: String(raw.image ?? raw.url ?? ""),
  };
};

const stableSeed = (input: string): string => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return String(hash || 1);
};

const remoteUrl = (image: string): string =>
  image.startsWith("http")
    ? image
    : `https://picsum.photos/seed/${stableSeed(image || "gallery-fallback")}/600/400`;

const isBlobUrl = (value: string): boolean => value.startsWith("blob:");

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(blob);
  });

const imageToBase64 = async (image: string): Promise<string> => {
  // For real backend we send base64/data-url. If UI provides an already remote URL or data URL, keep it.
  if (!isBlobUrl(image)) return image;
  const res = await fetch(image);
  const blob = await res.blob();
  return blobToDataUrl(blob);
};

const shouldFallbackToJsonPlaceholder = (err: unknown): boolean => {
  return isApiRequestError(err) && err.status === 404;
};

const normalizeGalleryItems = (data: unknown): GalleryItem[] => {
  if (!Array.isArray(data) || data.length === 0) return [];
  if (data.every((item) => isGalleryRow(item))) {
    return data;
  }
  if (data.every((item) => isJpPhoto(item))) {
    return data.map(mapPhotoToItem);
  }
  return data
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => (isJpPhoto(item) ? mapPhotoToItem(item) : rowToGalleryItem(item)));
};

export const getGalleryItems = async (): Promise<GalleryItem[]> => {
  const tryGet = async (path: string) =>
    api.get<unknown>(`${path}?_limit=30`);

  let res;
  try {
    res = await tryGet(GALLERY_PATH);
  } catch (e) {
    if (!shouldFallbackToJsonPlaceholder(e)) throw e;
    res = await tryGet(JP_FALLBACK_PATH);
  }

  return normalizeGalleryItems(res.data);
};

export const createGalleryItem = async (
  payload: Omit<GalleryItem, "id">,
): Promise<GalleryItem> => {
  const base64Image = await imageToBase64(payload.image);

  // Backend payload contract (real API):
  // { title, category, image }
  // For dummy JSONPlaceholder we fallback to `/photos`, but we still keep the backend-shaped payload.
  let res: { data: Record<string, unknown> };
  try {
    res = await api.post<Record<string, unknown>>(GALLERY_PATH, {
      title: payload.title,
      category: payload.category,
      image: base64Image,
    });
  } catch (e) {
    if (!shouldFallbackToJsonPlaceholder(e)) throw e;
    res = await api.post<Record<string, unknown>>(JP_FALLBACK_PATH, {
      title: payload.title,
      category: payload.category,
      image: base64Image,
    });
  }

  const responseData = isRecord(res.data) ? res.data : {};
  const id = responseData.id != null ? String(responseData.id) : Date.now().toString();
  return {
    id,
    title: payload.title,
    category: payload.category,
    image:
      typeof responseData.image === "string"
        ? String(responseData.image)
        : base64Image
          ? base64Image
          : remoteUrl(payload.image),
  };
};

export const deleteGalleryItemApi = async (id: string): Promise<void> => {
  try {
    await api.delete(galleryItemPath(id));
  } catch (e) {
    if (shouldFallbackToJsonPlaceholder(e)) {
      await api.delete(`${JP_FALLBACK_PATH}/${id}`);
      return;
    }
    throw e;
  }
};
