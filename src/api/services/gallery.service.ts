import { api } from "../client";

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

const isJpPhoto = (x: unknown): x is JsonPlaceholderPhoto =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as JsonPlaceholderPhoto).id === "number" &&
  typeof (x as JsonPlaceholderPhoto).url === "string";

const isGalleryRow = (x: unknown): x is GalleryItem =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as GalleryItem).id === "string" &&
  "category" in x;

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
  const cat = raw.category;
  const category: GalleryCategory =
    cat === "Campus" || cat === "Labs" || cat === "Events" ? cat : "Campus";
  return {
    id: String(raw.id),
    title: String(raw.title ?? ""),
    category,
    image: String(raw.image ?? raw.url ?? ""),
  };
};

const remoteUrl = (image: string): string =>
  image.startsWith("http") ? image : `https://picsum.photos/seed/${Date.now()}/600/400`;

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
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("status 404");
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

  const data = res.data;
  if (!Array.isArray(data) || data.length === 0) return [];
  if (isGalleryRow(data[0])) return data as GalleryItem[];
  if (isJpPhoto(data[0])) {
    return (data as JsonPlaceholderPhoto[]).map(mapPhotoToItem);
  }
  return data.map((item) => rowToGalleryItem(item as Record<string, unknown>));
};

export const createGalleryItem = async (
  payload: Omit<GalleryItem, "id">,
): Promise<GalleryItem> => {
  const base64Image = await imageToBase64(payload.image);

  // Backend payload contract (real API):
  // { title, category, image }
  // For dummy JSONPlaceholder we fallback to `/photos`, but we still keep the backend-shaped payload.
  let res: { data: unknown };
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

  const id = res.data.id != null ? String(res.data.id) : Date.now().toString();
  return {
    id,
    title: payload.title,
    category: payload.category,
    image:
      typeof res.data.image === "string"
        ? String(res.data.image)
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
