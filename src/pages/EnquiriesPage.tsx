import { useEffect, useMemo, useState } from "react";
import { Eye, Search, Trash2, ChevronDown, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type EnquiryStatus = "New" | "Contacted" | "Interested" | "Converted" | "Closed";

interface Enquiry {
  id: number;
  name: string;
  phone: string;
  email: string;
  course: string;
  message: string;
  date: string;
  status: EnquiryStatus;
}

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

const initialEnquiries: Enquiry[] = [
  {
    id: 1,
    name: "Aarav Sharma",
    phone: "+91 98123 45678",
    email: "aarav.sharma@example.com",
    course: "Premium Vision Plan",
    message:
      "I want details about premium lenses, delivery timelines, and available frame offers.",
    date: "19 Mar 2026",
    status: "New",
  },
  {
    id: 2,
    name: "Priya Nair",
    phone: "+91 99221 88441",
    email: "priya.nair@example.com",
    course: "Contact Lens Subscription",
    message:
      "Please share monthly and quarterly subscription plans with pricing and trial options.",
    date: "18 Mar 2026",
    status: "Contacted",
  },
  {
    id: 3,
    name: "Rahul Verma",
    phone: "+91 98700 10022",
    email: "rahul.verma@example.com",
    course: "Blue Light Protection Package",
    message:
      "Need recommendations for computer glasses and whether zero-power lenses are included.",
    date: "17 Mar 2026",
    status: "Interested",
  },
  {
    id: 4,
    name: "Neha Kapoor",
    phone: "+91 99887 55443",
    email: "neha.kapoor@example.com",
    course: "Progressive Lens Upgrade",
    message:
      "Interested in progressive lenses, looking for a quick consultation and best options.",
    date: "16 Mar 2026",
    status: "Converted",
  },
  {
    id: 5,
    name: "Vikram Singh",
    phone: "+91 98989 70707",
    email: "vikram.singh@example.com",
    course: "Eyeglass Repair Service",
    message:
      "Checking repair turnaround for broken frame hinge and lens alignment correction.",
    date: "15 Mar 2026",
    status: "Closed",
  },
];

const EnquiriesPage = () => {

  const [enquiries, setEnquiries] = useState<Enquiry[]>(initialEnquiries);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | EnquiryStatus>("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredEnquiries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return enquiries.filter((enquiry) => {
      const matchesSearch =
        enquiry.name.toLowerCase().includes(query) ||
        enquiry.phone.toLowerCase().includes(query) ||
        enquiry.course.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ? true : enquiry.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [enquiries, search, statusFilter]);

  const handleStatusChange = (id: number, nextStatus: EnquiryStatus) => {
    setEnquiries((prev) =>
      prev.map((enquiry) =>
        enquiry.id === id ? { ...enquiry, status: nextStatus } : enquiry,
      ),
    );
  };

  const handleDelete = (id: number) => {
    setEnquiries((prev) => prev.filter((enquiry) => enquiry.id !== id));
  };

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
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, phone or course..."
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
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading enquiries...
              </div>
            </div>
          </div>

          <div className="md:hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-lg p-4 shadow-md">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading enquiries...
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
          columns={[
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
              key: "course",
              header: "Course",
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
                    onValueChange={(value) => handleStatusChange(enquiry.id, value as EnquiryStatus)}
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
          ]}
          renderActions={(enquiry) => (
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
                onClick={() => handleDelete(enquiry.id)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-400/10 text-red-300 shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:bg-red-400/15"
                aria-label={`Delete enquiry for ${enquiry.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        />
      )}
    </div>
  );
};

export default EnquiriesPage;
