import { Link } from "react-router-dom";
import { Menu, Moon, Sun, Bell } from "lucide-react";
import { useAuthStore } from "@/context/useAuthStore";
import { useThemeStore } from "@/context/useThemeStore";

export function TopNav({ onMenuClick }: { onMenuClick: () => void }) {
  const user = useAuthStore((s) => s.user);
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="h-16 flex-shrink-0 border-b border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between px-4 sm:px-6 z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden lg:flex items-center gap-6 ml-2">
          <Link to="/" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Home</Link>
          <Link to="/features" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Features</Link>
          <Link to="/about" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">About</Link>
          <Link to="/pricing" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Pricing</Link>
          <Link to="/contact" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Contact</Link>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
          title="Toggle Theme"
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <button className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border border-[var(--bg-surface)]" />
        </button>

        <div className="h-8 w-px bg-[var(--border)] mx-1" />

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium leading-none mb-1">{user?.full_name}</p>
            <p className="text-xs text-[var(--text-muted)] leading-none">{user?.plan.toUpperCase()} PLAN</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[var(--brand-from)] text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-[var(--bg-surface)]">
            {user?.full_name?.charAt(0).toUpperCase() || user?.email.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
