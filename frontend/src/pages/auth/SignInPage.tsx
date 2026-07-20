import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "./AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/context/useAuthStore";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormValues) => {
    try {
      setIsLoading(true);
      const res = await authService.login(data);
      setAuth(res.user, res.access_token, res.refresh_token);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to sign in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account to continue">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          type="email"
          placeholder="Email address"
          icon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register("email")}
        />
        
        <Input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          icon={<Lock className="w-4 h-4" />}
          error={errors.password?.message}
          endNode={
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 hover:text-[var(--text-primary)] transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          {...register("password")}
        />
        
        <Button type="submit" variant="brand" className="w-full h-12 text-base" isLoading={isLoading}>
          Sign In
        </Button>
      </form>
      
      <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
        Don't have an account?{" "}
        <Link to="/sign-up" className="text-[var(--brand-from)] hover:text-[var(--brand-to)] font-medium transition-colors">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
