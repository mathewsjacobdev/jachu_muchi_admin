import { api } from "../client";
import type { BannerItem, BannerStatus } from "@/lib/banner-store";

export const BANNERS_LIST_PATH = "/photos";
export const bannerDetailPath = (id: string) => `/photos/${id}`;

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
  typeof (x as JsonPlaceholderPhoto).url === "string" &&
  "title" in x;

const isBannerRow = (x: unknown): x is BannerItem =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as BannerItem).id === "string" &&
  typeof (x as BannerItem).image === "string";

const mapPhotoToBanner = (p: JsonPlaceholderPhoto): BannerItem => ({
  id: String(p.id),
  title: p.title || `Banner ${p.id}`,
  image: p.url,
  status: p.id % 2 === 0 ? "Active" : "Inactive",
});

const rowToBanner = (raw: Record<string, unknown>): BannerItem => ({
  id: String(raw.id),
  title: String(raw.title ?? ""),
  image: String(raw.image ?? raw.url ?? ""),
  status: raw.status === "Active" || raw.status === "Inactive" ? raw.status : "Active",
});

export const getBanners = async (): Promise<BannerItem[]> => {
  const res = await api.get<unknown>(`${BANNERS_LIST_PATH}?_limit=24`);
  const data = res.data;
  if (!Array.isArray(data) || data.length === 0) return [];
  if (isBannerRow(data[0])) return data as BannerItem[];
  if (isJpPhoto(data[0])) {
    return (data as JsonPlaceholderPhoto[]).slice(0, 12).map(mapPhotoToBanner);
  }
  return data.map((item) => rowToBanner(item as Record<string, unknown>));
};

export const getBannerById = async (id: string): Promise<BannerItem | null> => {
  try {
    const res = await api.get<unknown>(bannerDetailPath(id));
    const row = res.data;
    if (row && typeof row === "object") {
      if (isBannerRow(row)) return row;
      if (isJpPhoto(row)) return mapPhotoToBanner(row);
      return rowToBanner(row as Record<string, unknown>);
    }
    return null;
  } catch {
    return null;
  }
};

const remoteImageUrl = (image: string): string => {
  if (image.startsWith("http")) return image;
  return `https://picsum.photos/seed/${Date.now()}/1200/500`;
};

export const createBanner = async (payload: Omit<BannerItem, "id">): Promise<BannerItem> => {
  const res = await api.post<Record<string, unknown>>(BANNERS_LIST_PATH, {
    albumId: 1,
    title: payload.title,
    url: remoteImageUrl(payload.image),
    thumbnailUrl: remoteImageUrl(payload.image),
    status: payload.status,
  });
  const id = res.data.id != null ? String(res.data.id) : Date.now().toString();
  return {
    id,
    title: payload.title,
    image: typeof res.data.url === "string" ? String(res.data.url) : remoteImageUrl(payload.image),
    status: payload.status,
  };
};

export const updateBannerApi = async (id: string, payload: Omit<BannerItem, "id">): Promise<void> => {
  await api.put(bannerDetailPath(id), {
    id: Number(id) || id,
    albumId: 1,
    title: payload.title,
    url: remoteImageUrl(payload.image),
    thumbnailUrl: remoteImageUrl(payload.image),
    status: payload.status,
  });
};

export const deleteBannerApi = async (id: string): Promise<void> => {
  await api.delete(bannerDetailPath(id));
};

export const toggleBannerStatusApi = async (
  id: string,
  current: BannerStatus,
): Promise<BannerStatus> => {
  const next: BannerStatus = current === "Active" ? "Inactive" : "Active";
  await api.patch(bannerDetailPath(id), { status: next });
  return next;
};
