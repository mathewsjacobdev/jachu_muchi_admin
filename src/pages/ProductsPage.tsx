import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DeleteModal from "@/components/shared/DeleteModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteCourse, getCourses, type CourseListItem } from "@/api/services/course.service";

const CARD_FALLBACK = "https://via.placeholder.com/400x200?text=Course";

type CourseCardProps = {
  course: CourseListItem;
  onEdit: (id: number) => void;
  onRequestDelete: (id: number) => void;
};

const CourseCard = memo(function CourseCard({ course, onEdit, onRequestDelete }: CourseCardProps) {
  const name = course.courseName || "Untitled course";
  const type = course.type || "General";
  const keyDetails = course.keyDetails || "";
  const duration = course.duration ?? "N/A";
  const eligibility = course.eligibility?.trim() ? course.eligibility : "N/A";

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-lg transition-all duration-300 hover:shadow-2xl">
      <div className="h-44 w-full overflow-hidden bg-slate-800">
        <img
          src={course.image || CARD_FALLBACK}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-44 w-full object-cover"
          onError={(e) => {
            e.currentTarget.src = CARD_FALLBACK;
          }}
        />
      </div>

      <div className="space-y-3 p-4">
        <h3 className="text-lg font-semibold text-white">{name}</h3>

        <span className="inline-block rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-300">
          {type}
        </span>

        <div className="space-y-1 text-sm text-gray-400">
          <p>Duration: {duration}</p>
          <p>Eligibility: {eligibility}</p>
        </div>

        <p className="line-clamp-2 text-sm text-gray-300">
          {keyDetails || "No key details available."}
        </p>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => onEdit(course.id)}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
            aria-label={`Edit ${name}`}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onRequestDelete(course.id)}
            className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-red-700"
            aria-label={`Delete ${name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
});

const ProductsPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const data = await getCourses(controller.signal);
        if (!cancelled) setCourses(data);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        if (!cancelled) console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const filtered = useMemo(() => {
    if (!deferredSearch) return courses;
    return courses.filter((course) => {
      const q = deferredSearch;
      return (
        course.courseName.toLowerCase().includes(q) ||
        course.keyDetails.toLowerCase().includes(q) ||
        course.type.toLowerCase().includes(q) ||
        course.duration.toLowerCase().includes(q) ||
        course.eligibility.toLowerCase().includes(q)
      );
    });
  }, [courses, deferredSearch]);

  const onEdit = useCallback(
    (id: number) => {
      navigate(`/courses/edit/${id}`);
    },
    [navigate],
  );

  const onRequestDelete = useCallback((id: number) => {
    setDeleteId(id);
  }, []);

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteCourse(String(deleteId));
      setCourses((prev) => prev.filter((course) => course.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-12 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading courses…</p>
      </div>
    );
  }

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
          <Input
            placeholder="Search courses…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/20 bg-white/10 p-8 text-center text-sm text-white/50 backdrop-blur-lg">
          No courses found
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onEdit={onEdit}
              onRequestDelete={onRequestDelete}
            />
          ))}
        </div>
      )}

      <DeleteModal
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        onConfirm={handleDelete}
        title="Delete course"
        description="This course will be permanently removed."
      />
    </div>
  );
};

export default ProductsPage;
