import { api } from "../client";

/**
 * Dummy API support:
 * JSONPlaceholder does not have `/settings`, so we use a stable existing resource.
 * Swap paths when your real backend is ready.
 */
export const SETTINGS_GET_PATH = "/users/1";
export const SETTINGS_SAVE_PATH = "/users/1";

export interface AdminSettings {
  whatsAppNumber: string;
  adminEmail: string;
  notificationEmails: string[];
}

export type SaveSettingsInput = AdminSettings & {
  currentPassword?: string;
  newPassword?: string;
};

export interface SettingsSavePayload {
  whatsAppNumber: string;
  adminEmail: string;
  notificationEmails: string[];
  currentPassword?: string;
  newPassword?: string;
}

export const defaultAdminSettings: AdminSettings = {
  whatsAppNumber: "+91 98765 43210",
  adminEmail: "admin@opticadmin.com",
  notificationEmails: ["ops@opticadmin.com", "support@opticadmin.com"],
};

const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map(String)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

const parseEmailsFromUsername = (username: unknown): string[] => {
  if (typeof username !== "string") return [];
  const list = username
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : [];
};

const parseSettingsResponse = (raw: Record<string, unknown>): AdminSettings => {
  // 1) Real backend (camelCase)
  if (
    "whatsAppNumber" in raw &&
    "adminEmail" in raw &&
    Array.isArray(raw.notificationEmails)
  ) {
    return {
      whatsAppNumber: String(raw.whatsAppNumber),
      adminEmail: String(raw.adminEmail),
      notificationEmails: (raw.notificationEmails as unknown[]).map(String),
    };
  }

  // 2) Real backend (snake_case)
  if (
    "Wp_number" in raw &&
    "Admin_email" in raw &&
    Array.isArray(raw.Notification_emails)
  ) {
    return {
      whatsAppNumber: String(raw.Wp_number),
      adminEmail: String(raw.Admin_email),
      notificationEmails: toStringArray(raw.Notification_emails),
    };
  }

  // 3) JSONPlaceholder dummy (phone/email/username)
  const notificationEmails =
    toStringArray(raw.notificationEmails).length
      ? toStringArray(raw.notificationEmails)
      : toStringArray(raw.Notification_emails).length
        ? toStringArray(raw.Notification_emails)
        : parseEmailsFromUsername(raw.username);

  return {
    whatsAppNumber: String(raw.phone ?? raw.Wp_number ?? raw.whatsAppNumber ?? defaultAdminSettings.whatsAppNumber),
    adminEmail: String(raw.email ?? raw.Admin_email ?? raw.adminEmail ?? defaultAdminSettings.adminEmail),
    notificationEmails: notificationEmails.length
      ? notificationEmails
      : [...defaultAdminSettings.notificationEmails],
  };
};

/**
 * Convert UI (camelCase) input → backend (snake_case) payload.
 * Also include JSONPlaceholder fields so dummy PUT works smoothly.
 */
export const toSettingsSavePayload = (
  payload: SaveSettingsInput,
  includeDummyFields: boolean,
): SettingsSavePayload & Record<string, unknown> => {
  const notificationEmails = payload.notificationEmails.map((e) => e.trim()).filter(Boolean);

  const body: SettingsSavePayload & Record<string, unknown> = {
    whatsAppNumber: payload.whatsAppNumber.trim(),
    adminEmail: payload.adminEmail.trim(),
    notificationEmails,
  };

  if (payload.currentPassword?.trim()) body.currentPassword = payload.currentPassword.trim();
  if (payload.newPassword?.trim()) body.newPassword = payload.newPassword.trim();

  // JSONPlaceholder dummy: keep compatibility so next GET shows updates.
  if (includeDummyFields) {
    body.phone = payload.whatsAppNumber.trim();
    body.email = payload.adminEmail.trim();
    body.username = notificationEmails.join(",");
  }

  return body;
};

export const getSettings = async (signal?: AbortSignal): Promise<AdminSettings> => {
  const res = await api.get<unknown>(
    SETTINGS_GET_PATH,
    signal ? { signal } : undefined,
  );

  const data = res.data;
  if (isRecord(data)) return parseSettingsResponse(data);

  console.warn(
    "[settings.service] Unexpected GET settings response shape. Using defaults.",
    data,
  );
  return { ...defaultAdminSettings };
};

export const saveSettings = async (payload: SaveSettingsInput): Promise<void> => {
  // Detect dummy vs real backend by looking at GET shape.
  // - Real backend GET: { Wp_number, Admin_email, Notification_emails }
  // - JSONPlaceholder dummy GET: { phone, email, username, ... }
  const current = await api.get<unknown>(SETTINGS_GET_PATH);
  const raw = current.data;

  const looksLikeRealBackend =
    isRecord(raw) &&
    "Wp_number" in raw &&
    "Admin_email" in raw &&
    Array.isArray((raw as Record<string, unknown>).Notification_emails);

  const includeDummyFields = !looksLikeRealBackend;

  await api.put(SETTINGS_SAVE_PATH, toSettingsSavePayload(payload, includeDummyFields));
};

/** @deprecated Use `saveSettings` */
export const updateSettings = saveSettings;
