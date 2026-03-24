import { api } from "../client";

export type GalleryCategory = "Campus" | "Labs" | "Events";

export interface GalleryItem {
  id: string;
  title: string;
  category: GalleryCategory;
  image: string;
}

const PHOTOS_PATH = "/photos";
export const galleryItemPath = (id: string) => `/photos/${id}`;

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

export const getGalleryItems = async (): Promise<GalleryItem[]> => {
  const res = await api.get<unknown>(`${PHOTOS_PATH}?_limit=30`);
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
  const albumId =
    payload.category === "Campus" ? 1 : payload.category === "Labs" ? 2 : 3;
  const res = await api.post<Record<string, unknown>>(PHOTOS_PATH, {
    albumId,
    title: payload.title,
    url: remoteUrl(payload.image),
    thumbnailUrl: remoteUrl(payload.image),
  });
  const id = res.data.id != null ? String(res.data.id) : Date.now().toString();
  return {
    id,
    title: payload.title,
    category: payload.category,
    image: typeof res.data.url === "string" ? String(res.data.url) : remoteUrl(payload.image),
  };
};

export const deleteGalleryItemApi = async (id: string): Promise<void> => {
  await api.delete(galleryItemPath(id));
};
