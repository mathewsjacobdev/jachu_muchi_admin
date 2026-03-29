import { useEffect, useMemo, useState, useDeferredValue } from "react";
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
  filterManagedUsers,
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
  password: "",
};

const UsersPage = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [allUsers, setAllUsers] = useState<ManagedUser[] | null>(null);
  const [serverTotal, setServerTotal] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const hasFilter = deferredSearch !== "" || statusFilter !== "All" || roleFilter !== "All" || dateFilter !== "" || order !== "desc";

  useEffect(() => setPage(1), [deferredSearch, statusFilter, roleFilter, pageSize, dateFilter, order]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const loadList = async () => {
      setIsLoading(true);
      try {
        if (!hasFilter) {
          const data = await getManagedUsers();
          if (!cancelled) {
            setAllUsers(data);
            setServerTotal(data.length);
          }
        } else {
          const data = await filterManagedUsers(
            {
              page,
              limit: pageSize,
              search: deferredSearch || undefined,
              status: statusFilter !== "All" ? statusFilter : undefined,
              type: roleFilter !== "All" ? roleFilter : undefined,
              date: dateFilter || undefined,
              order,
            },
            controller.signal
          );
          if (!cancelled) {
            setAllUsers(null);
            setUsers(data.data);
            setServerTotal(data.total);
          }
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        if (!cancelled) console.error(e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void loadList();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, pageSize, deferredSearch, statusFilter, roleFilter, dateFilter, order, hasFilter]);

  const displayedUsers = useMemo(() => {
    if (!hasFilter && allUsers) {
      const start = (page - 1) * pageSize;
      return allUsers.slice(start, start + pageSize);
    }
    return users;
  }, [hasFilter, allUsers, users, page, pageSize]);

  const totalItems = hasFilter ? serverTotal : (allUsers?.length ?? 0);
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  useEffect(() => setPage((p) => Math.min(p, totalPages)), [totalPages]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (user: ManagedUser) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      password: "",
    });
    setFormError("");
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    if (!editing && !form.password.trim()) {
      setFormError("Password is required.");
      return;
    }
    if (form.password.trim() && form.password.trim().length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      if (editing) {
        await updateManagedUserApi(editing.id, form);
        if (allUsers) {
          setAllUsers((prev) => (prev ?? []).map((user) => user.id === editing.id ? { ...user, ...form } : user));
        }
        setUsers((prev) =>
          prev.map((user) => user.id === editing.id ? { ...user, ...form } : user),
        );
      } else {
        const created = await createManagedUser(form);
        if (allUsers) {
          setAllUsers((prev) => [created, ...(prev ?? [])]);
        }
        setUsers((prev) => [created, ...prev]);
        setServerTotal((prev) => prev + 1);
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
    if (allUsers) {
      setAllUsers((prev) => (prev ?? []).filter((user) => user.id !== deleteId));
    }
    setServerTotal((prev) => Math.max(0, prev - 1));
    setDeleteId(null);
    try {
      await deleteManagedUserApi(deleteId);
    } catch (e) {
      console.error(e);
    }
  };

  const updateRole = async (id: string, role: ManagedUserRole) => {
    const user = (allUsers ?? users).find((u) => u.id === id);
    if (!user) return;
    const next = { ...user, role };
    setUsers((prev) => prev.map((u) => (u.id === id ? next : u)));
    if (allUsers) {
      setAllUsers((prev) => (prev ?? []).map((u) => (u.id === id ? next : u)));
    }
    try {
      await updateManagedUserApi(id, next);
    } catch (e) {
      console.error(e);
      setUsers((prev) => prev.map((u) => (u.id === id ? user : u)));
      if (allUsers) {
        setAllUsers((prev) => (prev ?? []).map((u) => (u.id === id ? user : u)));
      }
    }
  };

  const toggleStatus = async (id: string) => {
    const user = (allUsers ?? users).find((u) => u.id === id);
    if (!user) return;
    const status: ManagedUserStatus = user.status === "Active" ? "Inactive" : "Active";
    const next = { ...user, status };
    setUsers((prev) => prev.map((u) => (u.id === id ? next : u)));
    if (allUsers) {
      setAllUsers((prev) => (prev ?? []).map((u) => (u.id === id ? next : u)));
    }
    try {
      await updateManagedUserApi(id, next);
    } catch (e) {
      console.error(e);
      setUsers((prev) => prev.map((u) => (u.id === id ? user : u)));
      if (allUsers) {
        setAllUsers((prev) => (prev ?? []).map((u) => (u.id === id ? user : u)));
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description={isLoading ? "Loading…" : `${totalItems} admin users`}
        action={(
          <Button onClick={openAdd} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add User
          </Button>
        )}
      />

      <div className="flex flex-col gap-4 rounded-xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-lg transition-all duration-300 hover:shadow-2xl sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[280px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search users…"
              className="h-10 w-full pl-9 pr-4 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-[140px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-full rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-lg hover:bg-white/10 data-[placeholder]:text-gray-300">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="border border-white/10 bg-slate-900 text-white">
                  <SelectItem value="All" className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200">All Status</SelectItem>
                  <SelectItem value="Active" className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200">Active</SelectItem>
                  <SelectItem value="Inactive" className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-[140px]">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-10 w-full rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-lg hover:bg-white/10 data-[placeholder]:text-gray-300">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent className="border border-white/10 bg-slate-900 text-white">
                  <SelectItem value="All" className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200">All Roles</SelectItem>
                  <SelectItem value="Admin" className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200">Admin</SelectItem>
                  <SelectItem value="Sub Admin" className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200">Sub Admin</SelectItem>
                  <SelectItem value="Editor" className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200">Editor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-[150px]">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setPage(1);
                  setDateFilter(e.target.value);
                }}
                className="h-10 w-full rounded-lg border border-white/20 bg-white/10 px-3 flex items-center text-sm text-white backdrop-blur-lg hover:bg-white/15 focus:outline-none focus:ring-1 focus:ring-blue-500 [color-scheme:dark]"
              />
            </div>

            <div className="w-[130px]">
              <Select value={order} onValueChange={(val: "asc" | "desc") => setOrder(val)}>
                <SelectTrigger className="h-10 w-full rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-lg hover:bg-white/10 data-[placeholder]:text-gray-300">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent className="border border-white/10 bg-slate-900 text-white">
                  <SelectItem value="desc" className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200">Descending</SelectItem>
                  <SelectItem value="asc" className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Loading users…</span>
        </div>
      ) : displayedUsers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 bg-white/10 p-8 text-center text-sm text-white/60 backdrop-blur-lg">
          No users found.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayedUsers.map((user) => (
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
                {Math.min((page - 1) * pageSize + 1, totalItems)}-
                {Math.min(page * pageSize, totalItems)} of {totalItems}
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
            <div className="flex flex-col gap-1.5">
              <Label className="text-white/80">{editing ? "Password (optional)" : "Password"}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            {formError ? <p className="text-xs text-red-400">{formError}</p> : null}
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
