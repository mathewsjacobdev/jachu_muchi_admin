import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Loader2, Search, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import DeleteModal from "@/components/shared/DeleteModal";
import { ResponsiveTable, type ResponsiveTableColumn } from "@/components/ui/ResponsiveTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  deleteEnquiry,
  getEnquiries,
  getEnquiriesFilter,
  type Enquiry,
  type EnquiryFilterOrder,
  type EnquiryFilterSortBy,
  type EnquiryStatus,
  type EnquiryType,
  updateEnquiryStatus,
} from "@/api/services/enquiry.service";

const STATUS_OPTIONS: EnquiryStatus[] = [
  "New",
  "Contacted",
  "Interested",
  "Converted",
  "Closed",
];



const ORDER_OPTIONS: { value: EnquiryFilterOrder; label: string }[] = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

const TYPE_FILTER_OPTIONS: { value: "All" | EnquiryType; label: string }[] = [
  { value: "All", label: "All types" },
  { value: "Normal Enquiry", label: "Normal enquiry" },
  { value: "Course Enquiry", label: "Course enquiry" },
];

const PAGE_SIZE = 10;

const statusClasses: Record<EnquiryStatus, string> = {
  New: "border border-blue-400/20 bg-blue-400/10 text-blue-300",
  Contacted: "border border-orange-400/20 bg-orange-400/10 text-orange-300",
  Interested: "border border-purple-400/20 bg-purple-400/10 text-purple-300",
  Converted: "border border-green-400/20 bg-green-400/10 text-green-300",
  Closed: "border border-red-400/20 bg-red-400/10 text-red-300",
};

const formatEnquiryDate = (value: string) => {
  if (!value?.trim()) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { dateStyle: "medium" });
};

const selectTriggerClass =
  "h-10 w-full rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-lg hover:bg-white/10 data-[placeholder]:text-gray-300";

const EnquiriesPage = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | EnquiryStatus>("All");
  const [typeFilter, setTypeFilter] = useState<"All" | EnquiryType>("All");
  const [dateFilter, setDateFilter] = useState("");
  const [order, setOrder] = useState<EnquiryFilterOrder>("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [allEnquiries, setAllEnquiries] = useState<Enquiry[] | null>(null);

  const deferredSearch = useDeferredValue(search.trim());

  const hasFilter = deferredSearch !== "" || statusFilter !== "All" || typeFilter !== "All" || dateFilter !== "" || order !== "desc";

  const loadEnquiries = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!hasFilter) {
        const data = await getEnquiries();
        setAllEnquiries(data);
        setTotal(data.length);
      } else {
        const result = await getEnquiriesFilter({
          page,
          limit: PAGE_SIZE,
          search: deferredSearch || undefined,
          status: statusFilter,
          type: typeFilter,
          date: dateFilter || undefined,
          order,
        });
        setAllEnquiries(null);
        setEnquiries(result.data);
        setTotal(result.total);
      }
    } catch (err) {
      console.error(err);
      setEnquiries([]);
      setAllEnquiries(null);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, deferredSearch, statusFilter, typeFilter, dateFilter, order, hasFilter]);

  const displayedEnquiries = useMemo(() => {
    if (!hasFilter && allEnquiries) {
      const start = (page - 1) * PAGE_SIZE;
      return allEnquiries.slice(start, start + PAGE_SIZE);
    }
    return enquiries;
  }, [hasFilter, allEnquiries, enquiries, page]);

  useEffect(() => {
    void loadEnquiries();
  }, [loadEnquiries]);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const handleStatusChange = useCallback(
    async (enquiryId: string, nextStatus: EnquiryStatus) => {
      setEnquiries((prev) =>
        prev.map((enquiry) => (enquiry.id === enquiryId ? { ...enquiry, status: nextStatus } : enquiry)),
      );
      if (allEnquiries) {
        setAllEnquiries((prev) =>
          (prev ?? []).map((enquiry) => (enquiry.id === enquiryId ? { ...enquiry, status: nextStatus } : enquiry)),
        );
      }
      try {
        await updateEnquiryStatus(enquiryId, nextStatus);
        await loadEnquiries();
      } catch (err) {
        console.error(err);
        await loadEnquiries();
      }
    },
    [loadEnquiries],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteId === null) return;
    const id = deleteId;
    setDeleteId(null);
    try {
      await deleteEnquiry(id);
      await loadEnquiries();
    } catch (err) {
      console.error(err);
      await loadEnquiries();
    }
  }, [deleteId, loadEnquiries]);

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
      render: (e) => e.type,
      renderMobile: (e) => e.type,
      cellClassName: "text-sm text-gray-400",
    },
    {
      key: "date",
      header: "Date",
      render: (e) => formatEnquiryDate(e.date),
      renderMobile: (e) => formatEnquiryDate(e.date),
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
                <SelectItem
                  key={status}
                  className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200"
                  value={status}
                >
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

      <div className="flex flex-col gap-4 rounded-xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-lg transition-all duration-300 hover:shadow-2xl sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[280px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search enquiries…"
              autoComplete="off"
              className="h-10 w-full rounded-lg border border-white/20 bg-white/10 pl-9 pr-4 text-sm text-gray-100 shadow-sm backdrop-blur-lg transition-all duration-200 placeholder:text-gray-400 hover:bg-white/15 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-[140px]">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setPage(1);
                  setStatusFilter(value as "All" | EnquiryStatus);
                }}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="border border-white/10 bg-slate-900 text-white">
                  <SelectItem className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value="All">
                    All Status
                  </SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem
                      key={status}
                      className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200"
                      value={status}
                    >
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[140px]">
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setPage(1);
                  setTypeFilter(value as "All" | EnquiryType);
                }}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="border border-white/10 bg-slate-900 text-white">
                  {TYPE_FILTER_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200"
                      value={opt.value}
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
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
                className="h-10 w-full rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white backdrop-blur-lg hover:bg-white/15 focus:outline-none focus:ring-1 focus:ring-blue-500 [color-scheme:dark]"
              />
            </div>

            <div className="w-[130px]">
              <Select
                value={order}
                onValueChange={(value) => {
                  setPage(1);
                  setOrder(value as EnquiryFilterOrder);
                }}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent className="border border-white/10 bg-slate-900 text-white">
                  {ORDER_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200"
                      value={opt.value}
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
      ) : displayedEnquiries.length === 0 ? (
        <>
          <div className="hidden md:block p-8 text-center text-sm text-white/50">
            No enquiries found
          </div>
          <div className="md:hidden mx-auto max-w-sm rounded-xl border border-dashed border-white/20 bg-white/10 p-4 text-center backdrop-blur-lg shadow-md">
            <p className="text-sm font-semibold text-gray-100">No enquiries found</p>
            <p className="mt-1.5 text-xs text-gray-300">
              Try changing your search term or filters.
            </p>
          </div>
        </>
      ) : (
        <ResponsiveTable
          data={displayedEnquiries}
          columns={columns}
          renderActions={renderActions}
        />
      )}

      {!isLoading && total > 0 && (
        <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-lg sm:flex-row sm:items-center">
          <p className="text-center text-sm text-gray-300 sm:text-left">
            Showing <span className="font-semibold text-gray-100">{rangeStart}</span>
            {" – "}
            <span className="font-semibold text-gray-100">{rangeEnd}</span>
            {" of "}
            <span className="font-semibold text-gray-100">{total}</span>
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-3 text-sm font-medium text-white transition-colors hover:bg-white/15 disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Previous
            </button>
            <span className="min-w-[7rem] text-center text-sm text-gray-300">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-3 text-sm font-medium text-white transition-colors hover:bg-white/15 disabled:pointer-events-none disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
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
