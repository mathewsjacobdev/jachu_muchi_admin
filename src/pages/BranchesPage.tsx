import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DeleteModal from "@/components/shared/DeleteModal";
import { Branch, listBranches, removeBranch } from "@/lib/branch-store";

const BranchesPage = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>(() => listBranches());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (deleteId) {
      removeBranch(deleteId);
      setBranches(listBranches());
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branch Management"
        description={`${branches.length} branches`}
        action={(
          <Button onClick={() => navigate("/branches/new")} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add Branch
          </Button>
        )}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => (
          <div
            key={branch.id}
            className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-white">{branch.name}</h3>

            <div className="mt-3 space-y-2 text-sm text-gray-400">
              <div>
                <span className="text-gray-500">Phone</span>
                {branch.phones.length > 0 ? (
                  <ul className="mt-1 list-inside list-disc space-y-0.5 text-gray-300">
                    {branch.phones.map((phone, i) => (
                      <li key={`${branch.id}-phone-${i}`}>{phone}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-gray-500">—</p>
                )}
              </div>
              <p>
                <span className="text-gray-500">Email</span> · {branch.email}
              </p>
              <p>
                <span className="text-gray-500">Location</span> · {branch.location}
              </p>
              <p>
                <a
                  href={branch.mapUrl}
                  className="text-blue-400 transition-colors hover:text-blue-300 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Map
                </a>
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                  branch.status === "Active"
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                    : "border-white/15 bg-white/10 text-gray-400"
                }`}
              >
                {branch.status}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/branches/edit/${branch.id}`)}
                  className="rounded-lg bg-white/10 p-2 text-blue-300 transition-colors hover:bg-white/20"
                  aria-label={`Edit ${branch.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(branch.id)}
                  className="rounded-lg bg-white/10 p-2 text-red-300 transition-colors hover:bg-white/20"
                  aria-label={`Delete ${branch.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <DeleteModal
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete branch"
      />
    </div>
  );
};

export default BranchesPage;
