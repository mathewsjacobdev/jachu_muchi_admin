import { useMemo, useState } from "react";
import { MOCK_NEWS } from "@/lib/mock-data";
import { NewsItem } from "@/types";
import DeleteModal from "@/components/shared/DeleteModal";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Calendar, Search, LayoutGrid, Rows3, Newspaper } from "lucide-react";

type NewsStatus = "Published" | "Draft";
type ViewMode = "grid" | "table";
type StatusFilter = "All" | NewsStatus;

const emptyNews: Omit<NewsItem, "id"> = {
  title: "",
  description: "",
  image: "",
  date: "",
  status: "Draft",
};

const statusClasses: Record<NewsStatus, string> = {
  Published: "border border-green-400/20 bg-green-400/10 text-green-300",
  Draft: "border border-yellow-400/20 bg-yellow-400/10 text-yellow-300",
};

const NewsPage = () => {
  const [news, setNews] = useState<NewsItem[]>(MOCK_NEWS);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [form, setForm] = useState(emptyNews);
  const [titleError, setTitleError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

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

  const openAdd = () => {
    setEditing(null);
    setTitleError("");
    setForm({ ...emptyNews, date: new Date().toISOString().split("T")[0], status: "Draft" });
    setFormOpen(true);
  };

  const openEdit = (n: NewsItem) => {
    setEditing(n);
    setTitleError("");
    setForm({
      title: n.title,
      description: n.description,
      image: n.image,
      date: n.date,
      status: n.status ?? "Draft",
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      setTitleError("Title is required.");
      return;
    }
    setTitleError("");
    if (editing) {
      setNews(news.map((n) => n.id === editing.id ? { ...n, ...form } : n));
    } else {
      setNews([{ id: Date.now().toString(), ...form }, ...news]);
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) setNews(news.filter((n) => n.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="News Management"
        description="Create, publish, and manage announcements from one dashboard."
        action={(
          <Button
            onClick={openAdd}
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
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-10 w-full rounded-lg border border-white/20 bg-white/10 px-3.5 text-sm font-medium text-gray-100 shadow-sm backdrop-blur-lg transition-all duration-200 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-44"
            >
              <option value="All">All Status</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
            <div className="inline-flex w-full rounded-lg border border-white/20 bg-white/10 p-1 backdrop-blur-lg sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-200 md:flex-none ${
                viewMode === "grid"
                  ? "bg-white/15 text-gray-100 shadow-sm"
                  : "text-gray-300 hover:bg-white/10"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-200 md:flex-none ${
                viewMode === "table"
                  ? "bg-white/15 text-gray-100 shadow-sm"
                  : "text-gray-300 hover:bg-white/10"
              }`}
            >
              <Rows3 className="h-4 w-4" />
              Table
            </button>
            </div>
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
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNews.map((n) => (
            <div
              key={n.id}
              className="group overflow-hidden rounded-xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
            >
              {n.image && (
                <img
                  src={n.image}
                  alt={n.title}
                  className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
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
                  <button
                    onClick={() => openEdit(n)}
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
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
          <table className="min-w-full divide-y divide-white/10 text-xs sm:text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-gray-300">
                  Title
                </th>
                <th className="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-white/50">
                  Date
                </th>
                <th className="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-white/50">
                  Status
                </th>
                <th className="whitespace-nowrap px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-[0.08em] text-white/50">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-transparent">
              {filteredNews.map((n) => (
                <tr key={n.id} className="transition-colors duration-200 hover:bg-white/10">
                  <td className="px-5 py-4">
                    <p className="line-clamp-1 text-sm font-semibold text-gray-100">{n.title}</p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-300">{n.date}</td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-all duration-200 ${statusClasses[n.status]}`}>
                      {n.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => openEdit(n)}
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight text-white">
              {editing ? "Edit Article" : "Add Article"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-300">Title</Label>
              <Input
                value={form.title}
                onChange={(e) => {
                  setForm({ ...form, title: e.target.value });
                  if (titleError) setTitleError("");
                }}
                className={titleError ? "h-10 border-red-300 focus-visible:ring-red-200" : "h-10"}
              />
              {titleError && <p className="text-xs text-red-400">{titleError}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-300">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="min-h-[96px]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-300">Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="h-10"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-300">Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as NewsStatus })}
                  className="h-10 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-gray-100 shadow-sm backdrop-blur-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-300">Image URL</Label>
              <Input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="h-10"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setFormOpen(false)} className="h-9">
                Cancel
              </Button>
              <Button onClick={handleSave} className="h-9">
                {editing ? "Update Article" : "Publish Article"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteModal open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete article" />
    </div>
  );
};

export default NewsPage;
