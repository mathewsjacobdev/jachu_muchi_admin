import { MessageSquareText, Sparkles, BadgeCheck, CircleX } from "lucide-react";
import { motion } from "framer-motion";
import PageHeader from "@/components/shared/PageHeader";

type EnquiryStatus = "New" | "Contacted" | "Interested" | "Converted" | "Closed";

interface Enquiry {
  id: number;
  name: string;
  phone: string;
  course: string;
  date: string;
  status: EnquiryStatus;
}

const enquiries: Enquiry[] = [
  {
    id: 1,
    name: "Aarav Sharma",
    phone: "+91 98123 45678",
    course: "Premium Vision Plan",
    date: "19 Mar 2026",
    status: "New",
  },
  {
    id: 2,
    name: "Priya Nair",
    phone: "+91 99221 88441",
    course: "Contact Lens Subscription",
    date: "18 Mar 2026",
    status: "Contacted",
  },
  {
    id: 3,
    name: "Rahul Verma",
    phone: "+91 98700 10022",
    course: "Blue Light Protection Package",
    date: "17 Mar 2026",
    status: "Interested",
  },
  {
    id: 4,
    name: "Neha Kapoor",
    phone: "+91 99887 55443",
    course: "Progressive Lens Upgrade",
    date: "16 Mar 2026",
    status: "Converted",
  },
  {
    id: 5,
    name: "Vikram Singh",
    phone: "+91 98989 70707",
    course: "Eyeglass Repair Service",
    date: "15 Mar 2026",
    status: "Closed",
  },
  {
    id: 6,
    name: "Ananya Iyer",
    phone: "+91 98321 66554",
    course: "Computer Glasses Package",
    date: "14 Mar 2026",
    status: "New",
  },
];

const statusClasses: Record<EnquiryStatus, string> = {
  New: "border border-blue-400/20 bg-blue-400/10 text-blue-300",
  Contacted: "border border-orange-400/20 bg-orange-400/10 text-orange-300",
  Interested: "border border-purple-400/20 bg-purple-400/10 text-purple-300",
  Converted: "border border-green-400/20 bg-green-400/10 text-green-300",
  Closed: "border border-red-400/20 bg-red-400/10 text-red-300",
};

const statCards = [
  {
    label: "Total Enquiries",
    value: enquiries.length.toLocaleString(),
    icon: MessageSquareText,
    cardClass: "bg-white/10 border border-white/20 shadow-md backdrop-blur-lg",
    iconClass: "bg-blue-400/10 text-blue-300 border border-blue-400/20",
  },
  {
    label: "New Leads",
    value: enquiries.filter((item) => item.status === "New").length.toLocaleString(),
    icon: Sparkles,
    cardClass: "bg-white/10 border border-white/20 shadow-md backdrop-blur-lg",
    iconClass: "bg-yellow-400/10 text-yellow-300 border border-yellow-400/20",
  },
  {
    label: "Converted Leads",
    value: enquiries
      .filter((item) => item.status === "Converted")
      .length.toLocaleString(),
    icon: BadgeCheck,
    cardClass: "bg-white/10 border border-white/20 shadow-md backdrop-blur-lg",
    iconClass: "bg-green-400/10 text-green-300 border border-green-400/20",
  },
  {
    label: "Closed Leads",
    value: enquiries.filter((item) => item.status === "Closed").length.toLocaleString(),
    icon: CircleX,
    cardClass: "bg-white/10 border border-white/20 shadow-md backdrop-blur-lg",
    iconClass: "bg-red-400/10 text-red-300 border border-red-400/20",
  },
];

const recentEnquiries = enquiries.slice(0, 5);

const DashboardPage = () => (
  <div className="space-y-6">
    <PageHeader
      title="Dashboard"
      description="Quick snapshot of enquiry performance and latest leads."
    />

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`group relative overflow-hidden rounded-xl p-3 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl sm:p-4 md:p-5 ${card.cardClass}`}
        >
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-3xl transition-all duration-300 group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">{card.label}</span>
            <div
              className={`rounded-lg p-2 shadow-sm transition-transform duration-300 group-hover:scale-110 ${card.iconClass}`}
            >
              <card.icon className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold tracking-tight text-gray-100 sm:text-[2rem]">
            {card.value}
          </p>
        </motion.div>
      ))}
    </div>

    <div className="rounded-xl border border-white/20 bg-blue/10 p-3 text-white/80 shadow-lg backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl sm:p-4 md:p-5">
      <div className="mb-4 px-1">
        <h2 className="text-base font-semibold text-gray-100">Recent Enquiries</h2>
        <p className="text-xs text-gray-300">Latest 5 enquiries received</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/20 bg-white/10 backdrop-blur-lg">
        <table className="min-w-full divide-y divide-white/10 text-xs sm:text-sm">
          <thead className="bg-white/10">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">
                Name
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">
                Phone
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">
                Course
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">
                Date
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-transparent">
            {recentEnquiries.map((enquiry) => (
              <tr className="group transition-colors duration-200 hover:bg-white/10" key={enquiry.id}>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-200">
                  {enquiry.name}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-400">
                  {enquiry.phone}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-400">
                  {enquiry.course}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-400">
                  {enquiry.date}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset transition-transform duration-200 group-hover:scale-105 ${statusClasses[enquiry.status]}`}
                  >
                    {enquiry.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default DashboardPage;
