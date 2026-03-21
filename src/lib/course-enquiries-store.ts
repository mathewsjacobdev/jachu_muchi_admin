export type LeadStatus = "New" | "Contacted" | "Interested" | "Converted" | "Closed";

export interface CourseLead {
  id: number;
  name: string;
  phone: string;
  email: string;
  course: string;
  location: string;
  stream: string;
  date: string;
  status: LeadStatus;
}

const STORAGE_KEY = "admin_course_enquiries_v1";

const seedLeads: CourseLead[] = [
  {
    id: 1,
    name: "Aarav Sharma",
    phone: "+91 98123 45678",
    email: "aarav.sharma@example.com",
    course: "Optometry Basics",
    location: "Main Campus",
    stream: "Science",
    date: "19 Mar 2026",
    status: "New",
  },
  {
    id: 2,
    name: "Priya Nair",
    phone: "+91 99221 88441",
    email: "priya.nair@example.com",
    course: "Advanced Contact Lens Program",
    location: "North Campus",
    stream: "Biology",
    date: "18 Mar 2026",
    status: "Contacted",
  },
  {
    id: 3,
    name: "Rahul Verma",
    phone: "+91 98700 10022",
    email: "rahul.verma@example.com",
    course: "Vision Therapy Certification",
    location: "Main Campus",
    stream: "Arts",
    date: "17 Mar 2026",
    status: "Interested",
  },
];

const readLeads = (): CourseLead[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedLeads));
    return seedLeads;
  }
  try {
    const parsed = JSON.parse(raw) as CourseLead[];
    return Array.isArray(parsed) ? parsed : seedLeads;
  } catch {
    return seedLeads;
  }
};

const writeLeads = (leads: CourseLead[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
};

export const listCourseLeads = (): CourseLead[] => readLeads();

export const getCourseLeadById = (id: number): CourseLead | undefined =>
  readLeads().find((lead) => lead.id === id);

export const setCourseLeadStatus = (id: number, status: LeadStatus) => {
  const leads = readLeads().map((lead) => (lead.id === id ? { ...lead, status } : lead));
  writeLeads(leads);
};

export const removeCourseLead = (id: number) => {
  writeLeads(readLeads().filter((lead) => lead.id !== id));
};
