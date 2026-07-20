import { Navbar } from "@/components/landing/Navbar";

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-[var(--bg-base)]">
      <Navbar hideAuthButtons={true} />
      
      {/* Left side: Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 md:px-24 lg:px-32 relative z-10 pt-20">
        <div className="w-full max-w-md mx-auto animate-fade-in-up">
          <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
          <p className="text-[var(--text-secondary)] mb-8">{subtitle}</p>
          
          {children}
        </div>
      </div>

      {/* Right side: Visual (hidden on mobile) */}
      <div className="hidden md:flex flex-1 relative bg-[var(--bg-surface)] overflow-hidden items-center justify-center hero-bg border-l border-[var(--border)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-from)]/10 to-[var(--brand-to)]/10 backdrop-blur-[2px]" />
        
        <div className="relative z-10 max-w-lg p-12 text-center">
          <div className="glass p-8 rounded-2xl animate-fade-in stagger-2">
            <h2 className="text-2xl font-bold text-white mb-4">Master Your Documents</h2>
            <p className="text-[var(--text-secondary)]">
              Upload your PDFs and let AI instantly generate summaries, flashcards, quizzes, and answer your questions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
