import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";

import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Branch, BranchStatus } from "@/lib/branch-store";
import { createBranch, getBranchById, updateBranchApi } from "@/api/services/branch.service";

const emptyForm = {
  name: "",
  email: "",
  location: "",
  mapUrl: "",
  status: "Active" as BranchStatus,
};

const BranchFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(id);
  const stateBranch = (location.state as { branch?: Branch } | null)?.branch;
  const canPrefillFromState = Boolean(isEdit && id && stateBranch && stateBranch.id === id);

  const [form, setForm] = useState(emptyForm);
  const [phones, setPhones] = useState<string[]>([""]);
  const [phoneError, setPhoneError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [editLoading, setEditLoading] = useState(isEdit);

  useEffect(() => {
    if (canPrefillFromState && stateBranch) {
      setForm({
        name: stateBranch.name,
        email: stateBranch.email,
        location: stateBranch.location,
        mapUrl: stateBranch.mapUrl,
        status: stateBranch.status,
      });
      setPhones(stateBranch.phones.length > 0 ? [...stateBranch.phones] : [""]);
      setEditLoading(false);
      return;
    }

    if (!isEdit || !id) return;

    const load = async () => {
      setEditLoading(true);
      setLoadError("");
      try {
        const existing = await getBranchById(id);
        if (!existing) {
          navigate("/branches");
          return;
        }
        setForm({
          name: existing.name,
          email: existing.email,
          location: existing.location,
          mapUrl: existing.mapUrl,
          status: existing.status,
        });
        setPhones(existing.phones.length > 0 ? [...existing.phones] : [""]);
      } catch (e) {
        console.error(e);
        setLoadError("Could not load branch.");
      } finally {
        setEditLoading(false);
      }
    };

    void load();
  }, [canPrefillFromState, id, isEdit, navigate, stateBranch]);

  const updatePhone = (index: number, value: string) => {
    setPhones((prev) => prev.map((p, i) => (i === index ? value : p)));
    if (phoneError) setPhoneError("");
  };

  const removePhone = (index: number) => {
    setPhones((prev) => prev.filter((_, i) => i !== index));
    if (phoneError) setPhoneError("");
  };

  const addPhone = () => {
    setPhones((prev) => [...prev, ""]);
    if (phoneError) setPhoneError("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const normalizedPhones = phones.map((p) => p.trim()).filter(Boolean);
    if (normalizedPhones.length === 0) {
      setPhoneError("At least one phone number is required.");
      return;
    }
    setPhoneError("");

    const payload = {
      name: form.name.trim(),
      phones: normalizedPhones,
      email: form.email.trim(),
      location: form.location.trim(),
      mapUrl: form.mapUrl.trim(),
      status: form.status,
    };

    try {
      if (isEdit && id) {
        await updateBranchApi(id, payload);
      } else {
        await createBranch(payload);
      }
      navigate("/branches");
    } catch (err) {
      console.error(err);
    }
  };

  if (isEdit && editLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading branch…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <p className="text-sm text-red-400">{loadError}</p>
        <Button type="button" variant="outline" onClick={() => navigate("/branches")}>
          Back to branches
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title={isEdit ? "Edit Branch" : "Add Branch"}
        description={
          isEdit
            ? "Update branch details and map link."
            : "Create a new branch location."
        }
        action={(
          <Link
            to="/branches"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-gray-200 transition-all duration-200 hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
            Branches
          </Link>
        )}
      />

      <form onSubmit={handleSave}>
        <div className="space-y-4 rounded-xl border border-white/10 bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 shadow-lg">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-200">Branch Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Branch name"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-200">Phone numbers</Label>
                <div className="space-y-2">
                  {phones.map((phone, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={phone}
                        onChange={(e) => updatePhone(index, e.target.value)}
                        placeholder="Phone number"
                        className="flex-1"
                        aria-label={`Phone number ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0 border-white/20 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                        onClick={() => removePhone(index)}
                        aria-label={`Remove phone ${index + 1}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                {phoneError ? (
                  <p className="text-sm text-red-400">{phoneError}</p>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-white/20 bg-white/5 text-gray-200 hover:bg-white/10"
                  onClick={addPhone}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Phone Number
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-200">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Email"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-200">Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  placeholder="Address or area"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-200">Map URL</Label>
                <Input
                  value={form.mapUrl}
                  onChange={(e) => setForm((p) => ({ ...p, mapUrl: e.target.value }))}
                  placeholder="https://maps.google.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-200">Status</Label>
                <Select value={form.status} onValueChange={(value) => setForm((p) => ({ ...p, status: value as BranchStatus }))}>
                  <SelectTrigger className="h-10 w-full rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-lg hover:bg-white/10 data-[placeholder]:text-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border border-white/10 bg-slate-900 text-white">
                    <SelectItem className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value="Active">Active</SelectItem>
                    <SelectItem className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            {isEdit ? "Save Changes" : "Save Branch"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/branches")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BranchFormPage;
