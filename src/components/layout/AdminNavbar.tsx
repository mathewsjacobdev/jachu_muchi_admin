import { LogOut, Menu, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface AdminNavbarProps {
  onMenuClick: () => void;
}

const AdminNavbar = ({ onMenuClick }: AdminNavbarProps) => {
  const { adminEmail, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-white/10 bg-slate-900/60 px-4 backdrop-blur-xl">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-gray-300 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10 hover:text-gray-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <button className="relative rounded-lg p-2 text-gray-300 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10 hover:text-gray-100">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-400" />
        </button>

        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/15 text-2xs font-semibold text-blue-300 ring-1 ring-blue-500/20">
            {adminEmail?.[0]?.toUpperCase() || "A"}
          </div>
          <span className="max-w-[140px] truncate text-sm text-gray-300">{adminEmail || "Admin"}</span>
        </div>

        <Button variant="ghost" size="sm" onClick={logout} className="text-gray-300 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10 hover:text-gray-100">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};

export default AdminNavbar;
