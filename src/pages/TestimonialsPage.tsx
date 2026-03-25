import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
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
import DeleteModal from "@/components/shared/DeleteModal";
import type { Testimonial } from "@/lib/testimonial-store";
import { deleteTestimonialApi, getTestimonials } from "@/api/services/testimonial.service";

const TestimonialsPage = () => {
  const navigate = useNavigate();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<"All" | string>("All");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  useEffect(() => {
    const fetchList = async () => {
      setIsLoading(true);
      try {
        setTestimonials(await getTestimonials());
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchList();
  }, []);

  const courseOptions = useMemo(
    () => ["All", ...Array.from(new Set(testimonials.map((item) => item.course).filter(Boolean)))],
    [testimonials],
  );

  const filteredTestimonials = useMemo(
    () => testimonials.filter((item) =>
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.course.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedCourse === "All" || item.course === selectedCourse)
    ),
    [testimonials, searchTerm, selectedCourse],
  );

  const totalPages = useMemo(() => {
    const total = Math.ceil(filteredTestimonials.length / pageSize);
    return total > 0 ? total : 1;
  }, [filteredTestimonials.length, pageSize]);

  useEffect(() => setPage(1), [searchTerm, selectedCourse, pageSize]);
  useEffect(() => setPage((p) => Math.min(p, totalPages)), [totalPages]);

  const paginatedTestimonials = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTestimonials.slice(start, start + pageSize);
  }, [filteredTestimonials, page, pageSize]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setTestimonials((prev) => prev.filter((t) => t.id !== deleteId));
    setDeleteId(null);
    try {
      await deleteTestimonialApi(deleteId);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Testimonials Management"
        description={
          isLoading ? "Loading testimonials…" : `${testimonials.length} testimonials`
        }
        action={(
          <Button onClick={() => navigate("/testimonials/add")} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add Testimonial
          </Button>
        )}
      />

      <div className="rounded-xl border border-white/20 bg-white/10 p-3 shadow-lg backdrop-blur-lg sm:p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:max-w-md">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or course..."
              className="h-10 rounded-lg border-white/20 bg-white/10 text-gray-100 placeholder:text-gray-400"
            />
          </div>
          <div className="w-full md:w-60">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="h-10 w-full rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-lg hover:bg-white/10 data-[placeholder]:text-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border border-white/10 bg-slate-900 text-white">
                {courseOptions.map((course) => (
                  <SelectItem key={course} className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value={course}>
                    {course}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3 flex w-full items-center justify-end md:mt-0">
            <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setPage(1); }}>
              <SelectTrigger className="h-10 w-full rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-lg hover:bg-white/10 data-[placeholder]:text-gray-300 sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border border-white/10 bg-slate-900 text-white">
                {[6, 9, 12].map((size) => (
                  <SelectItem key={size} value={String(size)} className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200">
                    {size}/page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : filteredTestimonials.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 bg-white/10 p-8 text-center text-sm text-gray-300 backdrop-blur-lg">
          No testimonials found
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedTestimonials.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/80 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl sm:p-4 md:p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white/90">{item.name}</p>
                  <p className="text-xs text-white/50">{item.course}</p>
                </div>
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/15 text-xs font-semibold text-blue-300">
                    {item.name.slice(0, 1)}
                  </div>
                )}
              </div>
              <p className="text-sm leading-6 text-white/70">{item.message}</p>
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={() => navigate(`/testimonials/edit/${item.id}`)} className="rounded-lg p-2 text-blue-400 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setDeleteId(item.id)} className="rounded-lg p-2 text-red-400 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10">
                  <Trash2 className="h-4 w-4" />
                </button>
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
                {Math.min((page - 1) * pageSize + 1, filteredTestimonials.length)}-
                {Math.min(page * pageSize, filteredTestimonials.length)} of{" "}
                {filteredTestimonials.length}
              </div>
            </div>
          ) : null}
        </>
      )}

      <DeleteModal open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete testimonial" />
    </div>
  );
};

export default TestimonialsPage;
