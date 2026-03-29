import { useEffect, useMemo, useState, useDeferredValue } from "react";
import { Loader2, Plus, Pencil, Trash2, Search } from "lucide-react";
import type { Category } from "@/types";
import PageHeader from "@/components/shared/PageHeader";
import DeleteModal from "@/components/shared/DeleteModal";
import { Button } from "@/components/ui/button";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  createCategory,
  deleteCategoryApi,
  filterCategories,
  getCategories,
  updateCategoryApi,
} from "@/api/services/category.service";

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[] | null>(null);
  const [serverTotal, setServerTotal] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [productCount, setProductCount] = useState("0");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());

  const [dateFilter, setDateFilter] = useState("");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const hasFilter = deferredSearch !== "" || dateFilter !== "" || order !== "desc";

  useEffect(() => setPage(1), [deferredSearch, pageSize, dateFilter, order]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      setIsLoading(true);
      try {
        if (!hasFilter) {
          const data = await getCategories();
          if (!cancelled) {
            setAllCategories(data);
            setServerTotal(data.length);
          }
        } else {
          const data = await filterCategories(
            {
              page,
              limit: pageSize,
              search: deferredSearch || undefined,
              date: dateFilter || undefined,
              order,
            },
            controller.signal
          );
          if (!cancelled) {
            setAllCategories(null);
            setCategories(data.data);
            setServerTotal(data.total);
          }
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        if (!cancelled) console.error(e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, pageSize, deferredSearch, dateFilter, order, hasFilter]);

  const displayedCategories = useMemo(() => {
    if (!hasFilter && allCategories) {
      const start = (page - 1) * pageSize;
      return allCategories.slice(start, start + pageSize);
    }
    return categories;
  }, [hasFilter, allCategories, categories, page, pageSize]);

  const totalItems = hasFilter ? serverTotal : (allCategories?.length ?? 0);
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const openAdd = () => {
    setEditing(null);
    setName("");
    setProductCount("0");
    setFormOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setProductCount(String(c.productCount));
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const parsedProductCount = Number(productCount);
    const safeProductCount = Number.isFinite(parsedProductCount) && parsedProductCount >= 0
      ? Math.floor(parsedProductCount)
      : 0;
    setSaving(true);
    try {
      if (editing) {
        await updateCategoryApi(editing.id, { name: name.trim(), productCount: safeProductCount });
        setCategories((prev) =>
          prev.map((c) => (
            c.id === editing.id
              ? { ...c, name: name.trim(), productCount: safeProductCount }
              : c
          )),
        );
      } else {
        const created = await createCategory({ name: name.trim(), productCount: safeProductCount });
        if (allCategories) {
          setAllCategories((prev) => [created, ...(prev ?? [])]);
        }
        setCategories((prev) => [created, ...prev]);
        setServerTotal((prev) => prev + 1);
      }
      setFormOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setCategories((prev) => prev.filter((c) => c.id !== deleteId));
    if (allCategories) {
      setAllCategories((prev) => (prev ?? []).filter((c) => c.id !== deleteId));
    }
    setServerTotal((p) => Math.max(0, p - 1));
    setDeleteId(null);
    try {
      await deleteCategoryApi(deleteId);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description={isLoading ? "Loading…" : `${totalItems} categories`}
        action={(
          <Button onClick={openAdd} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add Category
          </Button>
        )}
      />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
            <Input
              placeholder="Search categories…"
              className="pl-8 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>

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
          <span className="text-sm">Loading categories…</span>
        </div>
      ) : displayedCategories.length === 0 ? (
        <div className="rounded-xl border border-white/20 bg-white/10 p-8 text-center text-sm text-white/50 backdrop-blur-lg">
          No categories found
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayedCategories.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-white/80 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl sm:p-4 md:p-5">
                <div>
                  <p className="font-medium text-white/90">{c.name}</p>
                  <p className="text-xs text-white/50">{c.productCount} products</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => openEdit(c)} className="rounded-lg p-2 text-blue-400 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setDeleteId(c.id)} className="rounded-lg p-2 text-red-400 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10"><Trash2 className="h-4 w-4" /></button>
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
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5"><Label className="text-white/50">Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-white/50">Product Count</Label>
              <Input
                type="number"
                min={0}
                value={productCount}
                onChange={(e) => setProductCount(e.target.value)}
              />
            </div>
            <Button disabled={saving} onClick={() => void handleSave()} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editing ? "Update" : "Add"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteModal open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
};

export default CategoriesPage;
