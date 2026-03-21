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

      <form onSubmit={onSave} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="space-y-5 rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-base font-semibold text-gray-100">Testimonial Details</h2>

            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-12 rounded-lg border-white/20 bg-white/10 focus-visible:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Course</Label>
              <Input
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                className="h-12 rounded-lg border-white/20 bg-white/10 focus-visible:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Message</Label>
              <Textarea
                rows={7}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="rounded-lg border-white/20 bg-white/10 focus-visible:border-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">{isEdit ? "Save Changes" : "Save Testimonial"}</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/testimonials")}>
                Cancel
              </Button>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-base font-semibold text-gray-100">Profile Image</h2>
            <p className="mt-1 text-xs text-gray-400">Upload an optional profile image for this testimonial.</p>

            <label
              htmlFor="testimonial-image-upload"
              className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/5 p-4 text-center transition-all duration-200 hover:border-blue-500/60 hover:bg-white/10"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="h-52 w-full rounded-lg object-cover" />
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/70">
                    <ImagePlus className="h-6 w-6" />
                  </div>
                  <p className="text-sm text-gray-300">Click to upload</p>
                </>
              )}
            </label>
            <Input
              id="testimonial-image-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onImageChange}
            />
            {imageError ? <p className="mt-2 text-sm text-red-400">{imageError}</p> : null}
          </div>
        </aside>
      </form>
    </div>
  );
};

export default TestimonialFormPage;
