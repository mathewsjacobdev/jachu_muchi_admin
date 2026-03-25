import { api } from "../client";

/**
 * Two operations (typical backend: GET to load, PUT to save — paths may match or differ).
 *
 * - **Load settings (page data):** `GET SETTINGS_GET_PATH`
 * - **Save settings:** `PUT SETTINGS_SAVE_PATH` with `Wp_number`, `Admin_email`, `Notification_emails`, and optionally `Current_password` + `New_password` when changing password
 *
 * Dummy JSONPlaceholder: still reads legacy `phone` / `email` / `username` (comma-separated emails).
 */
export const SETTINGS_GET_PATH = "/users/1";
export const SETTINGS_SAVE_PATH = "/users/1";

/** Payload shape for the save settings API. */
export interface SettingsSavePayload {
  Wp_number: string;
  Admin_email: string;
  /** One or more notification email addresses. */
  Notification_emails: string[];
  /** Present when changing password. */
  Current_password?: string;
  New_password?: string;
}

/** Contact/notification fields plus optional password change (passwords are never returned from GET). */
export type SaveSettingsInput = AdminSettings & {
  currentPassword?: string;
  newPassword?: string;
};

export interface AdminSettings {
  whatsAppNumber: string;
  adminEmail: string;
  notificationEmails: string[];
}

export const defaultAdminSettings: AdminSettings = {
  whatsAppNumber: "+91 98765 43210",
  adminEmail: "admin@opticadmin.com",
  notificationEmails: ["ops@opticadmin.com", "support@opticadmin.com"],
};

const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);

const isSettingsAggregate = (x: unknown): x is AdminSettings =>
  typeof x === "object" &&
  x !== null &&
  "whatsAppNumber" in x &&
  "adminEmail" in x &&
  Array.isArray((x as AdminSettings).notificationEmails);

const parseEmailsFromUsername = (username: unknown): string[] => {
  if (typeof username !== "string" || !username.trim()) {
    return [...defaultAdminSettings.notificationEmails];
  }
  const list = username
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : [...defaultAdminSettings.notificationEmails];
};

const notificationEmailsFromRow = (raw: Record<string, unknown>): string[] => {
  const fromBackend = raw.Notification_emails;
  if (Array.isArray(fromBackend)) {
    const list = (fromBackend as unknown[]).map(String).map((s) => s.trim()).filter(Boolean);
    if (list.length) return list;
  }
  if (Array.isArray(raw.notificationEmails)) {
    const list = (raw.notificationEmails as unknown[]).map(String).map((s) => s.trim()).filter(Boolean);
    if (list.length) return list;
  }
  return parseEmailsFromUsername(raw.username);
};

/** Map API row → UI (backend keys, camelCase aggregate, or dummy user row). */
export const rowToSettings = (raw: Record<string, unknown>): AdminSettings => ({
  whatsAppNumber: String(
    raw.Wp_number ??
      raw.whatsAppNumber ??
      raw.phone ??
      defaultAdminSettings.whatsAppNumber,
  ),
  adminEmail: String(
    raw.Admin_email ?? raw.adminEmail ?? raw.email ?? defaultAdminSettings.adminEmail,
  ),
  notificationEmails: notificationEmailsFromRow(raw),
});

export const toSettingsSavePayload = (payload: SaveSettingsInput): SettingsSavePayload => {
  const body: SettingsSavePayload = {
    Wp_number: payload.whatsAppNumber.trim(),
    Admin_email: payload.adminEmail.trim(),
    Notification_emails: payload.notificationEmails.map((e) => e.trim()).filter(Boolean),
  };
  const newPw = payload.newPassword?.trim() ?? "";
  if (newPw) {
    body.Current_password = payload.currentPassword ?? "";
    body.New_password = newPw;
  }
  return body;
};

/**
 * **API 1 — Load settings (page content).**
 * `GET SETTINGS_GET_PATH`
 */
export const getSettings = async (signal?: AbortSignal): Promise<AdminSettings> => {
  const res = await api.get<unknown>(
    SETTINGS_GET_PATH,
    signal ? { signal } : undefined,
  );
  const data = res.data;

  if (isSettingsAggregate(data)) {
    return data;
  }
  if (isRecord(data)) {
    return rowToSettings(data);
  }
  console.warn("[settings.service] Unrecognized GET settings shape; using defaults.", data);
  return { ...defaultAdminSettings };
};

/**
 * **API 2 — Save settings.**
 * `PUT SETTINGS_SAVE_PATH` — body includes optional `Current_password` / `New_password` when changing password.
 */
export const saveSettings = async (payload: SaveSettingsInput): Promise<void> => {
  await api.put(SETTINGS_SAVE_PATH, toSettingsSavePayload(payload));
};

/** @deprecated Use `saveSettings` — alias for the same PUT. */
export const updateSettings = saveSettings;
