import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "./AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/context/useAuthStore";

const signUpSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormValues) => {
    try {
      setIsLoading(true);
      const res = await authService.register(data);
      setAuth(res.user, res.access_token, res.refresh_token);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Create an account" subtitle="Join StudyGenius AI to master your documents">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          type="text"
          placeholder="Full name"
          icon={<User className="w-4 h-4" />}
          error={errors.full_name?.message}
          {...register("full_name")}
        />

        <Input
          type="email"
          placeholder="Email address"
          icon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register("email")}
        />
        
        <Input
          type={showPassword ? "text" : "password"}
          placeholder="Create a password"
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
          Sign Up
        </Button>
      </form>
      
      <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
        Already have an account?{" "}
        <Link to="/sign-in" className="text-[var(--brand-from)] hover:text-[var(--brand-to)] font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
