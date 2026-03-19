import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DeleteModal from "@/components/shared/DeleteModal";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable";

type BranchStatus = "Active" | "Inactive";

interface Branch {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  mapUrl: string;
  status: BranchStatus;
}

const initialBranches: Branch[] = [
  {
    id: "1",
    name: "Main Campus Branch",
    phone: "+91 98765 43210",
    email: "main@opticadmin.com",
    location: "MG Road, Bengaluru",
    mapUrl: "https://maps.google.com",
    status: "Active",
  },
  {
    id: "2",
    name: "North Branch",
    phone: "+91 98989 12345",
    email: "north@opticadmin.com",
    location: "Hebbal, Bengaluru",
    mapUrl: "https://maps.google.com",
    status: "Inactive",
  },
];

const emptyBranch: Omit<Branch, "id"> = {
  name: "",
  phone: "",
  email: "",
  location: "",
  mapUrl: "",
  status: "Active",
};

const BranchesPage = () => {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState(emptyBranch);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyBranch);
    setFormOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setEditing(branch);
    setForm({
      name: branch.name,
      phone: branch.phone,
      email: branch.email,
      location: branch.location,
      mapUrl: branch.mapUrl,
      status: branch.status,
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;

    if (editing) {
      setBranches((prev) =>
        prev.map((branch) => (branch.id === editing.id ? { ...branch, ...form } : branch)),
      );
    } else {
      setBranches((prev) => [{ id: Date.now().toString(), ...form }, ...prev]);
    }

    setFormOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      setBranches((prev) => prev.filter((branch) => branch.id !== deleteId));
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branch Management"
        description={`${branches.length} branches`}
        action={(
          <Button onClick={openAdd} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add Branch
          </Button>
        )}
      />

      <ResponsiveTable
        data={branches}
        columns={[
          {
            key: "name",
            header: "Branch Name",
            render: (b) => <span className="font-medium text-white/90">{b.name}</span>,
            renderMobile: (b) => <span className="text-white/90">{b.name}</span>,
          },
          {
            key: "phone",
            header: "Phone",
            render: (b) => <span className="text-white/65">{b.phone}</span>,
            renderMobile: (b) => <span className="text-white/65">{b.phone}</span>,
          },
          {
            key: "email",
            header: "Email",
            render: (b) => <span className="text-white/65">{b.email}</span>,
            renderMobile: (b) => <span className="text-white/65">{b.email}</span>,
          },
          {
            key: "location",
            header: "Location",
            render: (b) => <span className="text-white/65">{b.location}</span>,
            renderMobile: (b) => <span className="text-white/65">{b.location}</span>,
          },
          {
            key: "mapUrl",
            header: "Map URL",
            render: (b) => (
              <a
                href={b.mapUrl}
                className="text-blue-400 hover:text-blue-300 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Open Map
              </a>
            ),
            renderMobile: (b) => (
              <a
                href={b.mapUrl}
                className="text-blue-400 hover:text-blue-300 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Open Map
              </a>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (b) => (
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                  b.status === "Active"
                    ? "border-green-500/30 bg-green-500/20 text-green-400"
                    : "border-white/10 bg-white/10 text-white/70"
                }`}
              >
                {b.status}
              </span>
            ),
            renderMobile: (b) => (
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                  b.status === "Active"
                    ? "border-green-500/30 bg-green-500/20 text-green-400"
                    : "border-white/10 bg-white/10 text-white/70"
                }`}
              >
                {b.status}
              </span>
            ),
          },
        ]}
        renderActions={(b) => (
          <>
            <button
              onClick={() => openEdit(b)}
              className="rounded-lg p-2 text-blue-400 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10"
              aria-label={`Edit ${b.name}`}
              type="button"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeleteId(b.id)}
              className="rounded-lg p-2 text-red-400 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10"
              aria-label={`Delete ${b.name}`}
              type="button"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Branch" : "Add Branch"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-white/50">Branch Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/50">Phone Number</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-white/50">Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/50">Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/50">Google Map URL</Label>
              <Input value={form.mapUrl} onChange={(e) => setForm({ ...form, mapUrl: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/50">Status</Label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as BranchStatus })}
                className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white/85 backdrop-blur-md"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <Button onClick={handleSave} className="w-full">
              {editing ? "Update Branch" : "Add Branch"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
