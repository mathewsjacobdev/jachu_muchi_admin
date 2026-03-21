export type BannerStatus = "Active" | "Inactive";

export interface BannerItem {
  id: string;
  title: string;
  image: string;
  status: BannerStatus;
}

const STORAGE_KEY = "admin_banners_v1";

const seedBanners: BannerItem[] = [
  {
    id: "1",
    title: "Summer Admission Open",
    image: "https://images.unsplash.com/photo-1498079022511-d15614cb1c02?w=1200&h=500&fit=crop",
    status: "Active",
  },
  {
    id: "2",
    title: "Campus Tour Event",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&h=500&fit=crop",
    status: "Inactive",
  },
];

const readBanners = (): BannerItem[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedBanners));
    return seedBanners;
  }
  try {
    const parsed = JSON.parse(raw) as BannerItem[];
    return Array.isArray(parsed) ? parsed : seedBanners;
  } catch {
    return seedBanners;
  }
};

const writeBanners = (items: BannerItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const listBanners = (): BannerItem[] => readBanners();

export const getBannerById = (id: string): BannerItem | undefined =>
  readBanners().find((banner) => banner.id === id);

export const addBanner = (payload: Omit<BannerItem, "id">): BannerItem => {
  const items = readBanners();
  const created: BannerItem = { id: Date.now().toString(), ...payload };
  writeBanners([created, ...items]);
  return created;
};

export const updateBanner = (
  id: string,
  payload: Omit<BannerItem, "id">,
): BannerItem | undefined => {
  const items = readBanners();
  const idx = items.findIndex((banner) => banner.id === id);
  if (idx === -1) return undefined;
  const updated: BannerItem = { id, ...payload };
  items[idx] = updated;
  writeBanners(items);
  return updated;
};

export const deleteBanner = (id: string) => {
  writeBanners(readBanners().filter((banner) => banner.id !== id));
};

export const toggleBannerStatus = (id: string) => {
  const next = readBanners().map((banner) =>
    banner.id === id
      ? { ...banner, status: banner.status === "Active" ? "Inactive" : "Active" }
      : banner,
  );
  writeBanners(next);
};
