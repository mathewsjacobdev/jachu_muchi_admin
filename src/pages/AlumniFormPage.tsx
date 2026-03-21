import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alumni, getAlumniById, upsertAlumni } from "@/lib/alumni-store";

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
  const isEdit = Boolean(id);
  const existing = useMemo(() => (id ? getAlumniById(id) : undefined), [id]);

  const [form, setForm] = useState(emptyForm);
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    if (!existing) {
      navigate("/alumni");
      return;
    }
    setForm({ name: existing.name, company: existing.company, role: existing.role });
    setPreviewUrl(existing.image ?? "");
  }, [existing, isEdit, navigate]);

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
    upsertAlumni({
      id,
      name: form.name.trim(),
      role: form.role.trim(),
      company: form.company.trim(),
      image,
    });
    navigate("/alumni");
  };

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

      <form onSubmit={onSave} className="space-y-4 rounded-xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur-lg">
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
          <Button type="submit">{isEdit ? "Save Changes" : "Save Alumni"}</Button>
          <Button type="button" variant="outline" onClick={() => navigate("/alumni")}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default AlumniFormPage;
