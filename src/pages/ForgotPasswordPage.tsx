import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Glasses } from "lucide-react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email");
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl grid-cols-1 overflow-hidden rounded-xl bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)] sm:min-h-[calc(100vh-3rem)] lg:grid-cols-2">
        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-2 text-slate-700">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                <Glasses className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold tracking-wide">V Trust</span>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Welcome Back</h1>
              <p className="mt-2 text-sm text-slate-500">
                Enter your email and we will send you a password reset link.
              </p>
            </div>

            {sent ? (
              <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm text-emerald-700">
                  Reset link sent to <strong>{email}</strong>
                </p>
                <Link to="/login" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-500">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email" className="text-slate-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@optic.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    className="h-12 rounded-xl border-slate-200 bg-white px-4 text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-blue-500"
                  />
                  {error && <span className="text-xs text-red-500">{error}</span>}
                </div>
                <Button
                  type="submit"
                  className="h-12 w-full rounded-lg bg-blue-600 text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-blue-700 hover:shadow-xl"
                >
                  Send reset link
                </Button>
                <Link to="/login" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-500">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to login
                </Link>
              </form>
            )}
          </div>
        </div>

        <div className="hidden p-10 lg:block">
          <div className="flex h-full items-center justify-center">
            <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-slate-50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl">
              <div className="flex min-h-[520px] flex-col items-center justify-center">
                <img
                  src="https://img.freepik.com/free-vector/fingerprint-concept-illustration_114360-4398.jpg?w=740"
                  alt="Authentication illustration"
                  className="mx-auto max-h-[350px] w-full object-contain"
                />
                <p className="mt-5 text-center text-sm text-gray-600">
                  Manage courses, leads, and growth from one modern dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
