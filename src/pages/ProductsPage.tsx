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
import { deleteCourse, filterCourses, getCourses, type CourseListItem } from "@/api/services/course.service";

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
  const [serverTotal, setServerTotal] = useState(0);
  const [allCourses, setAllCourses] = useState<CourseListItem[] | null>(null);

  const [status, setStatus] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const deferredSearch = useDeferredValue(search.trim());

  const hasFilter = deferredSearch !== "" || status !== "all" || dateFilter !== "" || order !== "desc";

  useEffect(() => setPage(1), [deferredSearch, pageSize, status, dateFilter, order]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        if (!hasFilter) {
          // If we already have all courses, we don't strictly *need* to re-fetch on page change, 
          // but calling the initial listing API ensures the data is up-to-date.
          const data = await getCourses(controller.signal);
          if (!cancelled) {
            setAllCourses(data);
            setServerTotal(data.length);
          }
        } else {
          const data = await filterCourses(
            {
              page,
              limit: pageSize,
              search: deferredSearch || undefined,
              status: status !== "all" ? status : undefined,
              date: dateFilter || undefined,
              order,
            },
            controller.signal
          );
          if (!cancelled) {
            setAllCourses(null); // clear local cache since we are using server filter
            setCourses(data.data);
            setServerTotal(data.total);
          }
        }
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
  }, [page, pageSize, deferredSearch, status, dateFilter, order, hasFilter]);

  const displayedCourses = useMemo(() => {
    if (!hasFilter && allCourses) {
      const start = (page - 1) * pageSize;
      return allCourses.slice(start, start + pageSize);
    }
    return courses;
  }, [hasFilter, allCourses, courses, page, pageSize]);

  const totalCourses = hasFilter ? serverTotal : (allCourses?.length ?? 0);
  const totalPages = Math.ceil(totalCourses / pageSize) || 1;

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
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
          <div className="relative w-full max-w-xs md:max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
            <Input
              placeholder="Search courses…"
              className="pl-8 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-[140px] h-10 rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-lg hover:bg-white/10 data-[placeholder]:text-gray-300">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="border border-white/10 bg-slate-900 text-white">
              <SelectItem value="all" className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200">All Status</SelectItem>
              <SelectItem value="Active" className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200">Active</SelectItem>
              <SelectItem value="Inactive" className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200">Inactive</SelectItem>
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

      {displayedCourses.length === 0 ? (
        <div className="rounded-xl border border-white/20 bg-white/10 p-8 text-center text-sm text-white/50 backdrop-blur-lg">
          No courses found
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayedCourses.map((course) => (
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
                {Math.min((page - 1) * pageSize + 1, totalCourses)}-
                {Math.min(page * pageSize, totalCourses)} of {totalCourses}
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
