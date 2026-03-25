import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import DeleteModal from "@/components/shared/DeleteModal";
import type { Branch } from "@/lib/branch-store";
import { deleteBranchApi, getBranches } from "@/api/services/branch.service";
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
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const load = async () => {
    setIsLoading(true);
    try {
      setBranches(await getBranches());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const totalPages = useMemo(() => {
    const total = Math.ceil(branches.length / pageSize);
    return total > 0 ? total : 1;
  }, [branches.length, pageSize]);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const paginatedBranches = useMemo(() => {
    const start = (page - 1) * pageSize;
    return branches.slice(start, start + pageSize);
  }, [branches, page, pageSize]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setBranches((prev) => prev.filter((b) => b.id !== deleteId));
    setDeleteId(null);
    try {
      await deleteBranchApi(deleteId);
    } catch (e) {
      console.error(e);
      void load();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branch Management"
        description={
          isLoading
            ? "Loading branches…"
            : `${branches.length} branches`
        }
        action={(
          <Button onClick={() => navigate("/branches/new")} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add Branch
          </Button>
        )}
      />

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Loading branches…</span>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-end">
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

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedBranches.map((branch) => (
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
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                    branch.status === "Active"
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                      : "border-white/15 bg-white/10 text-gray-400"
                  }`}
                >
                  {branch.status}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/branches/edit/${branch.id}`)}
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
                {Math.min((page - 1) * pageSize + 1, branches.length)}-
                {Math.min(page * pageSize, branches.length)} of {branches.length}
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
