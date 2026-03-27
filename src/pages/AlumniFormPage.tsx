import { useEffect, useState } from "react";
import { ArrowLeft, ImagePlus, Loader2 } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Alumni } from "@/lib/alumni-store";
import { createAlumni, getAlumniById, updateAlumniApi } from "@/api/services/alumni.service";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const emptyForm: Omit<Alumni, "id" | "image"> = {
  name: "",
  company: "",
  role: "",
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) ?? "");
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

const AlumniFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(id);
  const stateAlumni = (location.state as { alumni?: Alumni } | null)?.alumni;
  const canPrefillFromState = Boolean(isEdit && id && stateAlumni && stateAlumni.id === id);

  const [form, setForm] = useState(emptyForm);
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState("");
  const [editLoading, setEditLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (canPrefillFromState && stateAlumni) {
      setForm({ name: stateAlumni.name, company: stateAlumni.company, role: stateAlumni.role });
      setPreviewUrl(stateAlumni.image ?? "");
      setImageFile(null);
      setEditLoading(false);
      return;
    }

    if (!isEdit || !id) return;

    const load = async () => {
      setEditLoading(true);
      setLoadError("");
      try {
        const existing = await getAlumniById(id);
        if (!existing) {
          navigate("/alumni");
          return;
        }
        setForm({ name: existing.name, company: existing.company, role: existing.role });
        setPreviewUrl(existing.image ?? "");
      } catch (e) {
        console.error(e);
        setLoadError("Could not load alumni.");
      } finally {
        setEditLoading(false);
      }
    };

    void load();
  }, [canPrefillFromState, id, isEdit, navigate, stateAlumni]);

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image must be 5MB or smaller.");
      return;
    }
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const image = imageFile ? await fileToDataUrl(imageFile) : previewUrl.trim();
    setSaving(true);
    try {
      if (isEdit && id) {
        await updateAlumniApi(id, {
          name: form.name.trim(),
          role: form.role.trim(),
          company: form.company.trim(),
          image,
        });
      } else {
        await createAlumni({
          name: form.name.trim(),
          role: form.role.trim(),
          company: form.company.trim(),
          image,
        });
      }
      navigate("/alumni");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && editLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <p className="text-sm text-red-400">{loadError}</p>
        <Button type="button" variant="outline" onClick={() => navigate("/alumni")}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title={isEdit ? "Edit Alumni" : "Add Alumni"}
        description={isEdit ? "Update alumni details." : "Create a new alumni profile."}
        action={(
          <Link
            to="/alumni"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-gray-200 transition-all duration-200 hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
            Alumni
          </Link>
        )}
      />

      <form onSubmit={(e) => void onSave(e)} className="space-y-4 rounded-xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur-lg">
        <div className="space-y-2">
          <Label className="text-gray-200">Profile photo</Label>
          <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="h-44 w-full object-cover" />
            ) : (
              <div className="flex h-44 w-full items-center justify-center text-white/40">
                <ImagePlus className="h-10 w-10" />
              </div>
            )}
          </div>
          <Input type="file" accept="image/*" onChange={onImageChange} />
          {imageError ? <p className="text-sm text-red-400">{imageError}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/80">Name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/80">Role</Label>
          <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/80">Company</Label>
          <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isEdit ? "Save Changes" : "Save Alumni"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/alumni")}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default AlumniFormPage;
