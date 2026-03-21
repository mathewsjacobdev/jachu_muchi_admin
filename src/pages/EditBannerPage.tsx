import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BannerStatus, getBannerById, updateBanner } from "@/lib/banner-store";

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) ?? "");
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });

const EditBannerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const banner = useMemo(() => (id ? getBannerById(id) : undefined), [id]);

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<BannerStatus>("Active");
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [titleError, setTitleError] = useState("");
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    if (!banner) {
      navigate("/banners");
      return;
    }
    setTitle(banner.title);
    setStatus(banner.status);
    setPreviewUrl(banner.image);
  }, [banner, navigate]);

  const onImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file || !file.type.startsWith("image/")) return;
    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setImageError("");
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) return;

    if (!title.trim()) {
      setTitleError("Title is required.");
      return;
    }
    setTitleError("");

    let nextImage = previewUrl.trim();
    if (imageFile) {
      nextImage = await fileToDataUrl(imageFile);
    }

    if (!nextImage) {
      setImageError("Image is required.");
      return;
    }
    setImageError("");

    updateBanner(id, {
      title: title.trim(),
      status,
      image: nextImage,
    });

    navigate("/banners");
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Edit Banner"
        description="Update banner details and media."
        action={(
          <Link
            to="/banners"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-gray-200 transition-all duration-200 hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
            Banners
          </Link>
        )}
      />

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-xl border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-lg"
      >
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError("");
            }}
            placeholder="Enter banner title"
          />
          {titleError ? <p className="text-xs text-red-400">{titleError}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as BannerStatus)}>
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
            <img src={previewUrl} alt="Preview" className="h-52 w-full rounded-lg object-cover" />
          ) : null}
          {imageError ? <p className="text-xs text-red-400">{imageError}</p> : null}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/banners")}>
            Cancel
          </Button>
          <Button type="submit">Update Banner</Button>
        </div>
      </form>
    </div>
  );
};

export default EditBannerPage;
