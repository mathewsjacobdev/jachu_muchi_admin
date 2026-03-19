import { useState } from "react";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { Product } from "@/types";
import PageHeader from "@/components/shared/PageHeader";
import DeleteModal from "@/components/shared/DeleteModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

type CourseStatus = "Active" | "Inactive";
type Course = Product & { status: CourseStatus };

const emptyCourse: Omit<Course, "id" | "createdAt"> = {
  name: "",
  category: "",
  price: 0,
  stock: 0,
  image: "",
  status: "Active",
};

const ProductsPage = () => {
  const [courses, setCourses] = useState<Course[]>(
    MOCK_PRODUCTS.map((item) => ({
      ...item,
      status: item.stock > 0 ? "Active" : "Inactive",
    })),
  );
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState(emptyCourse);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = courses.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditing(null); setForm(emptyCourse); setFormOpen(true); };
  const openEdit = (p: Course) => { setEditing(p); setForm({ name: p.name, category: p.category, price: p.price, stock: p.stock, image: p.image, status: p.status }); setFormOpen(true); };

  const handleSave = () => {
    if (!form.name || !form.category) return;
    if (editing) {
      setCourses(courses.map((p) => p.id === editing.id ? { ...p, ...form } : p));
    } else {
      setCourses([{ id: Date.now().toString(), createdAt: new Date().toISOString().split("T")[0], ...form }, ...courses]);
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) setCourses(courses.filter((p) => p.id !== deleteId));
    setDeleteId(null);
  };

  const updateStatus = (id: string, status: CourseStatus) => {
    setCourses((prev) => prev.map((course) => (course.id === id ? { ...course, status } : course)));
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Courses" description={`${courses.length} total courses`} action={<Button onClick={openAdd} size="sm"><Plus className="mr-1 h-4 w-4" />Add Course</Button>} />

      <div className="mb-4 max-w-xs">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
          <Input placeholder="Search courses..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-1 text-white/80 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-white/5">
            <tr className="border-b text-left transition-colors duration-200 hover:bg-white/10">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white/50">Course</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stock</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filtered.map((p) => (
              <tr key={p.id} className="transition-colors duration-200 hover:bg-white/10">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt={p.name} className="h-10 w-10 rounded-md object-cover" />
                    <span className="font-medium text-white/90">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-white/65">{p.category}</td>
                <td className="px-4 py-4 text-right tabular-nums text-white/85">₹{p.price.toLocaleString()}</td>
                <td className={`px-4 py-4 text-right tabular-nums ${p.stock < 10 ? "font-medium text-red-400" : "text-white/85"}`}>{p.stock}</td>
                <td className="px-4 py-4">
                  <select
                    value={p.status}
                    onChange={(e) => updateStatus(p.id, e.target.value as CourseStatus)}
                    className="h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-xs font-medium text-white/85 backdrop-blur-md"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-blue-400 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setDeleteId(p.id)} className="rounded-lg p-2 text-red-400 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-sm text-white/50">No courses found</div>}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Course" : "Add Course"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5"><Label className="text-white/50">Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="flex flex-col gap-1.5"><Label className="text-white/50">Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5"><Label className="text-white/50">Price (₹)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
              <div className="flex flex-col gap-1.5"><Label className="text-white/50">Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-white/50">Status</Label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as CourseStatus })}
                className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white/85 backdrop-blur-md"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5"><Label className="text-white/50">Image URL</Label><Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></div>
            <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Add"} Course</Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteModal open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete course" description="This course will be permanently removed." />
    </div>
  );
};

export default ProductsPage;
