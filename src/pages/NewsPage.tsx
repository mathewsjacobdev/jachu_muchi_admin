import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DeleteModal from "@/components/shared/DeleteModal";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Pencil, Trash2, Calendar, Search, Newspaper, Image as ImageIcon, Loader2 } from "lucide-react";
import { deleteNews, getNews } from "@/api/services/news.service";
import type { NewsItem } from "@/types";

type NewsStatus = NewsItem["status"];
type StatusFilter = "All" | NewsStatus;

const statusClasses: Record<NewsStatus, string> = {
  Published: "border border-green-400/20 bg-green-400/10 text-green-300",
  Draft: "border border-yellow-400/20 bg-yellow-400/10 text-yellow-300",
};

const NewsPage = () => {
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getNews();
        setNews(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filteredNews = useMemo(() => {
    const query = search.trim().toLowerCase();
    return news.filter((item) => {
      const matchesQuery = !query || item.title.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [news, search, statusFilter]);

  const totalPages = useMemo(() => {
    const total = Math.ceil(filteredNews.length / pageSize);
    return total > 0 ? total : 1;
  }, [filteredNews.length, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const paginatedNews = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredNews.slice(start, start + pageSize);
  }, [filteredNews, page, pageSize]);

  const publishedCount = useMemo(
    () => news.filter((item) => item.status === "Published").length,
    [news],
  );

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    try {
      await deleteNews(id);
      setNews((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
      const data = await getNews();
      setNews(data);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="News Management"
        description="Create, publish, and manage announcements from one dashboard."
        action={(
          <Button
            onClick={() => navigate("/news/new")}
            size="sm"
            className="h-9 rounded-lg bg-blue-600 px-3.5 font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:bg-blue-700"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Article
          </Button>
        )}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-white/20 bg-white/10 p-3 shadow-md backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl sm:p-4 md:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-300">Total</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-100">{news.length}</p>
        </div>
        <div className="rounded-xl border border-white/20 bg-white/10 p-3 shadow-md backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl sm:p-4 md:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-300">Published</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-100">{publishedCount}</p>
        </div>
        <div className="rounded-xl border border-white/20 bg-white/10 p-3 shadow-md backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl sm:p-4 md:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-yellow-300">Draft</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-100">{news.length - publishedCount}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-white/20 bg-white/10 p-3 shadow-lg backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl sm:p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title..."
              className="h-10 rounded-lg border-white/20 bg-white/10 pl-10.5 text-sm text-gray-100 shadow-sm backdrop-blur-lg transition-all duration-200 placeholder:text-gray-400 hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end md:w-auto">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="h-10 w-full rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-lg hover:bg-white/10 data-[placeholder]:text-gray-300 sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border border-white/10 bg-slate-900 text-white">
                <SelectItem className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value="All">All Status</SelectItem>
                <SelectItem className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value="Published">Published</SelectItem>
                <SelectItem className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value="Draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger className="h-10 w-full rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-lg hover:bg-white/10 data-[placeholder]:text-gray-300 sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border border-white/10 bg-slate-900 text-white">
                {[6, 9, 12].map((size) => (
                  <SelectItem
                    key={size}
                    className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200"
                    value={String(size)}
                  >
                    {size}/page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-300">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading articles...
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 bg-white/10 p-12 text-center shadow-md backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-gray-200">
            <Newspaper className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-gray-100">No articles found</p>
          <p className="mt-1.5 text-xs text-gray-300">
            Try a different title search or add a new article.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedNews.map((n) => (
            <div
              key={n.id}
              className="group overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#0f172a] to-[#1e293b] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              {n.image ? (
                <img src={n.image} alt={n.title} className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              ) : (
                <div className="flex h-44 w-full items-center justify-center bg-white/5 text-white/30">
                  <ImageIcon className="h-10 w-10" />
                </div>
              )}
              <div className="space-y-3.5 p-3 sm:p-4 md:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-300">
                    <Calendar className="h-3.5 w-3.5" />
                    {n.date}
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-all duration-200 ${statusClasses[n.status]}`}>
                    {n.status}
                  </span>
                </div>
                <div>
                  <h3 className="mb-1.5 line-clamp-1 text-base font-semibold tracking-tight text-gray-100">{n.title}</h3>
                  <p className="line-clamp-2 text-sm leading-6 text-gray-300">{n.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9"
                    onClick={() => navigate(`/news/${n.id}`)}
                  >
                    View
                  </Button>
                  <button
                    type="button"
                    onClick={() => navigate(`/news/edit/${n.id}`)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-blue-300 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:bg-white/20"
                    aria-label={`Edit ${n.title}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(n.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-red-300 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:bg-white/20"
                    aria-label={`Delete ${n.title}`}
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
                Showing {Math.min((page - 1) * pageSize + 1, filteredNews.length)}-
                {Math.min(page * pageSize, filteredNews.length)} of {filteredNews.length}
              </div>
            </div>
          ) : null}
        </>
      )}

      <DeleteModal
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete article"
      />
    </div>
  );
};

export default NewsPage;
