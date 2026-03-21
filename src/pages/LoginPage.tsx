import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
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
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl grid-cols-1 overflow-hidden rounded-xl bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)] sm:min-h-[calc(100vh-3rem)] lg:grid-cols-2">
        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Welcome Back</h1>
              <p className="mt-2 text-sm text-slate-500">
                Sign in to continue managing your dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {errors.general && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {errors.general}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-slate-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@optic.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
                  className="h-12 rounded-xl border-slate-200 bg-white px-4 text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-blue-500"
                />
                {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="text-slate-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors({}); }}
                    className="h-12 rounded-xl border-slate-200 bg-white px-4 pr-12 text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition-colors hover:text-slate-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <span className="text-xs text-red-500">{errors.password}</span>}
              </div>

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-500">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700"
              >
                Sign in
              </Button>
            </form>
          </div>
        </div>

        <div className="hidden p-5 lg:block">
          <div className="flex h-full items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-8">
            <div className="w-full max-w-xl">
              <img
                src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=900&h=900&fit=crop"
                alt="Team collaboration"
                className="h-[460px] w-full rounded-xl object-cover shadow-2xl"
              />
              <p className="mt-5 text-center text-sm text-blue-100/90">
                Manage courses, leads, and growth from a single modern dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
