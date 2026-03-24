import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import DeleteModal from "@/components/shared/DeleteModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { deleteCourse, getCourses } from "@/api/services/course.service";

type CourseListItem = {
  id: number;
  courseName: string;
  type: string;
  duration: string;
  eligibility: string;
  keyDetails: string;
  image: string;
};

const ProductsPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await getCourses();

        const mapped = data.map((item: any) => ({
          id: item.id,
          courseName: item.title,
          keyDetails: item.body,
          type: "Demo Type",
          duration: "12 Months",
          eligibility: "Plus Two",
          image: "https://images.unsplash.com/photo-1581093458791-9d2c6c3f0c0f?w=600",
        }));

        setCourses(mapped);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filtered = useMemo(
    () =>
      courses.filter((course) => {
        const mappedCourseName = course.courseName ?? "";
        const mappedKeyDetails = course.keyDetails ?? "";
        const mappedType = course.type ?? "";
        const mappedDuration = course.duration ?? "";
        const query = search.toLowerCase();

        return (
          mappedCourseName.toLowerCase().includes(query) ||
          mappedKeyDetails.toLowerCase().includes(query) ||
          mappedType.toLowerCase().includes(query) ||
          mappedDuration.toLowerCase().includes(query)
        );
      }),
    [courses, search],
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCourse(String(deleteId));
      setCourses((prev) => prev.filter((course) => course.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading courses...</div>;
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
          <Input placeholder="Search courses..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/20 bg-white/10 p-8 text-center text-sm text-white/50 backdrop-blur-lg">
          No courses found
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => {
            const mappedCourseName = course.courseName || "Untitled course";
            const mappedType = course.type || "General";
            const mappedKeyDetails = course.keyDetails || "";
            const mappedDuration = course.duration ?? "N/A";
            const mappedEligibility = course.eligibility?.trim() ? course.eligibility : "N/A";

            return (
            <div
              key={course.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-lg transition-all duration-300 hover:shadow-2xl"
            >
              <div className="h-44 w-full overflow-hidden bg-slate-800">
                <img
                  src={course.image || "https://via.placeholder.com/400x200?text=Course"}
                  alt={course.courseName}
                  className="h-44 w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/400x200?text=Course";
                  }}
                />
              </div>

              <div className="space-y-3 p-4">
                <h3 className="text-lg font-semibold text-white">{mappedCourseName}</h3>

                <span className="inline-block rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-300">
                  {mappedType}
                </span>

                <div className="space-y-1 text-sm text-gray-400">
                  <p>Duration: {mappedDuration}</p>
                  <p>Eligibility: {mappedEligibility}</p>
                </div>

                <p className="line-clamp-2 text-sm text-gray-300">
                  {mappedKeyDetails || "No key details available."}
                </p>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/courses/edit/${course.id}`)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                    aria-label={`Edit ${mappedCourseName}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(course.id)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-red-700"
                    aria-label={`Delete ${mappedCourseName}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      <DeleteModal
        open={!!deleteId}
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
