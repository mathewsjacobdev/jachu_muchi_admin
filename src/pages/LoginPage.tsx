import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Glasses, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs: typeof errors = {};
    if (!email) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Min 6 characters";
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const ok = login(email, password);
    if (ok) navigate("/");
    else setErrors({ general: "Invalid credentials" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#020617] p-4 sm:p-6">
      <div className="pointer-events-none absolute -left-24 top-16 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

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
              <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
              <p className="mt-1 text-sm text-gray-400">Sign in to OpticAdmin</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.general && (
              <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {errors.general}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-gray-200">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@optic.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
                className="h-12 border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-gray-400 focus-visible:border-blue-500"
              />
              {errors.email && <span className="text-xs text-red-300">{errors.email}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-gray-200">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors({}); }}
                  className="h-12 border-white/20 bg-white/10 px-4 py-3 pr-12 text-white placeholder:text-gray-400 focus-visible:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <span className="text-xs text-red-300">{errors.password}</span>}
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-blue-400 transition-colors hover:text-blue-300 hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="h-12 w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transition-all duration-300 hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl"
            >
              Sign in
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
