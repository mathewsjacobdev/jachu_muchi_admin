import { api } from "../client";

export const createCourse = async (data: any) => {
  const res = await api.post<any>("/posts", data);
  return res.data;
};

export const updateCourse = async (id: string, data: any) => {
  const res = await api.put<any>(`/posts/${id}`, data);
  return res.data;
};

export const getCourse = async (id: string) => {
  const res = await api.get<any>(`/posts/${id}`);
  return res.data;
};

export const getCourses = async () => {
  const res = await api.get<any[]>("/posts");
  return res.data;
};

export const deleteCourse = async (id: string) => {
  const res = await api.delete<any>(`/posts/${id}`);
  return res.data;
};
