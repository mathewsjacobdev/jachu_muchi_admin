import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2, Plus, X } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultAdminSettings, getSettings, saveSettings } from "@/api/services/settings.service";

const SAVED_TOAST_MS = 1600;

const PASSWORD_PLACEHOLDER_MASK = "••••••••";
const inputRowClass = "flex min-w-0 flex-1 items-center gap-2";

type PasswordReveal = { new: boolean; confirm: boolean };
const initialReveal: PasswordReveal = { new: false, confirm: false };

type FieldErrors = Partial<{
  whatsAppNumber: string;
  adminEmail: string;
  notificationEmails: string;
  newPassword: string;
  confirmPassword: string;
  general: string;
}>;

const normalizePhone = (value: string) => value.replace(/[\s-]/g, "");
const phoneRegex = /^\+?\d{7,15}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSettings(params: {
  whatsAppNumber: string;
  adminEmail: string;
  notificationEmails: string[];
  editPasswordMode: boolean;
  newPassword: string;
  confirmPassword: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  const nextPhone = params.whatsAppNumber.trim();
  if (!nextPhone) errors.whatsAppNumber = "WhatsApp number is required";
  else if (!phoneRegex.test(normalizePhone(nextPhone)))
    errors.whatsAppNumber = "Enter a valid phone number";

  const nextEmail = params.adminEmail.trim();
  if (!nextEmail) errors.adminEmail = "Admin email is required";
  else if (!emailRegex.test(nextEmail)) errors.adminEmail = "Enter a valid email";

  const nextNotifications = params.notificationEmails.map((e) => e.trim()).filter(Boolean);
  if (!nextNotifications.length) {
    errors.notificationEmails = "At least 1 notification email is required";
  } else if (nextNotifications.some((e) => !emailRegex.test(e))) {
    errors.notificationEmails = "All notification emails must be valid";
  }

  // Only validate password if user entered a new password (or confirmation) while editing.
  if (params.editPasswordMode) {
    const nextNew = params.newPassword.trim();
    const nextConfirm = params.confirmPassword.trim();
    const wantsChange = Boolean(nextNew || nextConfirm);
    if (wantsChange) {
      if (!nextNew) errors.newPassword = "New password is required";
      else if (nextNew.length < 8) errors.newPassword = "New password must be at least 8 characters";
      if (!nextConfirm) errors.confirmPassword = "Confirm password is required";
      else if (nextNew && nextConfirm !== nextNew)
        errors.confirmPassword = "New password and confirmation do not match";
    }
  }

  return errors;
}

const SettingsPage = () => {
  const [whatsAppNumber, setWhatsAppNumber] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [notificationInput, setNotificationInput] = useState("");
  const [notificationEmails, setNotificationEmails] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [editPasswordMode, setEditPasswordMode] = useState(false);
  const [showPassword, setShowPassword] = useState<PasswordReveal>(initialReveal);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saveError, setSaveError] = useState("");

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetPasswordUi = useCallback(() => {
    setNewPassword("");
    setConfirmPassword("");
    setEditPasswordMode(false);
    setShowPassword(initialReveal);
  }, []);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
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
    const value = notificationInput.trim();
    if (!value) return;
    setNotificationEmails((prev) => [...prev, value]);
    setNotificationInput("");
    setFieldErrors((e) => ({ ...e, notificationEmails: undefined }));
  }, [notificationInput]);

  const removeNotificationEmail = useCallback((email: string) => {
    setNotificationEmails((prev) => prev.filter((x) => x !== email));
    setFieldErrors((e) => ({ ...e, notificationEmails: undefined }));
  }, []);

  const toggleReveal = useCallback((key: keyof PasswordReveal) => {
    setShowPassword((s) => ({ ...s, [key]: !s[key] }));
  }, []);

  const beginPasswordEdit = useCallback(() => {
    setSaveError("");
    setFieldErrors((e) => ({
      ...e,
      newPassword: undefined,
      confirmPassword: undefined,
    }));
    setNewPassword("");
    setConfirmPassword("");
    setEditPasswordMode(true);
    setShowPassword(initialReveal);
  }, []);

  const cancelPasswordEdit = useCallback(() => {
    setSaveError("");
    setFieldErrors((e) => ({
      ...e,
      newPassword: undefined,
      confirmPassword: undefined,
    }));
    resetPasswordUi();
  }, [resetPasswordUi]);

  const handleSave = useCallback(async () => {
    setSaveError("");
    setFieldErrors({});

    const errors = validateSettings({
      whatsAppNumber,
      adminEmail,
      notificationEmails,
      editPasswordMode,
      newPassword,
      confirmPassword,
    });

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    try {
      await saveSettings({
        whatsAppNumber: whatsAppNumber.trim(),
        adminEmail: adminEmail.trim(),
        notificationEmails: notificationEmails.map((e) => e.trim()).filter(Boolean),
        ...(editPasswordMode && newPassword.trim()
          ? {
              newPassword: newPassword.trim(),
              confirmNewPassword: confirmPassword.trim(),
            }
          : {}),
      });

      resetPasswordUi();
      setSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), SAVED_TOAST_MS);
    } catch (e) {
      console.error(e);
      setSaveError("Could not save settings. Check your new password and try again.");
    } finally {
      setSaving(false);
    }
  }, [
    adminEmail,
    confirmPassword,
    editPasswordMode,
    newPassword,
    notificationEmails,
    resetPasswordUi,
    whatsAppNumber,
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

      {loadError ? <p className="text-sm text-amber-400">{loadError} Showing defaults.</p> : null}

      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/80 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl sm:p-4 md:p-5">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-white/50">WhatsApp Number</Label>
            <Input value={whatsAppNumber} onChange={(e) => setWhatsAppNumber(e.target.value)} />
            {fieldErrors.whatsAppNumber ? (
              <p className="text-sm text-amber-400" role="alert">
                {fieldErrors.whatsAppNumber}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/50">Admin Email</Label>
            <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
            {fieldErrors.adminEmail ? (
              <p className="text-sm text-amber-400" role="alert">
                {fieldErrors.adminEmail}
              </p>
            ) : null}
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
                    aria-label={`Remove ${email}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            {fieldErrors.notificationEmails ? (
              <p className="text-sm text-amber-400" role="alert">
                {fieldErrors.notificationEmails}
              </p>
            ) : null}
          </div>

          <div className="border-t border-white/10 pt-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-white/90">Password</p>
              <p className="text-xs text-white/45 mt-0.5">
                Click Edit to set a new password.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/50">Password</Label>
              <div className={inputRowClass}>
                {!editPasswordMode ? (
                  <Input className="min-w-0 flex-1" value={PASSWORD_PLACEHOLDER_MASK} readOnly />
                ) : null}
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
                <div className="space-y-1.5">
                  <Label className="text-white/50">New password</Label>
                  <div className="flex min-w-0 items-center gap-2">
                    <Input
                      className="min-w-0 flex-1"
                      type={showPassword.new ? "text" : "password"}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      aria-label={showPassword.new ? "Hide new password" : "Show new password"}
                      aria-pressed={showPassword.new}
                      onClick={() => toggleReveal("new")}
                    >
                      {showPassword.new ? (
                        <EyeOff className="h-4 w-4" aria-hidden />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden />
                      )}
                    </Button>
                  </div>
                  {fieldErrors.newPassword ? (
                    <p className="text-sm text-amber-400" role="alert">
                      {fieldErrors.newPassword}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/50">Confirm new password</Label>
                  <div className="flex min-w-0 items-center gap-2">
                    <Input
                      className="min-w-0 flex-1"
                      type={showPassword.confirm ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      aria-label={
                        showPassword.confirm ? "Hide confirm password" : "Show confirm password"
                      }
                      aria-pressed={showPassword.confirm}
                      onClick={() => toggleReveal("confirm")}
                    >
                      {showPassword.confirm ? (
                        <EyeOff className="h-4 w-4" aria-hidden />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden />
                      )}
                    </Button>
                  </div>
                  {fieldErrors.confirmPassword ? (
                    <p className="text-sm text-amber-400" role="alert">
                      {fieldErrors.confirmPassword}
                    </p>
                  ) : null}
                </div>
              </div>
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


