export interface Alumni {
  id: string;
  name: string;
  role: string;
  company: string;
  /** Data URL or empty — no image shown as placeholder in UI */
  image: string;
}

const STORAGE_KEY = "admin_alumni_v1";

const seedAlumni: Alumni[] = [
  {
    id: "1",
    name: "Aditi Rao",
    company: "Infosys",
    role: "Software Engineer",
    image: "",
  },
  {
    id: "2",
    name: "Vivek Mehta",
    company: "TCS",
    role: "Data Analyst",
    image: "",
  },
];

const normalizeAlumni = (raw: unknown): Alumni | null => {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  const id = typeof a.id === "string" ? a.id : "";
  if (!id) return null;
  return {
    id,
    name: typeof a.name === "string" ? a.name : "",
    role: typeof a.role === "string" ? a.role : "",
    company: typeof a.company === "string" ? a.company : "",
    image: typeof a.image === "string" ? a.image : "",
  };
};

const readAlumni = (): Alumni[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedAlumni));
    return seedAlumni;
  }
  try {
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedAlumni));
      return seedAlumni;
    }
    const normalized = parsed.map(normalizeAlumni).filter((x): x is Alumni => x !== null);
    if (normalized.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedAlumni));
      return seedAlumni;
    }
    const serialized = JSON.stringify(normalized);
    if (serialized !== raw) {
      localStorage.setItem(STORAGE_KEY, serialized);
    }
    return normalized;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedAlumni));
    return seedAlumni;
  }
};

const writeAlumni = (items: Alumni[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const listAlumni = (): Alumni[] => readAlumni();

export const getAlumniById = (id: string): Alumni | undefined =>
  readAlumni().find((item) => item.id === id);

export const upsertAlumni = (payload: Omit<Alumni, "id"> & { id?: string }): Alumni => {
  const items = readAlumni();
  if (payload.id) {
    const idx = items.findIndex((x) => x.id === payload.id);
    if (idx !== -1) {
      const updated: Alumni = { ...items[idx], ...payload, id: payload.id };
      items[idx] = updated;
      writeAlumni(items);
      return updated;
    }
  }
  const created: Alumni = {
    id: Date.now().toString(),
    name: payload.name,
    role: payload.role,
    company: payload.company,
    image: payload.image ?? "",
  };
  writeAlumni([created, ...items]);
  return created;
};

export const removeAlumni = (id: string) => {
  writeAlumni(readAlumni().filter((x) => x.id !== id));
};
