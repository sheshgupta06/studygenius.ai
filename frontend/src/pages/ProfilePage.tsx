import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User as UserIcon, Mail, Settings, Shield, Trash2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import api from "@/services/api";
import { useAuthStore } from "@/context/useAuthStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import type { User } from "@/types";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters."),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const { data: user } = useQuery({
    queryKey: ["user", "profile"],
    queryFn: async () => {
      const res = await api.get<User>("/api/v1/users/profile");
      return res.data;
    },
    initialData: authUser || undefined,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: user?.full_name || "" },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await api.patch<User>("/api/v1/users/profile", data);
      return res.data;
    },
    onSuccess: (updatedUser) => {
      toast.success("Profile updated successfully.");
      setUser(updatedUser);
      queryClient.setQueryData(["user", "profile"], updatedUser);
    },
    onError: () => {
      toast.error("Failed to update profile.");
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await api.delete("/api/v1/users/account");
    },
    onSuccess: () => {
      toast.success("Account deactivated.");
      logout();
    },
  });

  if (!user) return null;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-10 animate-fade-in-up">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Account Settings</h1>
        <p className="text-[var(--text-secondary)] text-base">Manage your profile, preferences, and billing.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Left Column - Navigation/Overview */}
        <div className="md:col-span-1 space-y-4">
          <div className="card p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-[var(--brand-from)] text-white flex items-center justify-center font-bold text-3xl mb-4 shadow-lg shadow-[var(--accent-glow)]">
              {user.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
            </div>
            <h2 className="font-bold text-lg">{user.full_name}</h2>
            <p className="text-[var(--text-secondary)] text-sm mb-4">{user.email}</p>
            <span className="badge badge-accent px-3 py-1 text-sm">{user.plan.toUpperCase()} PLAN</span>
          </div>

          <nav className="space-y-1">
            <button className="sidebar-item active w-full justify-start">
              <UserIcon className="w-4 h-4" /> Personal Info
            </button>
            <button className="sidebar-item w-full justify-start">
              <Shield className="w-4 h-4" /> Security
            </button>
            <button className="sidebar-item w-full justify-start">
              <CreditCard className="w-4 h-4" /> Billing & Usage
            </button>
            <button className="sidebar-item w-full justify-start">
              <Settings className="w-4 h-4" /> Preferences
            </button>
          </nav>
        </div>

        {/* Right Column - Forms */}
        <div className="md:col-span-2 space-y-6">
          
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit((d) => updateProfileMutation.mutate(d))}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input 
                    {...register("full_name")}
                    error={errors.full_name?.message}
                    icon={<UserIcon className="w-4 h-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address (Read Only)</label>
                  <Input 
                    value={user.email}
                    disabled
                    icon={<Mail className="w-4 h-4" />}
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t border-[var(--border)] pt-6 mt-2">
                <Button 
                  type="submit" 
                  variant="brand" 
                  isLoading={updateProfileMutation.isPending}
                >
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="border-red-500/20 bg-red-500/5">
            <CardHeader>
              <CardTitle className="text-red-500">Danger Zone</CardTitle>
              <CardDescription>Permanently delete your account and all associated data.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Once you delete your account, there is no going back. All your uploaded documents, generated notes, and chat history will be permanently erased.
              </p>
              <Button 
                variant="danger" 
                onClick={() => {
                  if (confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.")) {
                    deleteAccountMutation.mutate();
                  }
                }}
                isLoading={deleteAccountMutation.isPending}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete Account
              </Button>
            </CardContent>
          </Card>
          
        </div>
      </div>
    </div>
  );
}
