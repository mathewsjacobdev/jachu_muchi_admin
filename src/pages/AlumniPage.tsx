import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Pencil, Trash2, User } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import DeleteModal from "@/components/shared/DeleteModal";
import type { Alumni } from "@/lib/alumni-store";
import { deleteAlumniApi, getAlumniList } from "@/api/services/alumni.service";

const AlumniPage = () => {
  const navigate = useNavigate();
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchList = async () => {
      setIsLoading(true);
      try {
        setAlumni(await getAlumniList());
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchList();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setAlumni((prev) => prev.filter((item) => item.id !== deleteId));
    setDeleteId(null);
    try {
      await deleteAlumniApi(deleteId);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alumni Management"
        description={
          isLoading ? "Loading alumni…" : `${alumni.length} alumni profiles`
        }
        action={(
          <Button onClick={() => navigate("/alumni/add")} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add Alumni
          </Button>
        )}
      />

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {alumni.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#0f172a] to-[#1e293b] shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="relative h-40 w-full bg-gradient-to-br from-slate-800/80 to-slate-900/90">
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className="h-16 w-16 text-white/25" aria-hidden />
                  </div>
                )}
              </div>

              <div className="space-y-1 px-4 pb-4 pt-3">
                <h3 className="font-semibold text-white">{item.name}</h3>
                <p className="text-sm text-gray-400">{item.role}</p>
                <p className="text-sm text-blue-400">{item.company}</p>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
                <button
                  type="button"
                  onClick={() => navigate(`/alumni/edit/${item.id}`)}
                  className="rounded-lg bg-white/10 p-2 text-blue-300 transition-colors hover:bg-white/20"
                  aria-label={`Edit ${item.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(item.id)}
                  className="rounded-lg bg-white/10 p-2 text-red-300 transition-colors hover:bg-white/20"
                  aria-label={`Delete ${item.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteModal
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete alumni"
      />
    </div>
  );
};

export default AlumniPage;
