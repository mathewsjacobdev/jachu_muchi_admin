import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2, Plus, X } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  defaultAdminSettings,
  getSettings,
  saveSettings,
} from "@/api/services/settings.service";

const SAVED_TOAST_MS = 1600;

/** Shown when password is not being edited (API never returns the real password). */
const PASSWORD_PLACEHOLDER_MASK = "••••••••";

const inputRowClass = "flex min-w-0 flex-1 items-center gap-2";

type PasswordReveal = { main: boolean; new: boolean; confirm: boolean };

const initialReveal: PasswordReveal = { main: false, new: false, confirm: false };

function validatePasswordChange(
  editPasswordMode: boolean,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): string | null {
  const nextNew = newPassword.trim();
  const nextConfirm = confirmPassword.trim();
  const changing = editPasswordMode && (nextNew !== "" || nextConfirm !== "");
  if (!changing) return null;

  const nextCurrent = currentPassword.trim();
  if (!nextCurrent) return "Enter your current password.";
  if (!nextNew) return "Enter a new password.";
  if (nextNew.length < 8) return "New password must be at least 8 characters.";
  if (nextNew !== nextConfirm) return "New password and confirmation do not match.";
  return null;
}

type PasswordInputRowProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  toggleAriaLabel: string;
  autoComplete?: string;
  readOnly?: boolean;
};

function PasswordInputRow({
  id,
  label,
  value,
  onChange,
  visible,
  onToggleVisible,
  toggleAriaLabel,
  autoComplete = "off",
  readOnly = false,
}: PasswordInputRowProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-white/50" htmlFor={id}>
        {label}
      </Label>
      <div className={inputRowClass}>
        <Input
          id={id}
          className="min-w-0 flex-1"
          readOnly={readOnly}
          autoComplete={autoComplete}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          aria-label={toggleAriaLabel}
          aria-pressed={visible}
          onClick={onToggleVisible}
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </Button>
      </div>
    </div>
  );
}

const SettingsPage = () => {
  const [whatsAppNumber, setWhatsAppNumber] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [notificationInput, setNotificationInput] = useState("");
  const [notificationEmails, setNotificationEmails] = useState<string[]>([]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [editPasswordMode, setEditPasswordMode] = useState(false);
  const [showPassword, setShowPassword] = useState<PasswordReveal>(initialReveal);

  const [passwordFormError, setPasswordFormError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPasswordUi = useCallback(() => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setEditPasswordMode(false);
    setShowPassword(initialReveal);
  }, []);

  const beginPasswordEdit = useCallback(() => {
    setPasswordFormError("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setEditPasswordMode(true);
    setShowPassword(initialReveal);
  }, []);

  const cancelPasswordEdit = useCallback(() => {
    setPasswordFormError("");
    clearPasswordUi();
  }, [clearPasswordUi]);

  useEffect(() => () => {
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const data = await getSettings(controller.signal);
        if (cancelled) return;
        setWhatsAppNumber(data.whatsAppNumber);
        setAdminEmail(data.adminEmail);
        setNotificationEmails(data.notificationEmails);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        if (!cancelled) {
          console.error(e);
          setLoadError("Could not load settings.");
          setWhatsAppNumber(defaultAdminSettings.whatsAppNumber);
          setAdminEmail(defaultAdminSettings.adminEmail);
          setNotificationEmails([...defaultAdminSettings.notificationEmails]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const addNotificationEmail = useCallback(() => {
    setNotificationInput((cur) => {
      const value = cur.trim();
      if (!value) return cur;
      setNotificationEmails((prev) => [...prev, value]);
      return "";
    });
  }, []);

  const removeNotificationEmail = useCallback((email: string) => {
    setNotificationEmails((prev) => prev.filter((x) => x !== email));
  }, []);

  const toggleReveal = useCallback((key: keyof PasswordReveal) => {
    setShowPassword((s) => ({ ...s, [key]: !s[key] }));
  }, []);

  const handleSave = useCallback(async () => {
    setPasswordFormError("");
    setSaveError("");

    const err = validatePasswordChange(
      editPasswordMode,
      currentPassword,
      newPassword,
      confirmPassword,
    );
    if (err) {
      setPasswordFormError(err);
      return;
    }

    const nextNew = newPassword.trim();
    const nextConfirm = confirmPassword.trim();
    const changingPassword =
      editPasswordMode && (nextNew !== "" || nextConfirm !== "");

    setSaving(true);
    try {
      await saveSettings({
        whatsAppNumber: whatsAppNumber.trim(),
        adminEmail: adminEmail.trim(),
        notificationEmails,
        ...(changingPassword
          ? { currentPassword: currentPassword.trim(), newPassword: nextNew }
          : {}),
      });
      clearPasswordUi();
      setSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), SAVED_TOAST_MS);
    } catch (e) {
      console.error(e);
      setSaveError("Could not save settings. Check your password and try again.");
    } finally {
      setSaving(false);
    }
  }, [
    editPasswordMode,
    currentPassword,
    newPassword,
    confirmPassword,
    whatsAppNumber,
    adminEmail,
    notificationEmails,
    clearPasswordUi,
  ]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
        <p className="text-sm">Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Settings"
        description="Load settings with one request; save with another."
      />

      {loadError ? (
        <p className="text-sm text-amber-400">{loadError} Showing defaults.</p>
      ) : null}

      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/80 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl sm:p-4 md:p-5">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-white/50">WhatsApp Number</Label>
            <Input value={whatsAppNumber} onChange={(e) => setWhatsAppNumber(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/50">Admin Email</Label>
            <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label className="text-white/50">Notification Emails</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={notificationInput}
                onChange={(e) => setNotificationInput(e.target.value)}
                placeholder="Add notification email..."
              />
              <Button type="button" variant="outline" onClick={addNotificationEmail}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {notificationEmails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => removeNotificationEmail(email)}
                    className="rounded-full p-0.5 transition-colors hover:bg-white/10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4 border-t border-white/10 pt-4">
            <div>
              <p className="text-sm font-medium text-white/90">Password</p>
              <p className="text-xs text-white/45 mt-0.5">
                Use Edit to set a new password. Your current password is never shown.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/50" htmlFor="settings-current-password">
                {editPasswordMode ? "Current password" : "Password"}
              </Label>
              <div className={inputRowClass}>
                <Input
                  id="settings-current-password"
                  className="min-w-0 flex-1"
                  readOnly={!editPasswordMode}
                  autoComplete={editPasswordMode ? "current-password" : "off"}
                  type={showPassword.main ? "text" : "password"}
                  value={editPasswordMode ? currentPassword : PASSWORD_PLACEHOLDER_MASK}
                  onChange={
                    editPasswordMode ? (e) => setCurrentPassword(e.target.value) : undefined
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  aria-label={showPassword.main ? "Hide password" : "Show password"}
                  aria-pressed={showPassword.main}
                  onClick={() => toggleReveal("main")}
                >
                  {showPassword.main ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => (editPasswordMode ? cancelPasswordEdit() : beginPasswordEdit())}
                >
                  {editPasswordMode ? "Cancel" : "Edit"}
                </Button>
              </div>
            </div>

            {editPasswordMode ? (
              <div className="space-y-4 pl-0 sm:border-l sm:border-white/10 sm:pl-4">
                <PasswordInputRow
                  id="settings-new-password"
                  label="New password"
                  value={newPassword}
                  onChange={setNewPassword}
                  visible={showPassword.new}
                  onToggleVisible={() => toggleReveal("new")}
                  toggleAriaLabel={showPassword.new ? "Hide new password" : "Show new password"}
                  autoComplete="new-password"
                />
                <PasswordInputRow
                  id="settings-confirm-password"
                  label="Confirm new password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  visible={showPassword.confirm}
                  onToggleVisible={() => toggleReveal("confirm")}
                  toggleAriaLabel={
                    showPassword.confirm ? "Hide confirm password" : "Show confirm password"
                  }
                  autoComplete="new-password"
                />
              </div>
            ) : null}

            {passwordFormError ? (
              <p className="text-sm text-amber-400" role="alert">
                {passwordFormError}
              </p>
            ) : null}
          </div>

          <div className="pt-2">
            {saveError ? (
              <p className="mb-2 text-sm text-amber-400" role="alert">
                {saveError}
              </p>
            ) : null}
            <Button type="button" disabled={saving} onClick={() => void handleSave()}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Settings
            </Button>
            {saved ? (
              <span className="ml-3 text-xs font-medium text-green-400" aria-live="polite">
                Saved.
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
