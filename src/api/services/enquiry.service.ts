import { api } from "../client";

/**
 * When your API is ready, you only need to:
 * 1) Paste base URL in `.env` → `VITE_API_URL=https://your-api.com`
 * 2) Set `ENQUIRIES_LIST_PATH` and `enquiryDetailPath` below to your routes (e.g. `/enquiries`, `/enquiries/:id`).
 * If GET list/detail already returns `Enquiry`-shaped JSON, mapping is skipped automatically.
 */
export const ENQUIRIES_LIST_PATH = "/posts";
export const enquiryDetailPath = (id: number) => `/posts/${id}`;

export type EnquiryStatus = "New" | "Contacted" | "Interested" | "Converted" | "Closed";

export type EnquiryType = "course" | "general";

export interface Enquiry {
  id: number;
  name: string;
  phone: string;
  email: string;
  course: string;
  message: string;
  date: string;
  status: EnquiryStatus;
  type: EnquiryType;
  notes?: string;
}

type JsonPlaceholderPost = {
  id: number;
  userId: number;
  title: string;
  body: string;
};

const isEnquiryRow = (x: unknown): x is Enquiry =>
  typeof x === "object" &&
  x !== null &&
  "id" in x &&
  "name" in x &&
  "status" in x &&
  typeof (x as Enquiry).name === "string";

const isPlaceholderPost = (x: unknown): x is JsonPlaceholderPost =>
  typeof x === "object" &&
  x !== null &&
  "title" in x &&
  "body" in x &&
  !("name" in x);

const DISPLAY_ROWS: Omit<Enquiry, "id">[] = [
  {
    name: "Aarav Sharma",
    phone: "+91 98123 45678",
    email: "aarav.sharma@example.com",
    course: "Premium Vision Plan",
    message:
      "I want details about premium lenses, delivery timelines, and available frame offers.",
    date: "19 Mar 2026",
    status: "New",
    type: "course",
  },
  {
    name: "Priya Nair",
    phone: "+91 99221 88441",
    email: "priya.nair@example.com",
    course: "Contact Lens Subscription",
    message:
      "Please share monthly and quarterly subscription plans with pricing and trial options.",
    date: "18 Mar 2026",
    status: "Contacted",
    type: "course",
  },
  {
    name: "Rahul Verma",
    phone: "+91 98700 10022",
    email: "rahul.verma@example.com",
    course: "Blue Light Protection Package",
    message:
      "Need recommendations for computer glasses and whether zero-power lenses are included.",
    date: "17 Mar 2026",
    status: "Interested",
    type: "general",
  },
  {
    name: "Neha Kapoor",
    phone: "+91 99887 55443",
    email: "neha.kapoor@example.com",
    course: "Progressive Lens Upgrade",
    message:
      "Interested in progressive lenses, looking for a quick consultation and best options.",
    date: "16 Mar 2026",
    status: "Converted",
    type: "course",
  },
  {
    name: "Vikram Singh",
    phone: "+91 98989 70707",
    email: "vikram.singh@example.com",
    course: "Eyeglass Repair Service",
    message:
      "Checking repair turnaround for broken frame hinge and lens alignment correction.",
    date: "15 Mar 2026",
    status: "Closed",
    type: "general",
  },
];

const mapPostIndexToRow = (post: JsonPlaceholderPost, index: number): Enquiry => {
  const base = DISPLAY_ROWS[index % DISPLAY_ROWS.length];
  return {
    id: post.id,
    ...base,
  };
};

const isEnquiryStatus = (x: unknown): x is EnquiryStatus =>
  x === "New" ||
  x === "Contacted" ||
  x === "Interested" ||
  x === "Converted" ||
  x === "Closed";

/** Best-effort mapping when the backend returns an unexpected but object-shaped list. */
const mapLooseRowToEnquiry = (raw: unknown, index: number): Enquiry | null => {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const idVal = r.id;
  const parsedId =
    typeof idVal === "number" && Number.isFinite(idVal) ? idVal : Number(idVal);
  const id = Number.isFinite(parsedId) ? parsedId : index + 1;
  const name = String(r.name ?? r.title ?? "").trim();
  if (!name) return null;
  const status: EnquiryStatus = isEnquiryStatus(r.status) ? r.status : "New";
  const type: EnquiryType = r.type === "general" ? "general" : "course";
  return {
    id,
    name,
    phone: String(r.phone ?? ""),
    email: String(r.email ?? ""),
    course: String(r.course ?? ""),
    message: String(r.message ?? r.body ?? ""),
    date: String(r.date ?? new Date().toISOString().split("T")[0]),
    status,
    type,
    notes: typeof r.notes === "string" ? r.notes : undefined,
  };
};

export const getEnquiries = async (): Promise<Enquiry[]> => {
  const res = await api.get<unknown>(ENQUIRIES_LIST_PATH);
  const data = res.data;
  if (!Array.isArray(data) || data.length === 0) return [];
  if (isEnquiryRow(data[0])) {
    return data as Enquiry[];
  }
  if (isPlaceholderPost(data[0])) {
    return (data as JsonPlaceholderPost[]).slice(0, 5).map((post, index) => mapPostIndexToRow(post, index));
  }
  console.warn(
    "[enquiry.service] Unrecognized enquiry list shape; attempting loose row mapping.",
    data[0],
  );
  const mapped = (data as unknown[])
    .map((row, i) => mapLooseRowToEnquiry(row, i))
    .filter((e): e is Enquiry => e !== null);
  if (mapped.length === 0) {
    console.warn("[enquiry.service] Loose mapping produced no rows.");
  }
  return mapped;
};

export const getEnquiryById = async (
  id: number,
  signal?: AbortSignal,
): Promise<Enquiry | null> => {
  const res = await api.get<unknown>(
    enquiryDetailPath(id),
    signal ? { signal } : undefined,
  );
  const row = res.data;
  if (isEnquiryRow(row)) {
    return row as Enquiry;
  }
  if (isPlaceholderPost(row)) {
    const index = Math.max(0, Math.min(id - 1, DISPLAY_ROWS.length - 1));
    return mapPostIndexToRow(row as JsonPlaceholderPost, index);
  }
  const loose = mapLooseRowToEnquiry(row, Math.max(0, id - 1));
  if (loose) {
    return { ...loose, id };
  }
  console.warn("[enquiry.service] Unrecognized enquiry detail shape.", row);
  return null;
};

export const deleteEnquiry = async (id: number): Promise<void> => {
  await api.delete(enquiryDetailPath(id));
};

export const updateEnquiryStatus = async (id: number, status: EnquiryStatus): Promise<void> => {
  await api.patch(enquiryDetailPath(id), { status });
};

export const updateEnquiryNotes = async (id: number, notes: string): Promise<void> => {
  await api.patch(enquiryDetailPath(id), { notes });
};
