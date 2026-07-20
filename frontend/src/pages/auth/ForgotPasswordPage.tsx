import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "./AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    // Mock API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      toast.success("Recovery email sent!");
    }, 1000);
  };

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email and we'll send you a link to reset your password.">
      
      {!isSubmitted ? (
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email address"
            icon={<Mail className="w-4 h-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <Button type="submit" variant="brand" className="w-full h-12 text-base" isLoading={isLoading}>
            Send Reset Link
          </Button>
        </form>
      ) : (
        <div className="p-6 rounded-2xl bg-[var(--success-muted)] border border-emerald-500/20 text-center">
          <p className="text-emerald-500 font-medium mb-4">
            Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
          </p>
          <Button variant="outline" onClick={() => setIsSubmitted(false)}>Try another email</Button>
        </div>
      )}
      
      <p className="mt-8 text-center text-sm">
        <Link to="/sign-in" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
