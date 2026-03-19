import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import DeleteModal from "@/components/shared/DeleteModal";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  message: string;
  course: string;
  image: string;
}

const initialTestimonials: Testimonial[] = [
  {
    id: "1",
    name: "Sneha Gupta",
    message: "Amazing support and excellent faculty guidance throughout the course.",
    course: "Digital Marketing",
    image: "",
  },
  {
    id: "2",
    name: "Rohit Sharma",
    message: "The curriculum was practical and helped me get job-ready quickly.",
    course: "Data Analytics",
    image: "",
  },
];

const emptyForm: Omit<Testimonial, "id"> = {
  name: "",
  message: "",
  course: "",
  image: "",
};

const TestimonialsPage = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (item: Testimonial) => {
    setEditing(item);
    setForm({
      name: item.name,
      message: item.message,
      course: item.course,
      image: item.image,
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.message.trim()) return;
    if (editing) {
      setTestimonials((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...form } : x)));
    } else {
      setTestimonials((prev) => [{ id: Date.now().toString(), ...form }, ...prev]);
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      setTestimonials((prev) => prev.filter((x) => x.id !== deleteId));
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Testimonials Management"
        description={`${testimonials.length} testimonials`}
        action={(
          <Button onClick={openAdd} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add Testimonial
          </Button>
        )}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((item) => (
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
              <button onClick={() => openEdit(item)} className="rounded-lg p-2 text-blue-400 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => setDeleteId(item.id)} className="rounded-lg p-2 text-red-400 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-white/50">Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/50">Course</Label>
              <Input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/50">Message</Label>
              <Textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/50">Image (optional)</Label>
              <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            </div>
            <Button onClick={handleSave} className="w-full">
              {editing ? "Update" : "Add"} Testimonial
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteModal open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete testimonial" />
    </div>
  );
};

export default TestimonialsPage;
