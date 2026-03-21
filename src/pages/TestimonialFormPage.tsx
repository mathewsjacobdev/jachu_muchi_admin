import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getTestimonialById, upsertTestimonial } from "@/lib/testimonial-store";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const emptyForm = {
  name: "",
  course: "",
  message: "",
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) ?? "");
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

const TestimonialFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const existing = useMemo(() => (id ? getTestimonialById(id) : undefined), [id]);

  const [form, setForm] = useState(emptyForm);
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    if (!existing) {
      navigate("/testimonials");
      return;
    }
    setForm({ name: existing.name, course: existing.course, message: existing.message });
    setPreviewUrl(existing.image);
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
    if (!form.name.trim() || !form.message.trim()) return;
    const image = imageFile ? await fileToDataUrl(imageFile) : previewUrl.trim();
    upsertTestimonial({
      id,
      name: form.name.trim(),
      course: form.course.trim(),
      message: form.message.trim(),
      image,
    });
    navigate("/testimonials");
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title={isEdit ? "Edit Testimonial" : "Add Testimonial"}
        description={isEdit ? "Update testimonial details." : "Create a new testimonial."}
        action={(
          <Link
            to="/testimonials"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-gray-200 transition-all duration-200 hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
            Testimonials
          </Link>
        )}
      />

      <form onSubmit={onSave} className="space-y-4 rounded-xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur-lg">
        <div className="space-y-2">
          <Label className="text-gray-200">Image</Label>
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
          <Label className="text-white/80">Course</Label>
          <Input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/80">Message</Label>
          <Textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </div>

        <div className="flex gap-2">
          <Button type="submit">{isEdit ? "Save Changes" : "Save Testimonial"}</Button>
          <Button type="button" variant="outline" onClick={() => navigate("/testimonials")}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default TestimonialFormPage;
