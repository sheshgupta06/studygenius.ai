import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Mail, MessageSquare, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Message sent! We will get back to you shortly.");
    }, 1000);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--bg-base)]">
      <Navbar />
      <main className="flex-1 pt-32 pb-24 max-w-7xl mx-auto px-6 animate-fade-in-up w-full">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Contact Us</h1>
          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
            Have questions or need support? Drop us a message and our team will assist you.
          </p>
        </div>

        <div className="max-w-2xl mx-auto card-elevated p-8 md:p-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input required placeholder="Your name" icon={<User className="w-4 h-4" />} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input required type="email" placeholder="you@example.com" icon={<Mail className="w-4 h-4" />} />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input required placeholder="How can we help?" icon={<MessageSquare className="w-4 h-4" />} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <textarea 
                required 
                className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none min-h-[150px]"
                placeholder="Write your message here..."
              />
            </div>

            <Button type="submit" variant="brand" size="lg" className="w-full" isLoading={loading}>
              Send Message
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
