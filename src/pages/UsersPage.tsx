import { useMemo, useState } from "react";
import { MOCK_USERS } from "@/lib/mock-data";
import { User } from "@/types";
import PageHeader from "@/components/shared/PageHeader";
import DeleteModal from "@/components/shared/DeleteModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

type UserRole = "Customer" | "VIP" | "Admin";

const roleClasses: Record<UserRole, string> = {
  Customer: "border border-white/10 bg-white/10 text-white/80",
  VIP: "border border-blue-500/30 bg-blue-500/20 text-blue-400",
  Admin: "border border-green-500/30 bg-green-500/20 text-green-400",
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const emptyForm = {
  name: "",
  email: "",
  role: "Customer" as UserRole,
  joinedAt: new Date().toISOString().split("T")[0],
};

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      );
    });
  }, [users, search]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      joinedAt: new Date().toISOString().split("T")[0],
    });
    setFormOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      joinedAt: user.joinedAt,
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) return;

    const nextUser: Omit<User, "id" | "avatar"> = {
      name: form.name,
      email: form.email,
      role: form.role,
      joinedAt: form.joinedAt,
    };

    if (editing) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === editing.id
            ? { ...user, ...nextUser, avatar: getInitials(nextUser.name) }
            : user,
        ),
      );
    } else {
      setUsers((prev) => [
        {
          id: Date.now().toString(),
          ...nextUser,
          avatar: getInitials(nextUser.name),
        },
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description={`${users.length} registered users`}
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

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-1 text-white/80 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-white/5">
            <tr className="border-b text-left transition-colors duration-200 hover:bg-white/10">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white/50">User</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Joined</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="transition-colors duration-200 hover:bg-white/10">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/15 text-xs font-semibold text-blue-300">
                      {u.avatar}
                    </div>
                    <span className="font-medium text-white/90">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-white/65">{u.email}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${roleClasses[(u.role as UserRole) ?? "Customer"]}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-4 text-white/55">{u.joinedAt}</td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(u)}
                      className="rounded-lg p-2 text-blue-400 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10"
                      aria-label={`Edit ${u.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(u.id)}
                      className="rounded-lg p-2 text-red-400 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10"
                      aria-label={`Delete ${u.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-sm text-white/50">No users found</div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-white/50">Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-white/50">Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-white/50">Role</Label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white/85 backdrop-blur-md"
                >
                  <option value="Customer">Customer</option>
                  <option value="VIP">VIP</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-white/50">Joined</Label>
                <Input
                  type="date"
                  value={form.joinedAt}
                  onChange={(e) => setForm({ ...form, joinedAt: e.target.value })}
                />
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
