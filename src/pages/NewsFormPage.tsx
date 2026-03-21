import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Image as ImageIcon, X } from "lucide-react";

import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getNewsById, NewsStatus, upsertNews } from "@/lib/news-store";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const emptyForm = {
  title: "",
  description: "",
  date: "",
  status: "Draft" as NewsStatus,
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) ?? "");
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });

const NewsFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const existing = useMemo(() => (id ? getNewsById(id) : undefined), [id]);
  const [form, setForm] = useState({
    ...emptyForm,
    date: new Date().toISOString().split("T")[0],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    if (!existing) {
      navigate("/news");
      return;
    }
    setForm({
      title: existing.title,
      description: existing.description,
      date: existing.date,
      status: existing.status,
    });
    setPreviewUrl(existing.image);
  }, [existing, isEdit, navigate]);

  useEffect(() => () => {
    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  const onImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > MAX_IMAGE_BYTES) return;

    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearImage = () => {
    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setImageFile(null);
    setPreviewUrl("");
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.date.trim()) return;

    const image = imageFile ? await fileToDataUrl(imageFile) : previewUrl.trim();

    upsertNews({
      id,
      title: form.title.trim(),
      description: form.description.trim(),
      date: form.date,
      status: form.status,
      image,
    });

    navigate("/news");
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title={isEdit ? "Edit Article" : "Add Article"}
        description={isEdit ? "Update article details and media." : "Create and publish a new article."}
        action={(
          <Link
            to="/news"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-gray-200 transition-all duration-200 hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
            News
          </Link>
        )}
      />

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-200">Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Article title"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-200">Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Write article summary"
                  rows={6}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-200">Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-200">Status</Label>
                <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as NewsStatus }))}>
                  <SelectTrigger className="h-10 w-full rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-lg hover:bg-white/10 data-[placeholder]:text-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border border-white/10 bg-slate-900 text-white">
                    <SelectItem className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value="Published">Published</SelectItem>
                    <SelectItem className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value="Draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-200">Image Upload</Label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-gray-200 transition-colors hover:bg-white/15">
                    Choose File
                    <input type="file" accept="image/*" className="sr-only" onChange={onImageChange} />
                  </label>
                  {previewUrl ? (
                    <Button type="button" variant="outline" size="sm" onClick={clearImage}>
                      <X className="h-4 w-4" />
                      Remove
                    </Button>
                  ) : null}
                </div>
                <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="h-44 w-full object-cover" />
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center text-white/35">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit">{isEdit ? "Save Changes" : "Publish Article"}</Button>
          <Button type="button" variant="outline" onClick={() => navigate("/news")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewsFormPage;
