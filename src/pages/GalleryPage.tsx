import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createGalleryItem,
  deleteGalleryItemApi,
  getGalleryItems,
  type GalleryCategory,
  type GalleryItem,
} from "@/api/services/gallery.service";

const categories: Array<"All" | GalleryCategory> = ["All", "Campus", "Labs", "Events"];
const uploadCategories: GalleryCategory[] = ["Campus", "Labs", "Events"];

const GalleryPage = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<"All" | GalleryCategory>("All");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "Campus" as GalleryCategory,
    imageFile: null as File | null,
  });
  const [previewImage, setPreviewImage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      setItems(await getGalleryItems());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredItems = useMemo(
    () => items.filter((item) => categoryFilter === "All" || item.category === categoryFilter),
    [items, categoryFilter],
  );

  useEffect(() => () => {
    if (previewImage.startsWith("blob:")) {
      URL.revokeObjectURL(previewImage);
    }
  }, [previewImage]);

  const openUploadForm = () => {
    if (previewImage.startsWith("blob:")) {
      URL.revokeObjectURL(previewImage);
    }
    setForm({
      title: "",
      category: "Campus",
      imageFile: null,
    });
    setPreviewImage("");
    setFormOpen(true);
  };

  const onImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file || !file.type.startsWith("image/")) return;

    if (previewImage.startsWith("blob:")) {
      URL.revokeObjectURL(previewImage);
    }

    setForm((prev) => ({ ...prev, imageFile: file }));
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !previewImage || !form.imageFile) return;
    setSaving(true);
    try {
      const created = await createGalleryItem({
        title: form.title.trim(),
        category: form.category,
        image: previewImage,
      });
      setItems((prev) => [created, ...prev]);
      setFormOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setItems((prev) => prev.filter((x) => x.id !== itemId));
    try {
      await deleteGalleryItemApi(itemId);
    } catch (e) {
      console.error(e);
      void load();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gallery Management"
        description={isLoading ? "Loading…" : `${items.length} media items`}
        action={(
          <Button onClick={openUploadForm} size="sm">
            <ImagePlus className="mr-1 h-4 w-4" />
            Upload Image
          </Button>
        )}
      />

      <div className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl sm:p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setCategoryFilter(category)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                categoryFilter === category ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Loading gallery…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/5 text-white/80 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
              <img src={item.image} alt={item.title} className="h-44 w-full object-cover" />
              <div className="space-y-2 p-3 sm:p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white/90">{item.title}</p>
                  <span className="rounded-full border border-blue-500/30 bg-blue-500/20 px-2.5 py-1 text-xs font-semibold text-blue-400">
                    {item.category}
                  </span>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => void removeItem(item.id)}
                    className="rounded-lg p-2 text-red-400 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="border-white/10 bg-white/10 backdrop-blur-lg sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Image</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 rounded-xl bg-white/10 p-4 backdrop-blur-lg">
            <div className="space-y-1.5">
              <Label>Image</Label>
              <Input type="file" accept="image/*" onChange={onImageChange} />
              {previewImage ? (
                <img src={previewImage} alt="Preview" className="h-44 w-full rounded-lg object-cover" />
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Image title"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(value) => setForm((prev) => ({ ...prev, category: value as GalleryCategory }))}>
                <SelectTrigger className="h-10 w-full rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-lg hover:bg-white/10 data-[placeholder]:text-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border border-white/10 bg-slate-900 text-white">
                  {uploadCategories.map((category) => (
                    <SelectItem key={category} className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={saving} onClick={() => void handleSave()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GalleryPage;
