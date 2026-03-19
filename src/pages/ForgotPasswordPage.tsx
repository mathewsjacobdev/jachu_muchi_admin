import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Glasses, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#020617] p-4 sm:p-6">
      <div className="pointer-events-none absolute -left-20 top-12 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-12 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <div className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:shadow-[0_20px_60px_rgba(15,23,42,0.45)] sm:p-8">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg">
              <Glasses className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Reset password</h1>
              <p className="mt-1 text-sm text-gray-400">We'll send a reset link to your email</p>
            </div>
          </div>

          {sent ? (
            <div className="text-center">
              <p className="mb-4 text-sm text-gray-200">
                Reset link sent to <strong>{email}</strong>
              </p>
              <Link to="/login" className="text-sm text-blue-400 transition-colors hover:text-blue-300 hover:underline">
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-gray-200">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@optic.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className="h-12 border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-gray-400 focus-visible:border-blue-500"
                />
                {error && <span className="text-xs text-red-300">{error}</span>}
              </div>
              <Button
                type="submit"
                className="h-12 w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transition-all duration-300 hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl"
              >
                Send reset link
              </Button>
            </form>
          )}

          <Link to="/login" className="mt-5 flex items-center justify-center gap-1 text-sm text-blue-400 transition-colors hover:text-blue-300 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
