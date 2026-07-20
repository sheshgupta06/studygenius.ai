import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Link } from "react-router-dom";

export default function PricingPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--bg-base)]">
      <Navbar />
      <main className="flex-1 pt-32 pb-24 max-w-7xl mx-auto px-6 animate-fade-in-up">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Simple, transparent pricing</h1>
          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
            Get started for free. Everything you need to supercharge your learning, with no hidden fees.
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="card-elevated p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[var(--brand-from)]" />
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">Free Plan</h2>
                <p className="text-[var(--text-secondary)]">Perfect for students & individuals.</p>
              </div>
              <div className="text-right">
                <span className="text-5xl font-extrabold">$0</span>
                <span className="text-[var(--text-muted)]">/forever</span>
              </div>
            </div>

            <Link to="/sign-up">
              <Button variant="brand" size="lg" className="w-full mb-8">Get Started for Free</Button>
            </Link>

            <div className="space-y-4">
              <p className="font-semibold text-sm uppercase tracking-wide text-[var(--text-muted)] mb-4">What's included</p>
              {[
                "Unlimited PDF Uploads (up to 50MB)",
                "Real-time AI Chat & Citations",
                "Instant Summary Generation",
                "Structured Study Notes",
                "Interactive Quizzes",
                "3D Spaced Repetition Flashcards",
                "Export functionalities"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[var(--success-muted)] text-emerald-500 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 font-bold" />
                  </div>
                  <span className="text-[var(--text-secondary)]">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
