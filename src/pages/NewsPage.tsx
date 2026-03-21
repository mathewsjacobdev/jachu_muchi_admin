import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DeleteModal from "@/components/shared/DeleteModal";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Calendar, Search, Newspaper, Image as ImageIcon } from "lucide-react";
import { NewsStatus, listNews, removeNews } from "@/lib/news-store";

type StatusFilter = "All" | NewsStatus;

const statusClasses: Record<NewsStatus, string> = {
  Published: "border border-green-400/20 bg-green-400/10 text-green-300",
  Draft: "border border-yellow-400/20 bg-yellow-400/10 text-yellow-300",
};

const NewsPage = () => {
  const navigate = useNavigate();
  const [news, setNews] = useState(() => listNews());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const filteredNews = useMemo(() => {
    const query = search.trim().toLowerCase();
    return news.filter((item) => {
      const matchesQuery = !query || item.title.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [news, search, statusFilter]);
  const publishedCount = useMemo(
    () => news.filter((item) => item.status === "Published").length,
    [news],
  );

  const handleDelete = () => {
    if (deleteId) {
      removeNews(deleteId);
      setNews(listNews());
    }
    setDeleteId(null);
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
          </div>
        </div>
      </div>

      {filteredNews.length === 0 ? (
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNews.map((n) => (
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
                    onClick={() => navigate(`/news/edit/${n.id}`)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-blue-300 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:bg-white/20"
                    aria-label={`Edit ${n.title}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
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
      )}

      <DeleteModal open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete article" />
    </div>
  );
};

export default NewsPage;
