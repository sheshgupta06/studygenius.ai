import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useAuthStore } from "@/context/useAuthStore";
import { Button } from "@/components/ui/Button";

interface NavbarProps {
  hideAuthButtons?: boolean;
}

export function Navbar({ hideAuthButtons = false }: NavbarProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-base)]/80 backdrop-blur-md border-b border-[var(--border-subtle)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-[var(--accent-glow)]">
            <img src="/logo.png" alt="StudyGenius.AI Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-xl tracking-tight">StudyGenius<span className="text-[var(--accent)]">.AI</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Home</Link>
          <Link to="/features" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Features</Link>
          <Link to="/about" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">About</Link>
          <Link to="/pricing" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Pricing</Link>
          <Link to="/contact" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Contact</Link>
        </div>

        {!hideAuthButtons && (
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="brand">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/sign-in">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/sign-up">
                  <Button variant="brand">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        )}

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-[var(--border-subtle)] bg-[var(--bg-base)] overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Home</Link>
              <Link to="/features" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Features</Link>
              <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">About</Link>
              <Link to="/pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Pricing</Link>
              <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Contact</Link>
              
              {!hideAuthButtons && (
                <>
                  <div className="h-px w-full bg-[var(--border-subtle)] my-2" />
                  <div className="flex flex-col gap-3">
                    {isAuthenticated ? (
                      <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="brand" className="w-full">Dashboard</Button>
                      </Link>
                    ) : (
                      <>
                        <Link to="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full">Login</Button>
                        </Link>
                        <Link to="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="brand" className="w-full">Get Started</Button>
                        </Link>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
