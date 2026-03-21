export interface Testimonial {
  id: string;
  name: string;
  message: string;
  course: string;
  image: string;
}

const STORAGE_KEY = "admin_testimonials_v1";

const seedTestimonials: Testimonial[] = [
  {
    id: "1",
    name: "Sneha Gupta",
    message: "Amazing support and excellent faculty guidance throughout the course.",
    course: "Digital Marketing",
    image: "",
  },
  {
    id: "2",
    name: "Rohit Sharma",
    message: "The curriculum was practical and helped me get job-ready quickly.",
    course: "Data Analytics",
    image: "",
  },
];

const readTestimonials = (): Testimonial[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedTestimonials));
    return seedTestimonials;
  }
  try {
    const parsed = JSON.parse(raw) as Testimonial[];
    return Array.isArray(parsed) ? parsed : seedTestimonials;
  } catch {
    return seedTestimonials;
  }
};

const writeTestimonials = (items: Testimonial[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const listTestimonials = (): Testimonial[] => readTestimonials();

export const getTestimonialById = (id: string): Testimonial | undefined =>
  readTestimonials().find((item) => item.id === id);

export const upsertTestimonial = (
  payload: Omit<Testimonial, "id"> & { id?: string },
): Testimonial => {
  const items = readTestimonials();
  if (payload.id) {
    const idx = items.findIndex((item) => item.id === payload.id);
    if (idx !== -1) {
      const updated: Testimonial = { ...items[idx], ...payload, id: payload.id };
      items[idx] = updated;
      writeTestimonials(items);
      return updated;
    }
  }
  const created: Testimonial = { id: Date.now().toString(), ...payload };
  writeTestimonials([created, ...items]);
  return created;
};

export const removeTestimonial = (id: string) => {
  writeTestimonials(readTestimonials().filter((item) => item.id !== id));
};
