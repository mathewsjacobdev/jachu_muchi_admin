export type BranchStatus = "Active" | "Inactive";

export interface Branch {
  id: string;
  name: string;
  phones: string[];
  email: string;
  location: string;
  mapUrl: string;
  status: BranchStatus;
}

const STORAGE_KEY = "admin_branches_v1";

const seedBranches: Branch[] = [
  {
    id: "1",
    name: "Main Campus Branch",
    phones: ["+91 98765 43210", "+91 98765 11111"],
    email: "main@opticadmin.com",
    location: "MG Road, Bengaluru",
    mapUrl: "https://maps.google.com",
    status: "Active",
  },
  {
    id: "2",
    name: "North Branch",
    phones: ["+91 98989 12345"],
    email: "north@opticadmin.com",
    location: "Hebbal, Bengaluru",
    mapUrl: "https://maps.google.com",
    status: "Inactive",
  },
];

/** Legacy persisted shape may include `phone` instead of `phones`. */
const normalizeBranch = (raw: unknown): Branch | null => {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const id = typeof b.id === "string" ? b.id : "";
  if (!id) return null;

  let phones: string[] = [];
  if (Array.isArray(b.phones) && b.phones.every((p) => typeof p === "string")) {
    phones = b.phones as string[];
  } else if (typeof b.phone === "string" && b.phone.trim()) {
    phones = [b.phone.trim()];
  }

  const name = typeof b.name === "string" ? b.name : "";
  const email = typeof b.email === "string" ? b.email : "";
  const location = typeof b.location === "string" ? b.location : "";
  const mapUrl = typeof b.mapUrl === "string" ? b.mapUrl : "";
  const status =
    b.status === "Active" || b.status === "Inactive" ? b.status : "Active";

  return { id, name, phones, email, location, mapUrl, status };
};

const readBranches = (): Branch[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedBranches));
    return seedBranches;
  }
  try {
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedBranches));
      return seedBranches;
    }
    const normalized = parsed
      .map(normalizeBranch)
      .filter((b): b is Branch => b !== null);
    const needsReseed = normalized.length === 0;
    if (needsReseed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedBranches));
      return seedBranches;
    }
    // Persist migration from legacy `phone` → `phones`
    const serialized = JSON.stringify(normalized);
    if (serialized !== raw) {
      localStorage.setItem(STORAGE_KEY, serialized);
    }
    return normalized;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedBranches));
    return seedBranches;
  }
};

const writeBranches = (branches: Branch[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(branches));
};

export const listBranches = (): Branch[] => readBranches();

export const getBranchById = (id: string): Branch | undefined =>
  readBranches().find((b) => b.id === id);

export const upsertBranch = (
  payload: Omit<Branch, "id"> & { id?: string },
): Branch => {
  const branches = readBranches();
  if (payload.id) {
    const idx = branches.findIndex((b) => b.id === payload.id);
    if (idx !== -1) {
      const updated: Branch = { ...branches[idx], ...payload, id: payload.id };
      branches[idx] = updated;
      writeBranches(branches);
      return updated;
    }
  }
  const created: Branch = {
    id: Date.now().toString(),
    name: payload.name,
    phones: payload.phones,
    email: payload.email,
    location: payload.location,
    mapUrl: payload.mapUrl,
    status: payload.status,
  };
  writeBranches([created, ...branches]);
  return created;
};

export const removeBranch = (id: string) => {
  writeBranches(readBranches().filter((b) => b.id !== id));
};
