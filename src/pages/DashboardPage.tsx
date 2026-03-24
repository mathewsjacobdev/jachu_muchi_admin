import { MessageSquareText, Sparkles, BadgeCheck, CircleX, Eye, Loader2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "@/components/shared/PageHeader";
import {
  deleteEnquiry,
  getEnquiries,
  type Enquiry,
  type EnquiryStatus,
} from "@/api/services/enquiry.service";

const statusClasses: Record<EnquiryStatus, string> = {
  New: "border border-blue-400/20 bg-blue-400/10 text-blue-300",
  Contacted: "border border-orange-400/20 bg-orange-400/10 text-orange-300",
  Interested: "border border-purple-400/20 bg-purple-400/10 text-purple-300",
  Converted: "border border-green-400/20 bg-green-400/10 text-green-300",
  Closed: "border border-red-400/20 bg-red-400/10 text-red-300",
};

type TimeFilter = "Today" | "This Week" | "This Month";

const PIE_COLORS = ["#60a5fa", "#f59e0b", "#a78bfa", "#34d399", "#f87171"];

const parseEnquiryDate = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("This Week");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        setEnquiries(await getEnquiries());
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const referenceDate = useMemo(() => {
    const dates = enquiries
      .map((item) => parseEnquiryDate(item.date))
      .filter((date): date is Date => date !== null)
      .sort((a, b) => b.getTime() - a.getTime());
    return dates[0] ?? new Date();
  }, [enquiries]);

  const filteredEnquiries = useMemo(() => {
    const ref = new Date(referenceDate);
    const startOfDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const startOfMonth = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const endOfMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);

    return enquiries.filter((item) => {
      const d = parseEnquiryDate(item.date);
      if (!d) return false;
      if (timeFilter === "Today") return d >= startOfDay && d < endOfDay;
      if (timeFilter === "This Week") return d >= startOfWeek && d < endOfWeek;
      return d >= startOfMonth && d < endOfMonth;
    });
  }, [enquiries, referenceDate, timeFilter]);

  const statCards = useMemo(
    () => [
      {
        label: "Total Enquiries",
        value: filteredEnquiries.length.toLocaleString(),
        icon: MessageSquareText,
        cardClass: "bg-white/10 border border-white/20 shadow-md backdrop-blur-lg",
        iconClass: "bg-blue-400/10 text-blue-300 border border-blue-400/20",
      },
      {
        label: "New Leads",
        value: filteredEnquiries.filter((item) => item.status === "New").length.toLocaleString(),
        icon: Sparkles,
        cardClass: "bg-white/10 border border-white/20 shadow-md backdrop-blur-lg",
        iconClass: "bg-yellow-400/10 text-yellow-300 border border-yellow-400/20",
        onClick: () => navigate("/enquiries?status=new"),
      },
      {
        label: "Converted Leads",
        value: filteredEnquiries.filter((item) => item.status === "Converted").length.toLocaleString(),
        icon: BadgeCheck,
        cardClass: "bg-white/10 border border-white/20 shadow-md backdrop-blur-lg",
        iconClass: "bg-green-400/10 text-green-300 border border-green-400/20",
        onClick: () => navigate("/enquiries?status=converted"),
      },
      {
        label: "Closed Leads",
        value: filteredEnquiries.filter((item) => item.status === "Closed").length.toLocaleString(),
        icon: CircleX,
        cardClass: "bg-white/10 border border-white/20 shadow-md backdrop-blur-lg",
        iconClass: "bg-red-400/10 text-red-300 border border-red-400/20",
      },
    ],
    [filteredEnquiries, navigate],
  );

  const leadsByCourse = useMemo(() => {
    const map = new Map<string, number>();
    filteredEnquiries.forEach((item) => {
      map.set(item.course, (map.get(item.course) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([course, leads]) => ({ course, leads }));
  }, [filteredEnquiries]);

  const statusDistribution = useMemo(() => {
    return [
      { name: "New", value: filteredEnquiries.filter((item) => item.status === "New").length },
      { name: "Contacted", value: filteredEnquiries.filter((item) => item.status === "Contacted").length },
      { name: "Interested", value: filteredEnquiries.filter((item) => item.status === "Interested").length },
      { name: "Converted", value: filteredEnquiries.filter((item) => item.status === "Converted").length },
      { name: "Closed", value: filteredEnquiries.filter((item) => item.status === "Closed").length },
    ].filter((item) => item.value > 0);
  }, [filteredEnquiries]);

  const recentEnquiries = useMemo(() => filteredEnquiries.slice(0, 5), [filteredEnquiries]);

  const handleDelete = async (id: number) => {
    setEnquiries((prev) => prev.filter((enquiry) => enquiry.id !== id));
    try {
      await deleteEnquiry(id);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
    <PageHeader
      title="Dashboard"
      description={
        isLoading
          ? "Loading enquiries…"
          : "Quick snapshot of enquiry performance and latest leads."
      }
    />

    {isLoading ? (
      <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm">Loading dashboard…</span>
      </div>
    ) : (
      <>
    <div className="rounded-xl border border-white/20 bg-white/10 p-2 shadow-md backdrop-blur-lg">
      <div className="flex flex-wrap items-center gap-2">
        {(["Today", "This Week", "This Month"] as TimeFilter[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setTimeFilter(tab)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
              timeFilter === tab
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>

    <div className="px-1">
      <h2 className="text-base font-semibold text-gray-100">Analytics Overview</h2>
      <p className="text-xs text-gray-300">Performance summary for the selected timeframe.</p>
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`group relative overflow-hidden rounded-xl p-3 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl sm:p-4 md:p-5 ${card.cardClass} ${card.onClick ? "cursor-pointer" : ""}`}
          onClick={card.onClick}
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

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-lg sm:p-5">
        <h3 className="text-sm font-semibold text-gray-100">Leads by Course</h3>
        <div className="mt-3 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leadsByCourse}>
              <XAxis dataKey="course" stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 12 }} interval={0} angle={-12} textAnchor="end" height={60} />
              <YAxis stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff" }}
                labelStyle={{ color: "#cbd5e1" }}
              />
              <Bar dataKey="leads" fill="#60a5fa" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-lg sm:p-5">
        <h3 className="text-sm font-semibold text-gray-100">Status Distribution</h3>
        <div className="mt-3 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                {statusDistribution.map((entry, index) => (
                  <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff" }}
                labelStyle={{ color: "#cbd5e1" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

    <div className="rounded-xl border border-white/20 bg-blue/10 p-3 text-white/80 shadow-lg backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl sm:p-4 md:p-5">
      <div className="mb-4 px-1">
        <h2 className="text-base font-semibold text-gray-100">Recent Enquiries</h2>
        <p className="text-xs text-gray-300">Latest 5 enquiries in selected timeframe</p>
      </div>
      <div className="hidden md:block overflow-x-auto rounded-xl border border-white/20 bg-white/10 backdrop-blur-lg">
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
              <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-transparent">
            {recentEnquiries.map((enquiry) => (
              <tr
                className="group transition-colors duration-200 hover:bg-white/10"
                key={enquiry.id}
              >
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
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {recentEnquiries.map((enquiry) => (
          <div
            key={enquiry.id}
            className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-lg p-4 shadow-md space-y-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-bold text-gray-100">{enquiry.name}</p>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[enquiry.status]}`}
              >
                {enquiry.status}
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-gray-300">Phone: <span className="text-gray-200">{enquiry.phone}</span></p>
              <p className="text-sm text-gray-300">Course: <span className="text-gray-200">{enquiry.course}</span></p>
              <p className="text-sm text-gray-300">Date: <span className="text-gray-200">{enquiry.date}</span></p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
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
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
      </>
    )}
    </div>
  );
};

export default DashboardPage;
