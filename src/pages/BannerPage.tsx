import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, Loader2, Pencil, Trash2 } from "lucide-react";

import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BannerItem, BannerStatus } from "@/lib/banner-store";
import {
  createBanner,
  deleteBannerApi,
  getBanners,
  toggleBannerStatusApi,
} from "@/api/services/banner.service";

const BannerPage = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    status: "Active" as BannerStatus,
    imageFile: null as File | null,
  });
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      setBanners(await getBanners());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onUploadClick = () => {
    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setForm({ title: "", status: "Active", imageFile: null });
    setPreviewUrl("");
    setFormOpen(true);
  };

  const onImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file || !file.type.startsWith("image/")) return;

    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setForm((prev) => ({ ...prev, imageFile: file }));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const onSave = async () => {
    if (!form.title.trim() || !previewUrl || !form.imageFile) return;
    setSaving(true);
    try {
      const created = await createBanner({
        title: form.title.trim(),
        image: previewUrl,
        status: form.status,
      });
      setBanners((prev) => [created, ...prev]);
      setFormOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (bannerId: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== bannerId));
    try {
      await deleteBannerApi(bannerId);
    } catch (e) {
      console.error(e);
      void load();
    }
  };

  const onToggleStatus = async (banner: BannerItem) => {
    const prevStatus = banner.status;
    const next = prevStatus === "Active" ? "Inactive" : "Active";
    setBanners((list) =>
      list.map((b) => (b.id === banner.id ? { ...b, status: next } : b)),
    );
    try {
      await toggleBannerStatusApi(banner.id, prevStatus);
    } catch (e) {
      console.error(e);
      setBanners((list) =>
        list.map((b) => (b.id === banner.id ? { ...b, status: prevStatus } : b)),
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banner Management"
        description={
          isLoading ? "Loading banners…" : `${banners.length} homepage banners`
        }
        action={(
          <Button onClick={onUploadClick} size="sm">
            <ImagePlus className="mr-1 h-4 w-4" />
            Add Banner
          </Button>
        )}
      />

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : banners.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 bg-white/10 p-10 text-center text-sm text-gray-300 backdrop-blur-lg">
          No banners yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="overflow-hidden rounded-xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <img src={banner.image} alt={banner.title} className="h-48 w-full object-cover" />

              <div className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-white">{banner.title}</h3>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      banner.status === "Active"
                        ? "border border-green-500/30 bg-green-500/15 text-green-300"
                        : "border border-white/15 bg-white/10 text-gray-400"
                    }`}
                  >
                    {banner.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => void onToggleStatus(banner)}>
                    {banner.status === "Active" ? "Set Inactive" : "Set Active"}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => navigate(`/banners/edit/${banner.id}`)}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-red-300 hover:text-red-200"
                    onClick={() => void onDelete(banner.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="border-white/20 bg-white/10 backdrop-blur-lg sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Banner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Banner Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter banner title"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as BannerStatus }))}>
                <SelectTrigger className="h-10 w-full rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-lg hover:bg-white/10 data-[placeholder]:text-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border border-white/10 bg-slate-900 text-white">
                  <SelectItem className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value="Active">Active</SelectItem>
                  <SelectItem className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Image Upload</Label>
              <Input type="file" accept="image/*" onChange={onImageChange} />
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="h-48 w-full rounded-lg object-cover" />
              ) : null}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={saving} onClick={() => void onSave()}>
                {saving ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save Banner"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BannerPage;
