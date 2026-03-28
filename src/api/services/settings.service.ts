import { api } from "../client";

export const SETTINGS_GET_PATH = "/settings";
export const SETTINGS_SAVE_PATH = "/settings";

export interface AdminSettings {
  whatsAppNumber: string;
  adminEmail: string;
  notificationEmails: string[];
}

export type SaveSettingsInput = AdminSettings & {
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
};

export interface SettingsSavePayload {
  whatsAppNumber: string;
  adminEmail: string;
  notificationEmails: string[];
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
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

  // Fallback: attempt to adapt slightly different shapes, otherwise use defaults.
  const notificationEmails =
    toStringArray(raw.notificationEmails).length > 0
      ? toStringArray(raw.notificationEmails)
      : parseEmailsFromUsername(raw.username);

  return {
    whatsAppNumber: String(raw.whatsAppNumber ?? defaultAdminSettings.whatsAppNumber),
    adminEmail: String(raw.adminEmail ?? defaultAdminSettings.adminEmail),
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
): SettingsSavePayload & Record<string, unknown> => {
  const notificationEmails = payload.notificationEmails.map((e) => e.trim()).filter(Boolean);

  const body: SettingsSavePayload & Record<string, unknown> = {
    whatsAppNumber: payload.whatsAppNumber.trim(),
    adminEmail: payload.adminEmail.trim(),
    notificationEmails,
  };

  if (payload.currentPassword?.trim()) body.currentPassword = payload.currentPassword.trim();
  if (payload.newPassword?.trim()) body.newPassword = payload.newPassword.trim();
  if (payload.confirmNewPassword?.trim()) body.confirmNewPassword = payload.confirmNewPassword.trim();

  return body;
};

export const getSettings = async (signal?: AbortSignal): Promise<AdminSettings> => {
  const res = await api.get<unknown>(
    SETTINGS_GET_PATH,
    signal ? { signal } : undefined,
  );

  const root = res.data;
  const data =
    isRecord(root) && isRecord(root.data)
      ? root.data
      : root;
  if (isRecord(data)) return parseSettingsResponse(data);

  console.warn(
    "[settings.service] Unexpected GET settings response shape. Using defaults.",
    data,
  );
  return { ...defaultAdminSettings };
};

export const saveSettings = async (payload: SaveSettingsInput): Promise<void> => {
  await api.put(SETTINGS_SAVE_PATH, toSettingsSavePayload(payload));
};

/** @deprecated Use `saveSettings` */
export const updateSettings = saveSettings;
