import { useState } from "react";
import { MOCK_CATEGORIES } from "@/lib/mock-data";
import { Category } from "@/types";
import PageHeader from "@/components/shared/PageHeader";
import DeleteModal from "@/components/shared/DeleteModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openAdd = () => { setEditing(null); setName(""); setFormOpen(true); };
  const openEdit = (c: Category) => { setEditing(c); setName(c.name); setFormOpen(true); };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editing) {
      setCategories(categories.map((c) => c.id === editing.id ? { ...c, name } : c));
    } else {
      setCategories([{ id: Date.now().toString(), name, productCount: 0 }, ...categories]);
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) setCategories(categories.filter((c) => c.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Categories" description={`${categories.length} categories`} action={<Button onClick={openAdd} size="sm"><Plus className="mr-1 h-4 w-4" />Add Category</Button>} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-white/80 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl sm:p-4 md:p-5">
            <div>
              <p className="font-medium text-white/90">{c.name}</p>
              <p className="text-xs text-white/50">{c.productCount} products</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(c)} className="rounded-lg p-2 text-blue-400 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => setDeleteId(c.id)} className="rounded-lg p-2 text-red-400 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5"><Label className="text-white/50">Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Add"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteModal open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
};

export default CategoriesPage;
