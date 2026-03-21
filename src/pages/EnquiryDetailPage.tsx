import { useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type EnquiryStatus = "New" | "Contacted" | "Interested" | "Converted" | "Closed";

interface EnquiryDetail {
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
  New: "bg-blue-100 text-blue-700 ring-blue-200/80",
  Contacted: "bg-orange-100 text-orange-700 ring-orange-200/80",
  Interested: "bg-purple-100 text-purple-700 ring-purple-200/80",
  Converted: "bg-green-100 text-green-700 ring-green-200/80",
  Closed: "bg-red-100 text-red-700 ring-red-200/80",
};

const mockEnquiries: EnquiryDetail[] = [
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

const EnquiryDetailPage = () => {
  const { id } = useParams();
  const enquiryId = Number(id);

  const enquiry = useMemo(
    () => mockEnquiries.find((item) => item.id === enquiryId),
    [enquiryId],
  );

  const [status, setStatus] = useState<EnquiryStatus>(enquiry?.status ?? "New");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  if (!enquiry) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/80 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl sm:p-4 md:p-5">
        <Link
          to="/enquiries"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/80 transition-all duration-200 hover:bg-white/10 hover:text-blue-300 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <p className="mt-4 text-sm text-white/60">Enquiry not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enquiry Detail"
        description="Review and update selected enquiry information."
        action={(
          <Link
            to="/enquiries"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/80 shadow-sm transition-all duration-200 hover:bg-white/10 hover:text-blue-300 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        )}
      />

      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/80 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl sm:p-4 md:p-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
              Name
            </p>
            <p className="text-sm font-semibold text-white/90">{enquiry.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Phone
            </p>
            <p className="text-sm text-white/70">{enquiry.phone}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email
            </p>
            <p className="text-sm text-white/70">{enquiry.email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Course
            </p>
            <p className="text-sm text-white/70">{enquiry.course}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Date
            </p>
            <p className="text-sm text-white/70">{enquiry.date}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${statusClasses[status]}`}
              >
                {status}
              </span>
              <Select value={status} onValueChange={(value) => setStatus(value as EnquiryStatus)}>
                <SelectTrigger className="h-10 w-[170px] rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-lg hover:bg-white/10 data-[placeholder]:text-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border border-white/10 bg-slate-900 text-white">
                  {STATUS_OPTIONS.map((item) => (
                    <SelectItem key={item} className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-blue-200" value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-1 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-md sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Message
          </p>
          <p className="text-sm leading-6 text-white/70">{enquiry.message}</p>
        </div>

        <div className="mt-6 space-y-2">
          <label
            htmlFor="internal-notes"
            className="text-xs font-semibold uppercase tracking-wide text-white/50"
          >
            Notes
          </label>
          <textarea
            id="internal-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add internal notes for follow-up..."
            rows={5}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/80 shadow-sm backdrop-blur-md transition-all duration-200 placeholder:text-white/35 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:bg-blue-700 sm:w-auto"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
          {saved && <p className="text-xs font-medium text-green-400">Saved locally.</p>}
        </div>
      </div>
    </div>
  );
};

export default EnquiryDetailPage;
