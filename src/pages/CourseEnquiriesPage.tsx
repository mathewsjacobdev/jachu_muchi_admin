import { useMemo, useState } from "react";
import { Eye, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import PageHeader from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DeleteModal from "@/components/shared/DeleteModal";
import {
  LeadStatus,
  listCourseLeads,
  removeCourseLead,
  setCourseLeadStatus,
} from "@/lib/course-enquiries-store";

const STATUS_OPTIONS: LeadStatus[] = ["New", "Contacted", "Interested", "Converted", "Closed"];

const statusClasses: Record<LeadStatus, string> = {
  New: "border border-blue-400/20 bg-blue-400/10 text-blue-300",
  Contacted: "border border-orange-400/20 bg-orange-400/10 text-orange-300",
  Interested: "border border-purple-400/20 bg-purple-400/10 text-purple-300",
  Converted: "border border-green-400/20 bg-green-400/10 text-green-300",
  Closed: "border border-red-400/20 bg-red-400/10 text-red-300",
};

const CourseEnquiriesPage = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState(() => listCourseLeads());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | LeadStatus>("All");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(query) ||
        lead.phone.toLowerCase().includes(query) ||
        lead.course.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All" || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  const onStatusChange = (id: number, nextStatus: LeadStatus) => {
    setCourseLeadStatus(id, nextStatus);
    setLeads(listCourseLeads());
  };

  const handleDeleteConfirm = () => {
    if (deleteId === null) return;
    removeCourseLead(deleteId);
    setLeads(listCourseLeads());
    setDeleteId(null);
  };

  const handleDeleteCancel = () => {
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course Enquiries"
        description="Manage course admission leads and conversion status."
      />

      <div className="rounded-xl border border-white/20 bg-white/10 p-3 shadow-lg backdrop-blur-lg sm:p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone or course..."
              className="h-10 rounded-lg border-white/20 bg-white/10 pl-10.5 text-sm text-gray-100 placeholder:text-gray-400"
            />
          </div>

          <div className="w-full sm:w-52">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "All" | LeadStatus)}>
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

      {filteredLeads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 bg-white/10 p-10 text-center text-sm text-gray-300 backdrop-blur-lg">
          No course enquiries found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className="rounded-xl border border-white/20 bg-white/10 p-5 shadow-lg backdrop-blur-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                <h3 className="text-lg font-bold text-white">{lead.name}</h3>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[lead.status]}`}>
                  {lead.status}
                </span>
              </div>

              <div className="space-y-2 border-b border-white/10 py-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Course</p>
                <p className="text-blue-400 font-semibold">{lead.course}</p>
              </div>

              <div className="space-y-2 py-4">
                <p className="text-sm text-gray-300">
                  <span className="text-gray-400">Phone:</span> {lead.phone}
                </p>
                <p className="text-sm text-gray-300">
                  <span className="text-gray-400">Campus:</span> {lead.location}
                </p>
              </div>

              <div className="mt-1 flex items-center justify-between gap-2">
                <Select value={lead.status} onValueChange={(value) => onStatusChange(lead.id, value as LeadStatus)}>
                  <SelectTrigger aria-label={`Change status for ${lead.name}`} className="h-8 w-[132px] rounded-lg border border-white/20 bg-white/10 px-2.5 text-xs text-white backdrop-blur-lg hover:bg-white/10">
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

              <div className="mt-4 flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/course-enquiries/${lead.id}`)}
                >
                  <Eye className="h-4 w-4" />
                  View
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-red-300 hover:text-red-200"
                  onClick={() => setDeleteId(lead.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteModal
        open={deleteId !== null}
        onOpenChange={() => handleDeleteCancel()}
        onConfirm={handleDeleteConfirm}
        title="Delete course enquiry"
      />
    </div>
  );
};

export default CourseEnquiriesPage;
