import { api } from "../client";
import type { Alumni } from "@/lib/alumni-store";

/** Placeholder: reuse `/users`; set paths when your API is ready. */
export const ALUMNI_LIST_PATH = "/users";
export const alumniDetailPath = (id: string) => `/users/${id}`;

type JsonPlaceholderUser = {
  id: number;
  name: string;
  email?: string;
  company?: { name?: string; catchPhrase?: string };
};

const isAlumniRow = (x: unknown): x is Alumni =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as Alumni).id === "string" &&
  "company" in x &&
  typeof (x as Alumni).company === "string" &&
  !("phones" in x);

const isJpUser = (x: unknown): x is JsonPlaceholderUser =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as JsonPlaceholderUser).id === "number" &&
  typeof (x as JsonPlaceholderUser).name === "string";

const mapJpUserToAlumni = (u: JsonPlaceholderUser): Alumni => ({
  id: String(u.id),
  name: u.name,
  role: u.company?.catchPhrase?.slice(0, 80) ?? "Alumni",
  company: u.company?.name ?? "—",
  image: "",
});

const rowToAlumni = (raw: Record<string, unknown>): Alumni => ({
  id: String(raw.id),
  name: String(raw.name ?? ""),
  role: String(raw.role ?? ""),
  company: String(raw.company ?? ""),
  image: typeof raw.image === "string" ? raw.image : "",
});

export const getAlumniList = async (): Promise<Alumni[]> => {
  const res = await api.get<unknown>(ALUMNI_LIST_PATH);
  const data = res.data;
  if (!Array.isArray(data) || data.length === 0) return [];
  if (isAlumniRow(data[0])) return data as Alumni[];
  if (isJpUser(data[0])) {
    return (data as JsonPlaceholderUser[]).slice(0, 12).map(mapJpUserToAlumni);
  }
  return data.map((item) => rowToAlumni(item as Record<string, unknown>));
};

export const getAlumniById = async (id: string): Promise<Alumni | null> => {
  try {
    const res = await api.get<unknown>(alumniDetailPath(id));
    const row = res.data;
    if (row && typeof row === "object") {
      if (isAlumniRow(row)) return row;
      if (isJpUser(row)) return mapJpUserToAlumni(row);
      return rowToAlumni(row as Record<string, unknown>);
    }
    return null;
  } catch {
    return null;
  }
};

export const createAlumni = async (payload: Omit<Alumni, "id">): Promise<Alumni> => {
  const res = await api.post<Record<string, unknown>>(ALUMNI_LIST_PATH, {
    name: payload.name,
    email: "alumni@example.com",
    username: payload.role.slice(0, 15) || "alumni",
    company: { name: payload.company, catchPhrase: payload.role },
    image: payload.image,
  });
  const id = res.data.id != null ? String(res.data.id) : Date.now().toString();
  return { id, ...payload };
};

export const updateAlumniApi = async (id: string, payload: Omit<Alumni, "id">): Promise<void> => {
  await api.put(alumniDetailPath(id), {
    id: Number(id) || id,
    name: payload.name,
    email: "alumni@example.com",
    company: { name: payload.company, catchPhrase: payload.role },
    image: payload.image,
  });
};

export const deleteAlumniApi = async (id: string): Promise<void> => {
  await api.delete(alumniDetailPath(id));
};
