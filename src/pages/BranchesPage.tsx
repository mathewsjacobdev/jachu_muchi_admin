import { useEffect, useMemo, useState, useDeferredValue } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DeleteModal from "@/components/shared/DeleteModal";
import type { Branch } from "@/lib/branch-store";
import { deleteBranchApi, getBranches, filterBranches } from "@/api/services/branch.service";
import { Search } from "lucide-react";
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

const BranchesPage = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [allBranches, setAllBranches] = useState<Branch[] | null>(null);
  const [serverTotal, setServerTotal] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [dateFilter, setDateFilter] = useState("");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const hasFilter = deferredSearch !== "" || dateFilter !== "" || order !== "desc";

  useEffect(() => setPage(1), [deferredSearch, pageSize, dateFilter, order]);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const data = await getBranches();
      setAllBranches(data);
      setServerTotal(data.length);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchList = async () => {
      setIsLoading(true);
      try {
        if (!hasFilter) {
          const data = await getBranches();
          if (!cancelled) {
            setAllBranches(data);
            setServerTotal(data.length);
          }
        } else {
          const data = await filterBranches(
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
            setAllBranches(null);
            setBranches(data.data);
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
    void fetchList();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, pageSize, deferredSearch, dateFilter, order, hasFilter]);

  const displayedBranches = useMemo(() => {
    if (!hasFilter && allBranches) {
      const start = (page - 1) * pageSize;
      return allBranches.slice(start, start + pageSize);
    }
    return branches;
  }, [hasFilter, allBranches, branches, page, pageSize]);

  const totalItems = hasFilter ? serverTotal : (allBranches?.length ?? 0);
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setBranches((prev) => prev.filter((b) => b.id !== deleteId));
    if (allBranches) {
      setAllBranches((prev) => (prev ?? []).filter((b) => b.id !== deleteId));
    }
    setServerTotal((p) => Math.max(0, p - 1));
    setDeleteId(null);
    try {
      await deleteBranchApi(deleteId);
    } catch (e) {
      console.error(e);
      void loadAll();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branch Management"
        description={
          isLoading
            ? "Loading branches…"
            : `${totalItems} branches`
        }
        action={(
          <Button onClick={() => navigate("/branches/new")} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add Branch
          </Button>
        )}
      />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
            <Input
              placeholder="Search branches…"
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
          <span className="text-sm">Loading branches…</span>
        </div>
      ) : displayedBranches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 bg-white/10 p-8 text-center text-sm text-gray-300 backdrop-blur-lg">
          No branches found
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayedBranches.map((branch) => (
              <div
                key={branch.id}
                className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <h3 className="text-lg font-semibold text-white">{branch.name}</h3>

                <div className="mt-3 space-y-2 text-sm text-gray-400">
                  <div>
                    <span className="text-gray-500">Phone</span>
                    {branch.phones.length > 0 ? (
                      <ul className="mt-1 list-inside list-disc space-y-0.5 text-gray-300">
                        {branch.phones.map((phone, i) => (
                          <li key={`${branch.id}-phone-${i}`}>{phone}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-gray-500">—</p>
                    )}
                  </div>
                  <p>
                    <span className="text-gray-500">Email</span> · {branch.email}
                  </p>
                  <p>
                    <span className="text-gray-500">Location</span> · {branch.location}
                  </p>
                  <p>
                    <a
                      href={branch.mapUrl}
                      className="text-blue-400 transition-colors hover:text-blue-300 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Map
                    </a>
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${branch.status === "Active"
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                        : "border-white/15 bg-white/10 text-gray-400"
                      }`}
                  >
                    {branch.status}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/branches/edit/${branch.id}`, { state: { branch } })}
                      className="rounded-lg bg-white/10 p-2 text-blue-300 transition-colors hover:bg-white/20"
                      aria-label={`Edit ${branch.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(branch.id)}
                      className="rounded-lg bg-white/10 p-2 text-red-300 transition-colors hover:bg-white/20"
                      aria-label={`Delete ${branch.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
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

      <DeleteModal
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete branch"
      />
    </div>
  );
};

export default BranchesPage;
