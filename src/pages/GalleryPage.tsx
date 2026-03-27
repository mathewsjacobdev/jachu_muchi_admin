import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "Campus" as GalleryCategory,
    imageFile: null as File | null,
  });
  const [previewImage, setPreviewImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

  const load = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      setItems(await getGalleryItems());
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load gallery items.");
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

  const totalPages = useMemo(() => {
    const total = Math.ceil(filteredItems.length / pageSize);
    return total > 0 ? total : 1;
  }, [filteredItems.length, pageSize]);

  useEffect(() => setPage(1), [categoryFilter, pageSize]);
  useEffect(() => setPage((p) => Math.min(p, totalPages)), [totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

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
    setFormError("");
    setFormOpen(true);
  };

  const onImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setForm((prev) => ({ ...prev, imageFile: null }));
      setPreviewImage("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setFormError("Please select a valid image file.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setFormError("Image size must be 2MB or less.");
      return;
    }

    if (previewImage.startsWith("blob:")) {
      URL.revokeObjectURL(previewImage);
    }

    setFormError("");
    setForm((prev) => ({ ...prev, imageFile: file }));
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (saving) return;
    if (!form.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!previewImage || !form.imageFile) {
      setFormError("Image is required.");
      return;
    }
    if (form.imageFile.size > MAX_IMAGE_SIZE_BYTES) {
      setFormError("Image size must be 2MB or less.");
      return;
    }

    setFormError("");
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
      setFormError(e instanceof Error ? e.message : "Failed to save image. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (itemId: string) => {
    if (deletingIds.has(itemId)) return;
    setDeleteError("");
    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
    setItems((prev) => prev.filter((x) => x.id !== itemId));
    try {
      await deleteGalleryItemApi(itemId);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Failed to delete image.");
      void load();
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
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
      {loadError ? <p className="text-sm text-red-400">{loadError}</p> : null}
      {deleteError ? <p className="text-sm text-red-400">{deleteError}</p> : null}

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
        <>
          <div className="mb-3 flex items-center justify-end">
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-full rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-lg hover:bg-white/10 data-[placeholder]:text-gray-300 sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border border-white/10 bg-slate-900 text-white">
                {[6, 9, 12].map((size) => (
                  <SelectItem
                    key={size}
                    value={String(size)}
                    className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200"
                  >
                    {size}/page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedItems.map((item) => (
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
                    disabled={deletingIds.has(item.id)}
                    className="rounded-lg p-2 text-red-400 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10"
                  >
                    {deletingIds.has(item.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="pt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((p) => Math.max(1, p - 1));
                      }}
                      className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>
                  {(() => {
                    const window = 2;
                    const start = Math.max(1, page - window);
                    const end = Math.min(totalPages, page + window);
                    const showLeftEllipsis = start > 1;
                    const showRightEllipsis = end < totalPages;

                    const pagesToShow: number[] = [];
                    for (let p = start; p <= end; p++) pagesToShow.push(p);

                    return (
                      <>
                        {showLeftEllipsis ? (
                          <PaginationItem>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(1);
                              }}
                              isActive={page === 1}
                            >
                              1
                            </PaginationLink>
                          </PaginationItem>
                        ) : null}
                        {showLeftEllipsis ? <PaginationEllipsis /> : null}
                        {pagesToShow.map((p) => (
                          <PaginationItem key={p}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(p);
                              }}
                              isActive={p === page}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        {showRightEllipsis ? <PaginationEllipsis /> : null}
                        {showRightEllipsis ? (
                          <PaginationItem>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(totalPages);
                              }}
                              isActive={page === totalPages}
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        ) : null}
                      </>
                    );
                  })()}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((p) => Math.min(totalPages, p + 1));
                      }}
                      className={page >= totalPages ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              <div className="mt-3 text-center text-sm text-gray-400">
                Showing{" "}
                {Math.min((page - 1) * pageSize + 1, filteredItems.length)}-
                {Math.min(page * pageSize, filteredItems.length)} of {filteredItems.length}
              </div>
            </div>
          ) : null}
        </>
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
            {formError ? <p className="text-sm text-red-300">{formError}</p> : null}

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
