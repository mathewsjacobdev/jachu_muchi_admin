import { api, isApiRequestError } from "../client";

export const LOGIN_PATH = "/auth/login";

export interface AuthUser {
  id: string;
  email: string;
}

export interface LoginResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

type LoginPayload = {
  email: string;
  password: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isAuthUser = (value: unknown): value is AuthUser =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.email === "string";

const isLoginResponse = (value: unknown): value is LoginResponse =>
  isRecord(value) &&
  typeof value.success === "boolean" &&
  typeof value.accessToken === "string" &&
  typeof value.refreshToken === "string" &&
  isAuthUser(value.user);

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const loginApi = async (payload: LoginPayload): Promise<LoginResponse> => {
  const body = {
    email: normalizeEmail(payload.email),
    password: payload.password,
  };

  try {
    const res = await api.post<unknown>(LOGIN_PATH, body);

    if (!isLoginResponse(res.data)) {
      throw new Error("Invalid response from server");
    }

    if (!res.data.success) {
      throw new Error("Invalid email or password");
    }

    return res.data;
  } catch (error) {
    if (isApiRequestError(error)) {
      // Show backend error message if available
      const message =
        (error.responseBody as any)?.message ||
        "Login failed. Please check your credentials.";
      throw new Error(message);
    }

    if (error instanceof Error) throw error;

    throw new Error("Something went wrong. Please try again.");
  }
};