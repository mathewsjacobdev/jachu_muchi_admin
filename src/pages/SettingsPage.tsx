import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

const SettingsPage = () => {
  const [whatsAppNumber, setWhatsAppNumber] = useState("+91 98765 43210");
  const [adminEmail, setAdminEmail] = useState("admin@opticadmin.com");
  const [notificationInput, setNotificationInput] = useState("");
  const [notificationEmails, setNotificationEmails] = useState<string[]>([
    "ops@opticadmin.com",
    "support@opticadmin.com",
  ]);
  const [saved, setSaved] = useState(false);

  const addNotificationEmail = () => {
    const value = notificationInput.trim();
    if (!value) return;
    setNotificationEmails((prev) => [...prev, value]);
    setNotificationInput("");
  };

  const removeNotificationEmail = (email: string) => {
    setNotificationEmails((prev) => prev.filter((x) => x !== email));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Settings"
        description="Configure core contact and notification preferences."
      />

      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/80 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl sm:p-4 md:p-5">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-white/50">WhatsApp Number</Label>
            <Input value={whatsAppNumber} onChange={(e) => setWhatsAppNumber(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/50">Admin Email</Label>
            <Input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
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
                <span key={email} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80">
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

          <div className="pt-2">
            <Button onClick={handleSave}>Save Settings</Button>
            {saved && <span className="ml-3 text-xs font-medium text-green-400">Saved locally.</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
