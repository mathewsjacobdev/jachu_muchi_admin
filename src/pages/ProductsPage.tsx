import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DeleteModal from "@/components/shared/DeleteModal";
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
import { deleteCourse, getCourses, type CourseListItem } from "@/api/services/course.service";

const CARD_FALLBACK = "https://via.placeholder.com/400x200?text=Course";

type CourseCardProps = {
  course: CourseListItem;
  onEdit: (id: string) => void;
  onRequestDelete: (id: string) => void;
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
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const data = await getCourses(controller.signal);
        console.log({data});
        
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

  const totalPages = useMemo(() => {
    const total = Math.ceil(filtered.length / pageSize);
    return total > 0 ? total : 1;
  }, [filtered.length, pageSize]);

  useEffect(() => setPage(1), [deferredSearch, pageSize]);
  useEffect(() => setPage((p) => Math.min(p, totalPages)), [totalPages]);

  const paginatedCourses = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const onEdit = useCallback(
    (id: string) => {
      const selectedCourse = courses.find((course) => course.id === id);
      navigate(`/courses/edit/${id}`, {
        state: selectedCourse ? { course: selectedCourse } : undefined,
      });
    },
    [courses, navigate],
  );

  const onRequestDelete = useCallback((id: string) => {
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

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xs">
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

        <div className="flex w-full items-center justify-end md:w-auto">
          <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
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
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/20 bg-white/10 p-8 text-center text-sm text-white/50 backdrop-blur-lg">
          No courses found
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onEdit={onEdit}
              onRequestDelete={onRequestDelete}
            />
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
                {Math.min((page - 1) * pageSize + 1, filtered.length)}-
                {Math.min(page * pageSize, filtered.length)} of {filtered.length}
              </div>
            </div>
          ) : null}
        </>
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
