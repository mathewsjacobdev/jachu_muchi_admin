import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import PageHeader from "@/components/shared/PageHeader";
import { getCourseLeadById } from "@/lib/course-enquiries-store";

const CourseEnquiryDetailPage = () => {
  const { id } = useParams();
  const leadId = Number(id);
  const lead = Number.isFinite(leadId) ? getCourseLeadById(leadId) : undefined;

  if (!lead) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <PageHeader
          title="Lead not found"
          description="This enquiry may have been removed."
          action={(
            <Link
              to="/course-enquiries"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-gray-200 transition-all duration-200 hover:bg-white/15"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          )}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Course Enquiry Detail"
        description="Complete admission lead information."
        action={(
          <Link
            to="/course-enquiries"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-gray-200 transition-all duration-200 hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Course Enquiries
          </Link>
        )}
      />

      <div className="rounded-xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <p className="text-sm text-gray-300"><span className="text-gray-400">Name:</span> {lead.name}</p>
          <p className="text-sm text-gray-300"><span className="text-gray-400">Phone:</span> {lead.phone}</p>
          <p className="text-sm text-gray-300"><span className="text-gray-400">Email:</span> {lead.email}</p>
          <p className="text-sm text-gray-300"><span className="text-gray-400">Course:</span> {lead.course}</p>
          <p className="text-sm text-gray-300"><span className="text-gray-400">Campus:</span> {lead.location}</p>
          <p className="text-sm text-gray-300"><span className="text-gray-400">Stream:</span> {lead.stream}</p>
          <p className="text-sm text-gray-300"><span className="text-gray-400">Date:</span> {lead.date}</p>
          <p className="text-sm text-gray-300"><span className="text-gray-400">Status:</span> {lead.status}</p>
        </div>
      </div>
    </div>
  );
};

export default CourseEnquiryDetailPage;
