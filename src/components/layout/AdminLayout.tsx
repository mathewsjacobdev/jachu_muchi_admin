import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminNavbar from "./AdminNavbar";
import { motion } from "framer-motion";

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(71,85,105,0.08),transparent_22%)]" />
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-[240px] transform transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AdminSidebar mobile collapsed={false} onToggle={() => setMobileOpen(false)} />
      </div>

      <motion.div
        initial={false}
        animate={{ width: collapsed ? 56 : 240 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="hidden shrink-0 lg:block"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminNavbar onMenuClick={() => setMobileOpen(!mobileOpen)} />
        <main className="relative z-10 flex-1 p-3 sm:p-4 md:p-6">
          <div className="mx-auto w-full max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
