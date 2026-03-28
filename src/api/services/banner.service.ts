import { api } from "../client";
import type { BannerItem, BannerStatus } from "@/lib/banner-store";

export const BANNERS_LIST_PATH = "/banners/all";
const BANNERS_BASE_PATH = "/banners";
export const bannerDetailPath = (id: string) => `${BANNERS_BASE_PATH}/${id}`;

type BannerApiRow = {
  _id: string;
  title: string;
  status?: BannerStatus | string;
  imageUrl?: string;
};

const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null;

const isBannerApiRow = (x: unknown): x is BannerApiRow =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as BannerApiRow)._id === "string" &&
  typeof (x as BannerApiRow).title === "string";

const isBannerRow = (x: unknown): x is BannerItem =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as BannerItem).id === "string" &&
  typeof (x as BannerItem).image === "string";

const normalizeStatus = (raw: unknown): BannerStatus =>
  raw === "Inactive" ? "Inactive" : "Active";

const mapApiRowToBanner = (row: BannerApiRow): BannerItem => ({
  id: row._id,
  title: row.title || "Untitled Banner",
  image: typeof row.imageUrl === "string" ? row.imageUrl : "",
  status: normalizeStatus(row.status),
});

const rowToBanner = (raw: Record<string, unknown>): BannerItem => ({
  id: String(raw.id ?? raw._id ?? ""),
  title: String(raw.title ?? ""),
  image: String(raw.image ?? raw.imageUrl ?? raw.url ?? ""),
  status: raw.status === "Active" || raw.status === "Inactive" ? raw.status : "Active",
});

export const getBanners = async (): Promise<BannerItem[]> => {
  const res = await api.get<unknown>(BANNERS_LIST_PATH);
  const data = res.data;
  const list = isRecord(data) && Array.isArray(data.data) ? data.data : data;
  if (!Array.isArray(list) || list.length === 0) return [];
  if (isBannerRow(list[0])) return list as BannerItem[];
  if (isBannerApiRow(list[0])) {
    return (list as BannerApiRow[]).map(mapApiRowToBanner);
  }
  return list
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => rowToBanner(item));
};

export const getBannerById = async (id: string): Promise<BannerItem | null> => {
  try {
    const res = await api.get<unknown>(bannerDetailPath(id));
    const row = isRecord(res.data) && isRecord(res.data.data) ? res.data.data : res.data;
    if (row && typeof row === "object") {
      if (isBannerRow(row)) return row;
      if (isBannerApiRow(row)) return mapApiRowToBanner(row);
      return rowToBanner(row as Record<string, unknown>);
    }
    return null;
  } catch {
    return null;
  }
};

export const createBanner = async (payload: Omit<BannerItem, "id">): Promise<BannerItem> => {
  const res = await api.post<Record<string, unknown>>(BANNERS_BASE_PATH, {
    title: payload.title,
    imageUrl: payload.image,
    status: payload.status,
  });
  const row = isRecord(res.data) && isRecord(res.data.data) ? res.data.data : res.data;
  const id =
    isRecord(row) && row._id != null
      ? String(row._id)
      : isRecord(row) && row.id != null
        ? String(row.id)
        : Date.now().toString();
  return {
    id,
    title: payload.title,
    image:
      isRecord(row) && typeof row.imageUrl === "string"
        ? String(row.imageUrl)
        : payload.image,
    status: payload.status,
  };
};

export const updateBannerApi = async (id: string, payload: Omit<BannerItem, "id">): Promise<void> => {
  await api.put(bannerDetailPath(id), {
    title: payload.title,
    imageUrl: payload.image,
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
  const existing = await getBannerById(id);
  await api.put(bannerDetailPath(id), {
    title: existing?.title ?? "",
    imageUrl: existing?.image ?? "",
    status: next,
  });
  return next;
};
