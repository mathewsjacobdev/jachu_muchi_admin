import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import DeleteModal from "@/components/shared/DeleteModal";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable";

interface Alumni {
  id: string;
  name: string;
  company: string;
  role: string;
}

const initialAlumni: Alumni[] = [
  { id: "1", name: "Aditi Rao", company: "Infosys", role: "Software Engineer" },
  { id: "2", name: "Vivek Mehta", company: "TCS", role: "Data Analyst" },
];

const emptyForm: Omit<Alumni, "id"> = {
  name: "",
  company: "",
  role: "",
};

const AlumniPage = () => {
  const [alumni, setAlumni] = useState<Alumni[]>(initialAlumni);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Alumni | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (item: Alumni) => {
    setEditing(item);
    setForm({
      name: item.name,
      company: item.company,
      role: item.role,
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editing) {
      setAlumni((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...form } : x)));
    } else {
      setAlumni((prev) => [{ id: Date.now().toString(), ...form }, ...prev]);
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      setAlumni((prev) => prev.filter((x) => x.id !== deleteId));
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alumni Management"
        description={`${alumni.length} alumni profiles`}
        action={(
          <Button onClick={openAdd} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add Alumni
          </Button>
        )}
      />

      <ResponsiveTable
        data={alumni}
        columns={[
          {
            key: "name",
            header: "Name",
            render: (item) => <span className="font-medium text-white/90">{item.name}</span>,
            renderMobile: (item) => <span className="text-white/90">{item.name}</span>,
          },
          {
            key: "company",
            header: "Company",
            render: (item) => <span className="text-white/65">{item.company}</span>,
            renderMobile: (item) => <span className="text-white/65">{item.company}</span>,
          },
          {
            key: "role",
            header: "Role",
            render: (item) => <span className="text-white/65">{item.role}</span>,
            renderMobile: (item) => <span className="text-white/65">{item.role}</span>,
          },
        ]}
        renderActions={(item) => (
          <>
            <button
              onClick={() => openEdit(item)}
              className="rounded-lg p-2 text-blue-400 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10"
              aria-label={`Edit ${item.name}`}
              type="button"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeleteId(item.id)}
              className="rounded-lg p-2 text-red-400 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10"
              aria-label={`Delete ${item.name}`}
              type="button"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Alumni" : "Add Alumni"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-white/50">Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/50">Company</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/50">Role</Label>
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </div>
            <Button onClick={handleSave} className="w-full">
              {editing ? "Update" : "Add"} Alumni
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteModal open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete alumni" />
    </div>
  );
};

export default AlumniPage;
