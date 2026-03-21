import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import DeleteModal from "@/components/shared/DeleteModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Course, CourseStatus, listCourses, removeCourse, setCourseStatus } from "@/lib/course-store";

const ProductsPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>(() => listCourses());
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => courses.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase()) ||
    p.duration.toLowerCase().includes(search.toLowerCase())
  ), [courses, search]
  );

  const handleDelete = () => {
    if (deleteId) {
      removeCourse(deleteId);
      setCourses(listCourses());
    }
    setDeleteId(null);
  };

  const updateStatus = (id: string, status: CourseStatus) => {
    setCourseStatus(id, status);
    setCourses(listCourses());
  };

  const toggleStatus = (id: string, current: CourseStatus) => {
    updateStatus(id, current === "Active" ? "Inactive" : "Active");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description={`${courses.length} total courses`}
        action={(
          <Button onClick={() => navigate("/courses/new")} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add Course
          </Button>
        )}
      />

      <div className="mb-4 max-w-xs">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
          <Input placeholder="Search courses..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/20 bg-white/10 p-8 text-center text-sm text-white/50 backdrop-blur-lg">
          No courses found
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="group overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#0f172a] to-[#1e293b] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl"
            >
              <div className="relative h-44 w-full overflow-hidden rounded-t-xl">
                {p.image ? (
                  <img src={p.image} alt={p.title} className="h-44 w-full object-cover" />
                ) : (
                  <div className="flex h-44 w-full items-center justify-center bg-white/[0.06] text-xs font-medium text-gray-500">
                    No Image
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 rounded-t-xl bg-gradient-to-t from-black/40 to-transparent" />
              </div>

              <div className="space-y-3 p-4">
                <h3 className="text-lg font-semibold leading-snug text-white">{p.title}</h3>
                <p className="line-clamp-2 text-sm text-gray-400">{p.description}</p>

                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-gray-400">
                  <span>
                    <span className="text-gray-500">Duration</span> · {p.duration}
                  </span>
                  <span>
                    <span className="text-gray-500">Eligibility</span> ·{" "}
                    {p.eligibility?.trim() ? p.eligibility : "—"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    title="Click to toggle Active / Inactive"
                    onClick={() => toggleStatus(p.id, p.status)}
                    className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 ${
                      p.status === "Active"
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                        : "border-red-500/40 bg-red-500/15 text-red-300 hover:bg-red-500/25"
                    }`}
                  >
                    {p.status}
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/courses/edit/${p.id}`)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1 text-xs font-medium text-blue-300 transition-all duration-200 hover:bg-white/20"
                      aria-label={`Edit ${p.title}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(p.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1 text-xs font-medium text-red-300 transition-all duration-200 hover:bg-white/20"
                      aria-label={`Delete ${p.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteModal open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete course" description="This course will be permanently removed." />
    </div>
  );
};

export default ProductsPage;
