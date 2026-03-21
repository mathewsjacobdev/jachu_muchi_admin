import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  GitBranch,
  Images,
  ImageUp,
  Newspaper,
  MessageSquareText,
  BookOpenText,
  MessagesSquare,
  GraduationCap,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Glasses,
} from "lucide-react";

const navSections = [
  {
    label: "Core",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/" },
      { label: "Enquiries", icon: MessageSquareText, href: "/enquiries" },
      { label: "Course Enquiries", icon: BookOpenText, href: "/course-enquiries" },
      { label: "News", icon: Newspaper, href: "/news" },
    ],
  },
  {
    label: "Academic",
    items: [
      { label: "Courses", icon: Package, href: "/products" },
      { label: "Categories", icon: FolderTree, href: "/categories" },
      { label: "Testimonials", icon: MessagesSquare, href: "/testimonials" },
      { label: "Alumni", icon: GraduationCap, href: "/alumni" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Orders", icon: ShoppingCart, href: "/orders" },
      { label: "Branches", icon: GitBranch, href: "/branches" },
      { label: "Gallery", icon: Images, href: "/gallery" },
      { label: "Banners", icon: ImageUp, href: "/banners" },
      { label: "Users", icon: Users, href: "/users" },
      { label: "Settings", icon: Settings, href: "/settings" },
    ],
  },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
}

const AdminSidebar = ({ collapsed, onToggle, mobile = false }: AdminSidebarProps) => {
  const location = useLocation();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 56 : 240 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className={`z-30 flex flex-col overflow-hidden border-r border-white/20 bg-slate-900/80 shadow-lg backdrop-blur-xl ${
        mobile ? "relative h-full" : "fixed left-0 top-0 h-screen"
      }`}
    >
      <div className="flex h-14 items-center gap-2 px-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Glasses className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="truncate text-base font-semibold text-gray-100"
          >
             V Trust
          </motion.span>
        )}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
        {navSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.href ||
                  (item.href !== "/" && location.pathname.startsWith(item.href));

                return (
                  <RouterNavLink
                    key={item.href}
                    to={item.href}
                    className={`group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-all duration-200
                      ${isActive
                        ? "bg-white/10 text-blue-400 font-medium shadow-md"
                        : "text-gray-300 hover:bg-white/10 hover:text-gray-100 hover:translate-x-1"
                      }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary"
                        transition={{ duration: 0.2 }}
                      />
                    )}
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </RouterNavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <button
        onClick={onToggle}
        className="mx-2 mb-3 flex items-center justify-center rounded-lg p-2 text-gray-300 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10 hover:text-gray-100"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </motion.aside>
  );
};

export default AdminSidebar;
