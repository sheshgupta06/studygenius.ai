import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { FeaturesSection } from "@/components/landing/FeaturesSection";

export default function FeaturesPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--bg-base)]">
      <Navbar />
      <main className="flex-1 pt-24">
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}
