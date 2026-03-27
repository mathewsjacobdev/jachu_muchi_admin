import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Loader2, X } from "lucide-react";

import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createCourse,
  getCourse,
  updateCourse,
  type CourseListItem,
  type CoursePayload,
} from "@/api/services/course.service";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const emptyForm = {
  courseName: "",
  type: "",
  duration: "",
  eligibility: "",
  keyDetails: "",
};

const courseTypeOptions = [
  "Long-term Fellowship",
  "Short-term Training",
  "Fellowship",
  "Observational Training",
  "Degree Course",
  "Postgraduate Medical Training",
] as const;

type EditLocationState = {
  course?: CourseListItem;
};

const CourseFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(id);
  const stateCourse = (location.state as EditLocationState | null)?.course;
  const canPrefillFromState = Boolean(isEdit && id && stateCourse && stateCourse.id === id);

  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [imageError, setImageError] = useState("");
  const [editLoading, setEditLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (canPrefillFromState && stateCourse) {
      setForm({
        courseName: stateCourse.courseName,
        type: stateCourse.type,
        duration: stateCourse.duration,
        eligibility: stateCourse.eligibility,
        keyDetails: stateCourse.keyDetails,
      });
      setPreviewUrl(stateCourse.image || "");
      setImageFile(null);
      setEditLoading(false);
      return;
    }

    if (!isEdit || !id) return;

    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      setEditLoading(true);
      try {
        const data = await getCourse(id, controller.signal);
        if (cancelled) return;
        setForm({
          courseName: data.courseName,
          type: data.type,
          duration: data.duration,
          eligibility: data.eligibility,
          keyDetails: data.keyDetails,
        });
        setPreviewUrl(data.imageUrl ?? "");
        setImageFile(null);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        if (!cancelled) console.error(e);
      } finally {
        if (!cancelled) setEditLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [canPrefillFromState, id, isEdit, stateCourse]);

  useEffect(() => () => {
    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  const applyImageFile = useCallback((file: File | null) => {
    setImageError("");
    if (!file) {
      setImageFile(null);
      setPreviewUrl("");
      return;
    }
    if (!file.type.startsWith("image/")) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image must be 5MB or smaller.");
      return;
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    applyImageFile(event.target.files?.[0] ?? null);
  };

  const handleImageDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    applyImageFile(event.dataTransfer.files?.[0] ?? null);
  };

  const handleImageDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isEdit && !id) return;

      const payload: CoursePayload = {
        courseName: form.courseName,
        keyDetails: form.keyDetails,
        duration: form.duration,
        eligibility: form.eligibility,
        type: form.type,
        imageUrl: previewUrl,
        imageFile,
      };

      setSubmitting(true);
      try {
        if (isEdit && id) {
          await updateCourse(id, payload);
        } else {
          await createCourse(payload);
        }
        navigate("/products");
      } catch (error) {
        console.error(error);
      } finally {
        setSubmitting(false);
      }
    },
    [form.courseName, form.duration, form.eligibility, form.keyDetails, form.type, id, imageFile, isEdit, navigate, previewUrl],
  );

  const durationLabel = useMemo(
    () => form.duration.trim() || "Duration",
    [form.duration],
  );

  if (isEdit && editLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading course…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title={isEdit ? "Edit Course" : "Add Course"}
        description={isEdit ? "Update course information." : "Create a new course."}
        action={(
          <Link
            to="/products"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-gray-200 transition-all duration-200 hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
            Courses
          </Link>
        )}
      />

      <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="space-y-5 rounded-xl border border-white/10 bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 shadow-lg">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-200">Course Name</Label>
                <Input
                  value={form.courseName}
                  onChange={(e) => setForm((prev) => ({ ...prev, courseName: e.target.value }))}
                  placeholder="Enter course name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-200">Type</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-gray-200 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" className="bg-slate-900 text-gray-300">Select course type</option>
                  {courseTypeOptions.map((option) => (
                    <option key={option} value={option} className="bg-slate-900 text-gray-200">
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-200">Duration</Label>
                <Input
                  value={form.duration}
                  onChange={(e) => setForm((prev) => ({ ...prev, duration: e.target.value }))}
                  placeholder="e.g. 12 Weeks"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-200">Key Details</Label>
              <Textarea
                value={form.keyDetails}
                onChange={(e) => setForm((prev) => ({ ...prev, keyDetails: e.target.value }))}
                placeholder="Write key details"
                rows={5}
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-200">Eligibility</Label>
              <Input
                value={form.eligibility}
                onChange={(e) => setForm((prev) => ({ ...prev, eligibility: e.target.value }))}
                placeholder="Who can enroll?"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-200">Course Image (optional)</Label>
              <label
                htmlFor="course-image-upload"
                onDragOver={handleImageDragOver}
                onDrop={handleImageDrop}
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/20 p-6 text-center transition-all duration-200 hover:border-blue-400"
              >
                <p className="text-sm font-medium text-gray-200">
                  Click or Drag & Drop to Upload Image
                </p>
                <p className="mt-1 text-xs text-gray-500">PNG, JPG up to 5MB</p>
                {imageError ? <p className="mt-2 text-xs text-red-300">{imageError}</p> : null}
                {imageFile ? <p className="mt-2 text-xs text-gray-400">{imageFile.name}</p> : null}
              </label>
              <input
                id="course-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              {previewUrl ? (
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="mt-3 block w-full overflow-hidden rounded-lg ring-1 ring-white/10 transition hover:ring-white/20"
                >
                  <img
                    src={previewUrl}
                    alt="Upload preview"
                    className="max-h-36 w-full cursor-zoom-in object-cover"
                  />
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-blue-700 hover:shadow-xl"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isEdit ? "Save Changes" : "Save Course"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/products")}>
              Cancel
            </Button>
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-4 space-y-3 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-lg">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Live preview
            </p>
            <div className="overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-[#0f172a]/80 to-[#1e293b]/80 shadow-inner">
              {previewUrl ? (
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="block w-full"
                >
                  <img
                    src={previewUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-40 w-full cursor-zoom-in object-cover"
                  />
                </button>
              ) : (
                <div className="flex h-40 w-full flex-col items-center justify-center gap-1 bg-white/[0.04] text-center text-xs text-gray-500">
                  <span>No image</span>
                  <span className="text-[11px] text-gray-600">Add an image to preview</span>
                </div>
              )}
              <div className="space-y-2 p-4">
                <p className="line-clamp-2 text-base font-semibold leading-snug text-white">
                  {form.courseName || "Course name"}
                </p>
                <p className="line-clamp-2 text-sm leading-relaxed text-gray-400">
                  {form.keyDetails || "Key details will appear here as you type."}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-1 text-xs font-medium text-blue-200">
                    <Clock className="h-3 w-3 shrink-0 opacity-80" />
                    {durationLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </form>

      {isPreviewOpen && previewUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setIsPreviewOpen(false)}
          role="presentation"
        >
          <button
            type="button"
            onClick={() => setIsPreviewOpen(false)}
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-200 hover:bg-white/20"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>
          <img
            src={previewUrl}
            alt=""
            className="max-h-[80vh] max-w-[90vw] rounded-xl object-contain shadow-2xl transition-all duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
};

export default CourseFormPage;
