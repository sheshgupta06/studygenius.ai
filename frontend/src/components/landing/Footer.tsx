import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.24c3-.3 6-1.5 6-6.6a5.46 5.46 0 0 0-1.5-3.78c.15-.38.65-1.8-.15-3.78s-1.2-.38-3.75 1.35a12.84 12.84 0 0 0-6.9 0c-2.55-1.73-3.75-1.35-3.75-1.35-.8 1.98-.3 3.4-.15 3.78A5.46 5.46 0 0 0 3 8.38c0 5.1 3 6.3 6 6.6a4.8 4.8 0 0 0-1 3.24v4" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export function Footer() {
  return (
    <footer className="bg-[var(--bg-elevated)] border-t border-[var(--border)] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Left Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm shadow-[var(--brand-from)]/20">
                <img src="/logo.png" alt="StudyGenius.AI Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-xl tracking-tight">StudyGenius<span className="text-[var(--accent)]">.AI</span></span>
            </Link>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              AI-powered study assistant that helps students upload PDFs, chat with AI, generate summaries, notes, quizzes and flashcards.
            </p>
          </div>

          {/* Center Links */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold mb-4 text-[var(--text-primary)]">Product</h4>
              <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                <li><Link to="/" className="hover:text-[var(--brand-from)] transition-colors block">Home</Link></li>
                <li><Link to="/dashboard" className="hover:text-[var(--brand-from)] transition-colors block">Dashboard</Link></li>
                <li><Link to="/features" className="hover:text-[var(--brand-from)] transition-colors block">Features</Link></li>
                <li><Link to="/upload" className="hover:text-[var(--brand-from)] transition-colors block">Upload PDF</Link></li>
                <li><Link to="/documents" className="hover:text-[var(--brand-from)] transition-colors block">My PDFs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-[var(--text-primary)]">Company</h4>
              <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                <li><Link to="/about" className="hover:text-[var(--brand-from)] transition-colors block">About</Link></li>
                <li><span className="hover:text-[var(--text-primary)] transition-colors block cursor-default">AI TITANS</span></li>
                <li><Link to="/contact" className="hover:text-[var(--brand-from)] transition-colors block">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-[var(--text-primary)]">Resources</h4>
              <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                <li><Link to="/#faq" className="hover:text-[var(--brand-from)] transition-colors block">FAQ</Link></li>
                <li><span className="hover:text-[var(--brand-from)] transition-colors block cursor-pointer">Documentation</span></li>
                <li><span className="hover:text-[var(--brand-from)] transition-colors block cursor-pointer">Help Center</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-[var(--text-primary)]">Legal</h4>
              <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                <li><Link to="/privacy" className="hover:text-[var(--brand-from)] transition-colors block">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-[var(--brand-from)] transition-colors block">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          {/* About AI TITANS */}
          <div className="lg:col-span-1">
            <h4 className="font-bold mb-4 text-[var(--text-primary)]">About AI TITANS</h4>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
              AI TITANS is a passionate team focused on building practical AI-powered applications that solve real-world problems for students, developers, and businesses.
            </p>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
              Our mission is to make AI simple, accessible, and impactful through innovative products.
            </p>
            <div className="flex gap-4">
              <a href="https://github.com/sheshgupta06" target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-transform hover:-translate-y-1 transform duration-300">
                <GithubIcon className="w-5 h-5" />
              </a>
              <a href="https://www.linkedin.com/in/sheshgupta06" target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-[#0077b5] transition-transform hover:-translate-y-1 transform duration-300">
                <LinkedinIcon className="w-5 h-5" />
              </a>
              <a href="mailto:sheshgupta969613@gmail.com" className="text-[var(--text-muted)] hover:text-red-500 transition-transform hover:-translate-y-1 transform duration-300">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
          
        </div>
        
        {/* Bottom Section */}
        <div className="border-t border-[var(--border)] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[var(--text-muted)]">
          <div>
            &copy; 2026 StudyGenius.AI
          </div>
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
            <span>Built with ❤️ by <span className="font-semibold text-[var(--text-primary)]">AI TITANS</span></span>
            <span className="hidden md:inline-block w-1 h-1 rounded-full bg-[var(--border-strong)]"></span>
            <span>Powered by <span className="text-[var(--text-secondary)]">React • FastAPI • Gemini AI • ChromaDB</span></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
