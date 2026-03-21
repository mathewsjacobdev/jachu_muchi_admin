import { useMemo, useState } from "react";
import { MOCK_USERS } from "@/lib/mock-data";
import PageHeader from "@/components/shared/PageHeader";
import DeleteModal from "@/components/shared/DeleteModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

type UserRole = "Admin" | "Sub Admin" | "Editor";
type UserStatus = "Active" | "Inactive";

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

const roleClasses: Record<UserRole, string> = {
  Admin: "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  "Sub Admin": "border border-blue-500/30 bg-blue-500/15 text-blue-300",
  Editor: "border border-purple-500/30 bg-purple-500/15 text-purple-300",
};

const statusClasses: Record<UserStatus, string> = {
  Active: "border border-green-500/30 bg-green-500/15 text-green-300",
  Inactive: "border border-white/15 bg-white/10 text-gray-400",
};

const emptyForm = {
  name: "",
  email: "",
  role: "Sub Admin" as UserRole,
  status: "Active" as UserStatus,
};

const seedUsers: ManagedUser[] = MOCK_USERS.map((user, index) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: index % 3 === 0 ? "Admin" : index % 3 === 1 ? "Sub Admin" : "Editor",
  status: index % 4 === 0 ? "Inactive" : "Active",
}));

const UsersPage = () => {
  const [users, setUsers] = useState<ManagedUser[]>(seedUsers);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) =>
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  }, [users, search]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (user: ManagedUser) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) return;

    if (editing) {
      setUsers((prev) =>
        prev.map((user) => user.id === editing.id ? { ...user, ...form } : user),
      );
    } else {
      setUsers((prev) => [
        { id: Date.now().toString(), ...form },
        ...prev,
      ]);
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      setUsers((prev) => prev.filter((user) => user.id !== deleteId));
    }
    setDeleteId(null);
  };

  const updateRole = (id: string, role: UserRole) => {
    setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, role } : user)));
  };

  const toggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id
          ? { ...user, status: user.status === "Active" ? "Inactive" : "Active" }
          : user,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description={`${users.length} admin users`}
        action={(
          <Button onClick={openAdd} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add User
          </Button>
        )}
      />

      <div className="max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
          <Input
            placeholder="Search users..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 bg-white/10 p-8 text-center text-sm text-white/60 backdrop-blur-lg">
          No users found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="rounded-xl border border-white/20 bg-white/10 p-5 shadow-lg backdrop-blur-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                <p className="text-sm text-gray-300">{user.email}</p>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${roleClasses[user.role]}`}>
                  {user.role}
                </span>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[user.status]}`}>
                  {user.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Select value={user.role} onValueChange={(value) => updateRole(user.id, value as UserRole)}>
                  <SelectTrigger aria-label={`Change role for ${user.name}`} className="h-9 rounded-lg border border-white/20 bg-white/10 px-2.5 text-xs text-white backdrop-blur-lg hover:bg-white/10 data-[placeholder]:text-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border border-white/10 bg-slate-900 text-white">
                    <SelectItem className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value="Admin">Admin</SelectItem>
                    <SelectItem className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value="Sub Admin">Sub Admin</SelectItem>
                    <SelectItem className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value="Editor">Editor</SelectItem>
                  </SelectContent>
                </Select>

                <Button type="button" variant="outline" size="sm" onClick={() => toggleStatus(user.id)}>
                  {user.status === "Active" ? "Deactivate" : "Activate"}
                </Button>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => openEdit(user)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-red-300 hover:text-red-200"
                  onClick={() => setDeleteId(user.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="border-white/20 bg-white/10 backdrop-blur-lg sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-white/80">Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-white/80">Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-white/80">Role</Label>
                <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value as UserRole })}>
                  <SelectTrigger className="h-10 rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-lg hover:bg-white/10 data-[placeholder]:text-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border border-white/10 bg-slate-900 text-white">
                    <SelectItem className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value="Admin">Admin</SelectItem>
                    <SelectItem className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value="Sub Admin">Sub Admin</SelectItem>
                    <SelectItem className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value="Editor">Editor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-white/80">Status</Label>
                <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as UserStatus })}>
                  <SelectTrigger className="h-10 rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-lg hover:bg-white/10 data-[placeholder]:text-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border border-white/10 bg-slate-900 text-white">
                    <SelectItem className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value="Active">Active</SelectItem>
                    <SelectItem className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSave} className="w-full">
              {editing ? "Update" : "Add"} User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteModal
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete user"
      />
    </div>
  );
};

export default UsersPage;
