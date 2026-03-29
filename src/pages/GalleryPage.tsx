import { useEffect, useMemo, useState, useDeferredValue } from "react";
import { ImagePlus, Loader2, Trash2, Search, Pencil } from "lucide-react";
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
  filterGalleryItems,
  updateGalleryItemApi,
  type GalleryCategory,
  type GalleryItem,
} from "@/api/services/gallery.service";

const categories: Array<"All" | GalleryCategory> = ["All", "Campus", "Labs", "Events"];
const uploadCategories: GalleryCategory[] = ["Campus", "Labs", "Events"];

const GalleryPage = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [allItems, setAllItems] = useState<GalleryItem[] | null>(null);
  const [serverTotal, setServerTotal] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<"All" | GalleryCategory>("All");

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [dateFilter, setDateFilter] = useState("");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [editingId, setEditingId] = useState<string | null>(null);

  const hasFilter = deferredSearch !== "" || categoryFilter !== "All" || dateFilter !== "" || order !== "desc";

  useEffect(() => setPage(1), [deferredSearch, categoryFilter, pageSize, dateFilter, order]);
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
      const data = await getGalleryItems();
      setAllItems(data);
      setServerTotal(data.length);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load gallery items.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchList = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        if (!hasFilter) {
          const data = await getGalleryItems();
          if (!cancelled) {
            setAllItems(data);
            setServerTotal(data.length);
          }
        } else {
          const data = await filterGalleryItems(
            {
              page,
              limit: pageSize,
              search: deferredSearch || undefined,
              type: categoryFilter !== "All" ? categoryFilter : undefined,
              date: dateFilter || undefined,
              order,
            },
            controller.signal
          );
          if (!cancelled) {
            setAllItems(null);
            setItems(data.data);
            setServerTotal(data.total);
          }
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load gallery items.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void fetchList();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, pageSize, deferredSearch, categoryFilter, dateFilter, order, hasFilter]);

  const displayedItems = useMemo(() => {
    if (!hasFilter && allItems) {
      const start = (page - 1) * pageSize;
      return allItems.slice(start, start + pageSize);
    }
    return items;
  }, [hasFilter, allItems, items, page, pageSize]);

  const totalItems = hasFilter ? serverTotal : (allItems?.length ?? 0);
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  useEffect(() => setPage((p) => Math.min(p, totalPages)), [totalPages]);

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
    setEditingId(null);
    setFormOpen(true);
  };

  const openEditForm = (item: GalleryItem) => {
    if (previewImage.startsWith("blob:")) {
      URL.revokeObjectURL(previewImage);
    }
    setForm({
      title: item.title,
      category: item.category,
      imageFile: null,
    });
    setPreviewImage(item.image);
    setFormError("");
    setEditingId(item.id);
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
    if (!editingId && (!previewImage || !form.imageFile)) {
      setFormError("Image is required.");
      return;
    }
    if (form.imageFile && form.imageFile.size > MAX_IMAGE_SIZE_BYTES) {
      setFormError("Image size must be 2MB or less.");
      return;
    }

    setFormError("");
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateGalleryItemApi(editingId, {
          title: form.title.trim(),
          category: form.category,
          imageFile: form.imageFile,
        });
        if (allItems) {
          setAllItems((prev) => (prev ?? []).map((x) => (x.id === editingId ? updated : x)));
        }
        setItems((prev) => prev.map((x) => (x.id === editingId ? updated : x)));
      } else {
        if (!form.imageFile) throw new Error("Image file required");
        const created = await createGalleryItem({
          title: form.title.trim(),
          category: form.category,
          imageFile: form.imageFile,
        });
        if (allItems) {
          setAllItems((prev) => [created, ...(prev ?? [])]);
        }
        setItems((prev) => [created, ...prev]);
        setServerTotal((prev) => prev + 1);
      }
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
    if (allItems) {
      setAllItems((prev) => (prev ?? []).filter((x) => x.id !== itemId));
    }
    setServerTotal((p) => Math.max(0, p - 1));
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
        description={isLoading ? "Loading…" : `${totalItems} media items`}
        action={(
          <Button onClick={openUploadForm} size="sm">
            <ImagePlus className="mr-1 h-4 w-4" />
            Upload Image
          </Button>
        )}
      />
      {loadError ? <p className="text-sm text-red-400">{loadError}</p> : null}
      {deleteError ? <p className="text-sm text-red-400">{deleteError}</p> : null}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
            <Input
              placeholder="Search gallery…"
              className="pl-8 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>

          <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val as any)}>
            <SelectTrigger className="w-full md:w-[160px] h-10 rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-lg hover:bg-white/10 data-[placeholder]:text-gray-300">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="border border-white/10 bg-slate-900 text-white">
              {categories.map((category) => (
                <SelectItem key={category} value={category} className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200">{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="w-full min-w-[140px]">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setPage(1);
                  setDateFilter(e.target.value);
                }}
                className="h-10 w-full rounded-lg border border-white/20 bg-white/10 px-3 flex items-center text-sm text-white backdrop-blur-lg hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
              />
            </div>

          <Select value={order} onValueChange={(val: "asc" | "desc") => setOrder(val)}>
            <SelectTrigger className="w-full md:w-[140px] h-10 rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-lg hover:bg-white/10 data-[placeholder]:text-gray-300">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent className="border border-white/10 bg-slate-900 text-white">
              <SelectItem value="desc" className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200">Descending</SelectItem>
              <SelectItem value="asc" className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200">Ascending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Loading gallery…</span>
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 bg-white/10 p-8 text-center text-sm text-gray-300 backdrop-blur-lg">
          No gallery items found
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayedItems.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/5 text-white/80 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
                <img src={item.image} alt={item.title} className="h-44 w-full object-cover" />
                <div className="space-y-2 p-3 sm:p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white/90">{item.title}</p>
                    <span className="rounded-full border border-blue-500/30 bg-blue-500/20 px-2.5 py-1 text-xs font-semibold text-blue-400">
                      {item.category}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(item)}
                      className="rounded-lg p-2 text-blue-400 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
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
                {Math.min((page - 1) * pageSize + 1, totalItems)}-
                {Math.min(page * pageSize, totalItems)} of {totalItems}
              </div>
            </div>
          ) : null}
        </>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="border-white/10 bg-white/10 backdrop-blur-lg sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Image" : "Upload Image"}</DialogTitle>
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
