import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/context/useAuthStore";

export function HeroSection() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden hero-bg">
      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-sm font-medium mb-8 animate-fade-in-up">
          <Sparkles className="w-4 h-4 text-[var(--accent)]" />
          <span className="text-[var(--text-secondary)]">StudyGenius AI 2.0 is now live</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-fade-in-up stagger-1 leading-tight">
          Transform your PDFs into <br className="hidden md:block" />
          <span className="gradient-text">Smart Learning</span>
        </h1>
        
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-[var(--text-secondary)] mb-10 animate-fade-in-up stagger-2">
          Upload any document and instantly generate study notes, interactive flashcards, quizzes, and get answers to your questions in real-time.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up stagger-3">
          <Link to={isAuthenticated ? "/dashboard" : "/sign-up"}>
            <Button variant="brand" size="lg" className="w-full sm:w-auto gap-2 group">
              Start Learning for Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <a href="#how-it-works">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              See How It Works
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
