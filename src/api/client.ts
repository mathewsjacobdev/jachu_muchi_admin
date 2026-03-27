type ApiResponse<T> = {
  data: T;
};

/** Paste your backend base URL in `.env` as `VITE_API_URL` (no code changes elsewhere). */
const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "https://jsonplaceholder.typicode.com";

const REQUEST_TIMEOUT_MS = 10_000;

type ApiRequestErrorOptions = {
  status?: number;
  statusText?: string;
  responseBody?: unknown;
  isTimeout?: boolean;
  cause?: unknown;
};

export class ApiRequestError extends Error {
  status?: number;
  statusText?: string;
  responseBody?: unknown;
  isTimeout: boolean;
  cause?: unknown;

  constructor(message: string, options?: ApiRequestErrorOptions) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options?.status;
    this.statusText = options?.statusText;
    this.responseBody = options?.responseBody;
    this.isTimeout = Boolean(options?.isTimeout);
    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export const isApiRequestError = (error: unknown): error is ApiRequestError =>
  error instanceof ApiRequestError;

const tryGetAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const accessToken = window.localStorage.getItem("accessToken");
    if (accessToken && accessToken.trim()) return accessToken.trim();

    // Backward compatibility for older key naming.
    const token = window.localStorage.getItem("token");
    return token && token.trim() ? token.trim() : null;
  } catch {
    return null;
  }
};

const inferBodyMessage = (body: unknown): string | null => {
  if (typeof body === "string" && body.trim()) return body.trim();
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;
  if (typeof record.message === "string" && record.message.trim()) return record.message.trim();
  if (typeof record.error === "string" && record.error.trim()) return record.error.trim();
  if (typeof record.title === "string" && record.title.trim()) return record.title.trim();
  return null;
};

const parseResponseBody = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  if (!text.trim()) {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiRequestError("API response is not valid JSON");
  }
};

const request = async <T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const externalSignal = init?.signal;
  const onAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", onAbort, { once: true });
    }
  }

  try {
    const token = tryGetAuthToken();
    const isFormDataBody = typeof FormData !== "undefined" && init?.body instanceof FormData;
    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(isFormDataBody ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    };

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });

    const data = await parseResponseBody<T>(response);
    if (!response.ok) {
      const messageFromBody = inferBodyMessage(data);
      const message = messageFromBody
        ? `API request failed with status ${response.status}: ${messageFromBody}`
        : `API request failed with status ${response.status}`;
      throw new ApiRequestError(message, {
        status: response.status,
        statusText: response.statusText,
        responseBody: data,
      });
    }

    return { data };
  } catch (error) {
    if (isApiRequestError(error)) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      const timedOut = !externalSignal?.aborted;
      throw new ApiRequestError(
        timedOut
          ? `API request timed out after ${REQUEST_TIMEOUT_MS}ms`
          : "API request was aborted",
        { isTimeout: timedOut, cause: error },
      );
    }
    throw new ApiRequestError("Network request failed", { cause: error });
  } finally {
    clearTimeout(timeout);
    if (externalSignal) {
      externalSignal.removeEventListener("abort", onAbort);
    }
  }
};

export const api = {
  get: <T>(path: string, init?: Pick<RequestInit, "signal">) =>
    request<T>(path, { method: "GET", ...init }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "POST",
      body:
        typeof FormData !== "undefined" && body instanceof FormData
          ? body
          : JSON.stringify(body),
    }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "PUT",
      body:
        typeof FormData !== "undefined" && body instanceof FormData
          ? body
          : JSON.stringify(body),
    }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body:
        typeof FormData !== "undefined" && body instanceof FormData
          ? body
          : JSON.stringify(body),
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
