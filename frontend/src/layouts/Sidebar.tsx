import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, History, Settings, LogOut, UploadCloud, Database } from "lucide-react";
import { useAuthStore } from "@/context/useAuthStore";
import { cn } from "@/utils/cn";

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Upload PDF", path: "/upload", icon: UploadCloud },
  { name: "My PDFs", path: "/documents", icon: FileText },
  { name: "History",   path: "/history",   icon: History },
  { name: "Settings",  path: "/settings",  icon: Settings },
  { name: "Profile",   path: "/profile",   icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuthStore();

  const creditsUsed = user?.credits_used || 0;
  const creditsLimit = user?.credits_limit || 10;
  const usagePercentage = Math.min(Math.round((creditsUsed / creditsLimit) * 100), 100);

  return (
    <aside className="w-[260px] flex-shrink-0 border-r border-[var(--border)] bg-[var(--bg-surface)] flex flex-col h-full hidden md:flex">
      <div className="p-6">
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform">
            <img src="/logo.png" alt="StudyGenius.AI Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-xl tracking-tight">StudyGenius<span className="text-[var(--accent)]">.AI</span></span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn("sidebar-item", isActive && "active")}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--border)] flex flex-col gap-4">
        {/* Storage Usage */}
        <div className="px-3">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)] mb-2">
            <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> Usage</span>
            <span>{usagePercentage}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${usagePercentage}%` }} />
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-1.5">{creditsUsed} of {creditsLimit} credits used</p>
        </div>

        <button
          onClick={logout}
          className="sidebar-item w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/10"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
