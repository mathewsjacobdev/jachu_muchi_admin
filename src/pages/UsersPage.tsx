import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DeleteModal from "@/components/shared/DeleteModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  createManagedUser,
  deleteManagedUserApi,
  getManagedUsers,
  updateManagedUserApi,
  type ManagedUser,
  type ManagedUserRole,
  type ManagedUserStatus,
} from "@/api/services/managedUser.service";

const roleClasses: Record<ManagedUserRole, string> = {
  Admin: "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  "Sub Admin": "border border-blue-500/30 bg-blue-500/15 text-blue-300",
  Editor: "border border-purple-500/30 bg-purple-500/15 text-purple-300",
};

const statusClasses: Record<ManagedUserStatus, string> = {
  Active: "border border-green-500/30 bg-green-500/15 text-green-300",
  Inactive: "border border-white/15 bg-white/10 text-gray-400",
};

const emptyForm = {
  name: "",
  email: "",
  role: "Sub Admin" as ManagedUserRole,
  status: "Active" as ManagedUserStatus,
};

const UsersPage = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        setUsers(await getManagedUsers());
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) =>
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  }, [users, search]);

  const totalPages = useMemo(() => {
    const total = Math.ceil(filteredUsers.length / pageSize);
    return total > 0 ? total : 1;
  }, [filteredUsers.length, pageSize]);

  useEffect(() => setPage(1), [search, pageSize]);
  useEffect(() => setPage((p) => Math.min(p, totalPages)), [totalPages]);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

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

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateManagedUserApi(editing.id, form);
        setUsers((prev) =>
          prev.map((user) => user.id === editing.id ? { ...user, ...form } : user),
        );
      } else {
        const created = await createManagedUser(form);
        setUsers((prev) => [created, ...prev]);
      }
      setFormOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setUsers((prev) => prev.filter((user) => user.id !== deleteId));
    setDeleteId(null);
    try {
      await deleteManagedUserApi(deleteId);
    } catch (e) {
      console.error(e);
    }
  };

  const updateRole = async (id: string, role: ManagedUserRole) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const next = { ...user, role };
    setUsers((prev) => prev.map((u) => (u.id === id ? next : u)));
    try {
      await updateManagedUserApi(id, next);
    } catch (e) {
      console.error(e);
      setUsers((prev) => prev.map((u) => (u.id === id ? user : u)));
    }
  };

  const toggleStatus = async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const status: ManagedUserStatus = user.status === "Active" ? "Inactive" : "Active";
    const next = { ...user, status };
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? next : u)),
    );
    try {
      await updateManagedUserApi(id, next);
    } catch (e) {
      console.error(e);
      setUsers((prev) => prev.map((u) => (u.id === id ? user : u)));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description={isLoading ? "Loading…" : `${users.length} admin users`}
        action={(
          <Button onClick={openAdd} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add User
          </Button>
        )}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="max-w-sm w-full">
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

        <div className="flex justify-end">
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-lg hover:bg-white/10 data-[placeholder]:text-gray-300 sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border border-white/10 bg-slate-900 text-white">
              {[6, 9, 12].map((size) => (
                <SelectItem
                  key={size}
                  value={String(size)}
                  className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200"
                >
                  {size}/page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Loading users…</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 bg-white/10 p-8 text-center text-sm text-white/60 backdrop-blur-lg">
          No users found.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedUsers.map((user) => (
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
                <Select value={user.role} onValueChange={(value) => void updateRole(user.id, value as ManagedUserRole)}>
                  <SelectTrigger aria-label={`Change role for ${user.name}`} className="h-9 rounded-lg border border-white/20 bg-white/10 px-2.5 text-xs text-white backdrop-blur-lg hover:bg-white/10 data-[placeholder]:text-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border border-white/10 bg-slate-900 text-white">
                    <SelectItem className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value="Admin">Admin</SelectItem>
                    <SelectItem className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value="Sub Admin">Sub Admin</SelectItem>
                    <SelectItem className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value="Editor">Editor</SelectItem>
                  </SelectContent>
                </Select>

                <Button type="button" variant="outline" size="sm" onClick={() => void toggleStatus(user.id)}>
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

          {totalPages > 1 ? (
            <div className="pt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((p) => Math.max(1, p - 1));
                      }}
                      className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>
                  {(() => {
                    const window = 2;
                    const start = Math.max(1, page - window);
                    const end = Math.min(totalPages, page + window);
                    const showLeftEllipsis = start > 1;
                    const showRightEllipsis = end < totalPages;
                    const pagesToShow: number[] = [];
                    for (let p = start; p <= end; p++) pagesToShow.push(p);
                    return (
                      <>
                        {showLeftEllipsis ? (
                          <PaginationItem>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(1);
                              }}
                              isActive={page === 1}
                            >
                              1
                            </PaginationLink>
                          </PaginationItem>
                        ) : null}
                        {showLeftEllipsis ? <PaginationEllipsis /> : null}
                        {pagesToShow.map((p) => (
                          <PaginationItem key={p}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(p);
                              }}
                              isActive={p === page}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        {showRightEllipsis ? <PaginationEllipsis /> : null}
                        {showRightEllipsis ? (
                          <PaginationItem>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(totalPages);
                              }}
                              isActive={page === totalPages}
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        ) : null}
                      </>
                    );
                  })()}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((p) => Math.min(totalPages, p + 1));
                      }}
                      className={page >= totalPages ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              <div className="mt-3 text-center text-sm text-gray-400">
                Showing{" "}
                {Math.min((page - 1) * pageSize + 1, filteredUsers.length)}-
                {Math.min(page * pageSize, filteredUsers.length)} of {filteredUsers.length}
              </div>
            </div>
          ) : null}
        </>
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
                <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value as ManagedUserRole })}>
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
                <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as ManagedUserStatus })}>
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
            <Button disabled={saving} onClick={() => void handleSave()} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
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
