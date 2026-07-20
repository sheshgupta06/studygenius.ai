import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Users, Target, Shield } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--bg-base)]">
      <Navbar />
      <main className="flex-1 pt-32 pb-24 max-w-5xl mx-auto px-6 animate-fade-in-up">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Our Mission</h1>
          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
            At AI Titans, we believe learning should be intuitive, interactive, and personalized. 
            We built StudyGenius AI to transform how students and professionals interact with dense information.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-24">
          <div className="card-elevated p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
              <Target className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3">Our Vision</h3>
            <p className="text-[var(--text-secondary)]">To eliminate the friction of studying by making any document instantly understandable through AI.</p>
          </div>
          <div className="card-elevated p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3">For Everyone</h3>
            <p className="text-[var(--text-secondary)]">Built for university students, researchers, lawyers, and anyone who needs to process PDFs quickly.</p>
          </div>
          <div className="card-elevated p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3">Privacy First</h3>
            <p className="text-[var(--text-secondary)]">Your documents belong to you. We ensure secure processing and never use your private data to train models.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
