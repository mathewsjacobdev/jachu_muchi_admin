import { api, isApiRequestError } from "../client";
import type { NewsItem } from "@/types";

export const NEWS_LIST_PATH = "/articles/all";
export const ARTICLES_FILTER_PATH = "/articles/filter";
export const NEWS_STATS_PATH = "/articles/stats";
/** POST create — backend may keep singular; change if your API uses POST /articles */
const ARTICLE_CREATE_PATH = "/article";
/** GET/PUT/DELETE single article — backend uses plural /articles/:id */
export const newsDetailPath = (id: string) => `/articles/${id}`;
const articleAltDetailPath = (id: string) => `/article/${id}`;

type ArticleStatus = NewsItem["status"];

type ArticleApiRow = {
  _id: string;
  title?: string;
  description?: string;
  articleDate?: string;
  createdAt?: string;
  status?: ArticleStatus | string;
  imageUrl?: string;
};

/** Matches backend `filterArticles` `sortBy` (default `createdAt`). */
export type ArticleFilterSortBy = "createdAt" | "title" | "articleDate";

export type ArticleFilterOrder = "asc" | "desc";

export type ArticlesFilterParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: ArticleStatus | "All";
  type?: string;
  sortBy?: ArticleFilterSortBy;
  order?: ArticleFilterOrder;
};

export type ArticlesFilterResult = {
  data: NewsItem[];
  total: number;
  page: number;
  pages: number;
  limit: number;
};

type ArticleStatsApiResponse = {
  success: true;
  data: { total: number; published: number; draft: number };
};

const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);

const isArticleApiRow = (x: unknown): x is ArticleApiRow =>
  isRecord(x) && typeof x._id === "string";

const normalizeStatus = (raw: unknown): ArticleStatus =>
  raw === "Published" ? "Published" : "Draft";

const toDateInputValue = (raw: unknown): string => {
  if (typeof raw !== "string" || !raw.trim()) return new Date().toISOString().split("T")[0];
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return d.toISOString().split("T")[0];
  return raw.trim();
};

const mapApiArticleToNewsItem = (row: ArticleApiRow): NewsItem => ({
  id: row._id,
  title: typeof row.title === "string" ? row.title : "",
  description: typeof row.description === "string" ? row.description : "",
  image: typeof row.imageUrl === "string" ? row.imageUrl : "",
  date: toDateInputValue(row.articleDate ?? row.createdAt),
  status: normalizeStatus(row.status),
});

export const rowToNewsItem = (raw: Record<string, unknown>): NewsItem => ({
  id: String(raw.id ?? raw._id ?? ""),
  title: String(raw.title ?? ""),
  description: String(raw.description ?? raw.body ?? raw.content ?? ""),
  image: typeof raw.image === "string" ? raw.image : typeof raw.imageUrl === "string" ? raw.imageUrl : "",
  date: typeof raw.date === "string"
    ? raw.date
    : typeof raw.articleDate === "string"
      ? toDateInputValue(raw.articleDate)
      : typeof raw.createdAt === "string"
        ? toDateInputValue(raw.createdAt)
        : new Date().toISOString().split("T")[0],
  status: raw.status === "Published" || raw.status === "Draft" ? raw.status : "Draft",
});

const isLikelyNewsItemRow = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" &&
  x !== null &&
  "title" in x &&
  ("description" in x || "body" in x || "date" in x);

const mapFilterRowToNewsItem = (row: unknown): NewsItem => {
  if (isArticleApiRow(row)) return mapApiArticleToNewsItem(row);
  if (isRecord(row)) return rowToNewsItem(row);
  return {
    id: "",
    title: "",
    description: "",
    image: "",
    date: new Date().toISOString().split("T")[0],
    status: "Draft",
  };
};

const buildArticlesFilterQuery = (params: ArticlesFilterParams): string => {
  const q = new URLSearchParams();
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  q.set("page", String(page));
  q.set("limit", String(limit));
  const search = params.search?.trim();
  if (search) q.set("search", search);
  if (params.status && params.status !== "All") q.set("status", params.status);
  const type = params.type?.trim();
  if (type) q.set("type", type);
  q.set("sortBy", (params.sortBy ?? "createdAt").trim());
  q.set("order", params.order === "asc" ? "asc" : "desc");
  return `${ARTICLES_FILTER_PATH}?${q.toString()}`;
};

export const getNewsFilter = async (
  params: ArticlesFilterParams,
  signal?: AbortSignal,
): Promise<ArticlesFilterResult> => {
  const path = buildArticlesFilterQuery(params);
  const res = await api.get<unknown>(path, signal ? { signal } : undefined);
  const root = res.data;
  const limit = params.limit ?? 10;
  const fallbackPage = params.page ?? 1;

  if (!isRecord(root)) {
    return { data: [], total: 0, page: fallbackPage, pages: 1, limit };
  }

  const rawList = Array.isArray(root.data) ? root.data : [];
  const pag = isRecord(root.pagination) ? root.pagination : null;
  const total =
    pag && typeof pag.total === "number" && Number.isFinite(pag.total)
      ? pag.total
      : typeof root.total === "number" && Number.isFinite(root.total)
        ? root.total
        : 0;
  const page =
    pag && typeof pag.page === "number" && Number.isFinite(pag.page)
      ? pag.page
      : typeof root.page === "number" && Number.isFinite(root.page)
        ? root.page
        : fallbackPage;
  let pages =
    pag && typeof pag.pages === "number" && Number.isFinite(pag.pages)
      ? pag.pages
      : typeof root.pages === "number" && Number.isFinite(root.pages)
        ? root.pages
        : Math.max(1, Math.ceil(total / limit));

  const data = rawList.map(mapFilterRowToNewsItem);
  if (pages < 1) pages = 1;

  return { data, total, page, pages, limit };
};

export const getNews = async (): Promise<NewsItem[]> => {
  const res = await api.get<unknown>(NEWS_LIST_PATH);
  const root = res.data;
  const list = isRecord(root) && Array.isArray(root.data) ? root.data : root;
  if (!Array.isArray(list) || list.length === 0) return [];
  const first = list[0];
  if (isArticleApiRow(first)) {
    return (list as ArticleApiRow[]).map(mapApiArticleToNewsItem);
  }
  if (isLikelyNewsItemRow(first)) {
    return list.map((item) => rowToNewsItem(item as Record<string, unknown>));
  }
  return list
    .filter((x): x is Record<string, unknown> => isRecord(x))
    .map((x) => rowToNewsItem(x));
};

export const getNewsById = async (id: string): Promise<NewsItem | null> => {
  try {
    let res;
    try {
      res = await api.get<unknown>(newsDetailPath(id));
    } catch (error) {
      if (isApiRequestError(error) && error.status === 404) {
        res = await api.get<unknown>(articleAltDetailPath(id));
      } else {
        throw error;
      }
    }

    const root = res.data;
    const row = isRecord(root) && isRecord(root.data) ? root.data : root;
    if (row && typeof row === "object") {
      if (isArticleApiRow(row)) return mapApiArticleToNewsItem(row);
      return rowToNewsItem(row as Record<string, unknown>);
    }
    return null;
  } catch {
    return null;
  }
};

export const createNews = async (payload: Omit<NewsItem, "id">): Promise<NewsItem> => {
  const res = await api.post<Record<string, unknown>>(ARTICLE_CREATE_PATH, {
    title: payload.title,
    description: payload.description,
    articleDate: payload.date,
    status: payload.status,
    imageUrl: payload.image,
  });
  const root = res.data ?? {};
  const row = isRecord(root) && isRecord(root.data) ? (root.data as Record<string, unknown>) : (root as Record<string, unknown>);
  const newId =
    row._id != null ? String(row._id) : row.id != null ? String(row.id) : Date.now().toString();
  return {
    id: newId,
    title: typeof row.title === "string" ? row.title : payload.title,
    description: typeof row.description === "string" ? row.description : payload.description,
    image: typeof row.imageUrl === "string" ? row.imageUrl : payload.image,
    date: typeof row.articleDate === "string" ? toDateInputValue(row.articleDate) : payload.date,
    status: normalizeStatus(row.status ?? payload.status),
  };
};

export const updateNews = async (id: string, payload: Omit<NewsItem, "id">): Promise<NewsItem> => {
  const res = await api.put<Record<string, unknown>>(newsDetailPath(id), {
    title: payload.title,
    description: payload.description,
    articleDate: payload.date,
    status: payload.status,
    imageUrl: payload.image,
  });
  const root = res.data ?? {};
  const data = isRecord(root) && isRecord(root.data) ? (root.data as Record<string, unknown>) : (root as Record<string, unknown>);
  return {
    id: String(data._id ?? data.id ?? id),
    title: String(data.title ?? payload.title),
    description: String(data.description ?? payload.description),
    image: typeof data.imageUrl === "string" ? data.imageUrl : payload.image,
    date: typeof data.articleDate === "string" ? toDateInputValue(data.articleDate) : payload.date,
    status: normalizeStatus(data.status ?? payload.status),
  };
};

export const deleteNews = async (id: string): Promise<void> => {
  await api.delete(newsDetailPath(id));
};

export const getNewsStats = async (): Promise<{ total: number; published: number; draft: number } | null> => {
  try {
    const res = await api.get<ArticleStatsApiResponse | unknown>(NEWS_STATS_PATH);
    const root = res.data;
    if (isRecord(root) && isRecord(root.data)) {
      const d = root.data as Record<string, unknown>;
      const total = Number(d.total);
      const published = Number(d.published);
      const draft = Number(d.draft);
      return {
        total: Number.isFinite(total) ? total : 0,
        published: Number.isFinite(published) ? published : 0,
        draft: Number.isFinite(draft) ? draft : 0,
      };
    }
    return null;
  } catch {
    return null;
  }
};
