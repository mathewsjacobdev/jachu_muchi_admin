import { MOCK_PRODUCTS } from "@/lib/mock-data";

export type CourseStatus = "Active" | "Inactive";

export interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  eligibility?: string;
  image?: string;
  status: CourseStatus;
  createdAt: string;
}

const STORAGE_KEY = "admin_courses_v1";

const seedCourses = (): Course[] =>
  MOCK_PRODUCTS.map((item) => ({
    id: item.id,
    title: item.name,
    description: item.category,
    duration: "12 Weeks",
    eligibility: "",
    image: item.image,
    status: item.stock > 0 ? "Active" : "Inactive",
    createdAt: item.createdAt,
  }));

const readCourses = (): Course[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedCourses();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as Course[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCourses = (courses: Course[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
};

export const listCourses = (): Course[] => readCourses();

export const getCourseById = (id: string): Course | undefined =>
  readCourses().find((course) => course.id === id);

export const upsertCourse = (
  payload: Omit<Course, "id" | "createdAt" | "status"> & {
    id?: string;
    status?: CourseStatus;
  },
): Course => {
  const courses = readCourses();
  const now = new Date().toISOString().split("T")[0];

  if (payload.id) {
    const index = courses.findIndex((course) => course.id === payload.id);
    if (index !== -1) {
      const updated: Course = {
        ...courses[index],
        ...payload,
        status: payload.status ?? courses[index].status,
      };
      courses[index] = updated;
      writeCourses(courses);
      return updated;
    }
  }

  const created: Course = {
    id: Date.now().toString(),
    createdAt: now,
    status: payload.status ?? "Active",
    ...payload,
  };
  courses.unshift(created);
  writeCourses(courses);
  return created;
};

export const removeCourse = (id: string) => {
  writeCourses(readCourses().filter((course) => course.id !== id));
};

export const setCourseStatus = (id: string, status: CourseStatus) => {
  const courses = readCourses().map((course) =>
    course.id === id ? { ...course, status } : course,
  );
  writeCourses(courses);
};

