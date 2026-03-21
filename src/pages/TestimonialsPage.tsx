import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DeleteModal from "@/components/shared/DeleteModal";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { listTestimonials, removeTestimonial, Testimonial } from "@/lib/testimonial-store";

const TestimonialsPage = () => {
  const navigate = useNavigate();
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => listTestimonials());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<"All" | string>("All");

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

  const handleDelete = () => {
    if (deleteId) {
      removeTestimonial(deleteId);
      setTestimonials(listTestimonials());
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Testimonials Management"
        description={`${testimonials.length} testimonials`}
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
        </div>
      </div>

      {filteredTestimonials.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 bg-white/10 p-8 text-center text-sm text-gray-300 backdrop-blur-lg">
          No testimonials found
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTestimonials.map((item) => (
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
                <button onClick={() => navigate(`/testimonials/edit/${item.id}`)} className="rounded-lg p-2 text-blue-400 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleteId(item.id)} className="rounded-lg p-2 text-red-400 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteModal open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete testimonial" />
    </div>
  );
};

export default TestimonialsPage;
