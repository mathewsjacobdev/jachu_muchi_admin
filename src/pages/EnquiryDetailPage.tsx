import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getEnquiryById,
  type Enquiry,
  type EnquiryStatus,
  updateEnquiryNotes,
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
  New: "bg-blue-100 text-blue-700 ring-blue-200/80",
  Contacted: "bg-orange-100 text-orange-700 ring-orange-200/80",
  Interested: "bg-purple-100 text-purple-700 ring-purple-200/80",
  Converted: "bg-green-100 text-green-700 ring-green-200/80",
  Closed: "bg-red-100 text-red-700 ring-red-200/80",
};

const SAVED_TOAST_MS = 1500;

const EnquiryDetailPage = () => {
  const { id } = useParams();
  const enquiryId = id ?? "";

  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<EnquiryStatus>("New");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
  }, []);

  useEffect(() => {
    if (!enquiryId) {
      setEnquiry(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);

    getEnquiryById(enquiryId, controller.signal)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setEnquiry(null);
          return;
        }
        setEnquiry(data);
        setStatus(data.status);
        setNotes(data.notes ?? "");
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        console.error(err);
        if (!cancelled) setEnquiry(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enquiryId]);

  const handleStatusChange = useCallback(async (value: EnquiryStatus) => {
    if (!enquiry) return;
    setStatus(value);
    setStatusBusy(true);
    try {
      await updateEnquiryStatus(enquiry.id, value);
      setEnquiry((prev) => (prev ? { ...prev, status: value } : prev));
    } catch (err) {
      console.error(err);
      try {
        const fresh = await getEnquiryById(enquiry.id);
        if (fresh) {
          setEnquiry(fresh);
          setStatus(fresh.status);
        }
      } catch (refetchErr) {
        console.error(refetchErr);
      }
    } finally {
      setStatusBusy(false);
    }
  }, [enquiry]);

  const handleSave = useCallback(async () => {
    if (!enquiry) return;
    setSaving(true);
    try {
      await updateEnquiryNotes(enquiry.id, notes);
      setEnquiry((prev) => (prev ? { ...prev, notes } : prev));
      setSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), SAVED_TOAST_MS);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }, [enquiry, notes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-6 text-white">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading…
      </div>
    );
  }

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
              Type
            </p>
            <p className="text-sm text-white/70">
              {enquiry.type}
            </p>
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
              <Select
                value={status}
                disabled={statusBusy}
                onValueChange={(v) => void handleStatusChange(v as EnquiryStatus)}
              >
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

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
          {saved ? <p className="text-xs font-medium text-green-400">Saved.</p> : null}
        </div>
      </div>
    </div>
  );
};

export default EnquiryDetailPage;
