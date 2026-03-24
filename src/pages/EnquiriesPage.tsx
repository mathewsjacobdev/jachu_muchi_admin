import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Eye, Loader2, Search, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import DeleteModal from "@/components/shared/DeleteModal";
import { ResponsiveTable, type ResponsiveTableColumn } from "@/components/ui/ResponsiveTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  deleteEnquiry,
  getEnquiries,
  type Enquiry,
  type EnquiryStatus,
  updateEnquiryStatus,
} from "@/api/services/enquiry.service";

const STATUS_OPTIONS: EnquiryStatus[] = [
  "New",
  "Contacted",
  "Interested",
  "Converted",
  "Closed",
];

const statusClasses: Record<EnquiryStatus, string> = {
  New: "border border-blue-400/20 bg-blue-400/10 text-blue-300",
  Contacted: "border border-orange-400/20 bg-orange-400/10 text-orange-300",
  Interested: "border border-purple-400/20 bg-purple-400/10 text-purple-300",
  Converted: "border border-green-400/20 bg-green-400/10 text-green-300",
  Closed: "border border-red-400/20 bg-red-400/10 text-red-300",
};

const EnquiriesPage = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | EnquiryStatus>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  useEffect(() => {
    const fetchList = async () => {
      setIsLoading(true);
      try {
        const data = await getEnquiries();
        setEnquiries(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchList();
  }, []);

  const filteredEnquiries = useMemo(() => {
    const query = deferredSearch;

    return enquiries.filter((enquiry) => {
      const matchesSearch =
        !query ||
        enquiry.name.toLowerCase().includes(query) ||
        enquiry.phone.toLowerCase().includes(query) ||
        enquiry.email.toLowerCase().includes(query) ||
        enquiry.course.toLowerCase().includes(query) ||
        enquiry.message.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ? true : enquiry.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [enquiries, deferredSearch, statusFilter]);

  const handleStatusChange = useCallback(async (enquiryId: number, nextStatus: EnquiryStatus) => {
    setEnquiries((prev) =>
      prev.map((enquiry) =>
        enquiry.id === enquiryId ? { ...enquiry, status: nextStatus } : enquiry,
      ),
    );
    try {
      await updateEnquiryStatus(enquiryId, nextStatus);
    } catch (err) {
      console.error(err);
      try {
        const data = await getEnquiries();
        setEnquiries(data);
      } catch (refetchErr) {
        console.error(refetchErr);
      }
    }
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteId === null) return;
    const id = deleteId;
    setDeleteId(null);
    try {
      await deleteEnquiry(id);
      setEnquiries((prev) => prev.filter((enquiry) => enquiry.id !== id));
    } catch (err) {
      console.error(err);
      try {
        const data = await getEnquiries();
        setEnquiries(data);
      } catch (refetchErr) {
        console.error(refetchErr);
      }
    }
  }, [deleteId]);

  const columns = useMemo((): ResponsiveTableColumn<Enquiry>[] => [
    {
      key: "name",
      header: "Name",
      cellClassName: "text-sm font-semibold text-gray-200",
    },
    {
      key: "phone",
      header: "Phone",
      cellClassName: "text-sm text-gray-400",
    },
    {
      key: "type",
      header: "Type",
      render: (e) => (e.type === "course" ? "Course Enquiry" : "Normal Enquiry"),
      renderMobile: (e) => (e.type === "course" ? "Course Enquiry" : "Normal Enquiry"),
      cellClassName: "text-sm text-gray-400",
    },
    {
      key: "date",
      header: "Date",
      cellClassName: "text-sm text-gray-400",
    },
    {
      key: "status",
      header: "Status",
      render: (enquiry) => (
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${statusClasses[enquiry.status]}`}
          >
            {enquiry.status}
          </span>
          <Select
            value={enquiry.status}
            onValueChange={(value) => void handleStatusChange(enquiry.id, value as EnquiryStatus)}
          >
            <SelectTrigger
              aria-label={`Change status for ${enquiry.name}`}
              className="h-8 w-[132px] rounded-lg border border-white/20 bg-white/10 px-2.5 text-xs font-semibold text-white backdrop-blur-lg hover:bg-white/10"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border border-white/10 bg-slate-900 text-white">
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
      renderMobile: (enquiry) => (
        <span
          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${statusClasses[enquiry.status]}`}
        >
          {enquiry.status}
        </span>
      ),
    },
  ], [handleStatusChange]);

  const renderActions = useCallback(
    (enquiry: Enquiry) => (
      <>
        <Link
          to={`/enquiries/${enquiry.id}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:bg-blue-700"
          aria-label={`View enquiry for ${enquiry.name}`}
        >
          <Eye className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={() => setDeleteId(enquiry.id)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-400/10 text-red-300 shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:bg-red-400/15"
          aria-label={`Delete enquiry for ${enquiry.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </>
    ),
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enquiry Management"
        description="Track, prioritize, and convert customer enquiries from one place."
      />

      <div className="rounded-xl border border-white/20 bg-white/10 p-3 shadow-lg backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl sm:p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, phone, email, course or message..."
              autoComplete="off"
              className="h-10 w-full rounded-lg border border-white/20 bg-white/10 pl-11 pr-4 text-sm text-gray-100 shadow-sm backdrop-blur-lg transition-all duration-200 placeholder:text-gray-400 hover:bg-white/15 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-full sm:w-52">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "All" | EnquiryStatus)}>
              <SelectTrigger className="h-10 w-full rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-lg hover:bg-white/10 data-[placeholder]:text-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border border-white/10 bg-slate-900 text-white">
                <SelectItem className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value="All">All Status</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <>
          <div className="hidden md:block overflow-x-auto rounded-xl border border-white/20 bg-white/10 backdrop-blur-lg">
            <div className="px-5 py-14">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Loading enquiries…
              </div>
            </div>
          </div>

          <div className="md:hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-lg p-4 shadow-md">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading enquiries…
            </div>
          </div>
        </>
      ) : filteredEnquiries.length === 0 ? (
        <>
          <div className="hidden md:block p-8 text-center text-sm text-white/50">
            No enquiries found
          </div>
          <div className="md:hidden mx-auto max-w-sm rounded-xl border border-dashed border-white/20 bg-white/10 p-4 text-center backdrop-blur-lg shadow-md">
            <p className="text-sm font-semibold text-gray-100">No enquiries found</p>
            <p className="mt-1.5 text-xs text-gray-300">
              Try changing your search term or status filter.
            </p>
          </div>
        </>
      ) : (
        <ResponsiveTable
          data={filteredEnquiries}
          columns={columns}
          renderActions={renderActions}
        />
      )}

      <DeleteModal
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete enquiry"
        description="This enquiry will be permanently removed."
      />
    </div>
  );
};

export default EnquiriesPage;
