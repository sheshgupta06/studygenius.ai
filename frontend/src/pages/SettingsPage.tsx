import { useState } from "react";
import { Moon, Sun, Bell, Globe, Monitor, Check } from "lucide-react";
import { useThemeStore } from "@/context/useThemeStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export default function SettingsPage() {
  const { theme, setTheme } = useThemeStore();
  const [language, setLanguage] = useState("en");
  const [notifications, setNotifications] = useState(true);

  const saveSettings = () => {
    toast.success("Settings saved successfully.");
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Settings</h1>
        <p className="text-[var(--text-secondary)]">Manage your application preferences and display settings.</p>
      </div>

      <div className="space-y-6">
        
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Monitor className="w-5 h-5" /> Appearance</CardTitle>
            <CardDescription>Customize how StudyGenius AI looks on your device.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <button 
                onClick={() => setTheme("light")}
                className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-colors ${theme === 'light' ? 'border-[var(--brand-from)] bg-[var(--accent-muted)]/50' : 'border-[var(--border)] hover:border-[var(--border-strong)]'}`}
              >
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 text-yellow-600 flex items-center justify-center">
                  <Sun className="w-5 h-5" />
                </div>
                <span className="font-medium">Light Mode</span>
              </button>
              
              <button 
                onClick={() => setTheme("dark")}
                className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-colors ${theme === 'dark' ? 'border-[var(--brand-from)] bg-[var(--accent-muted)]/50' : 'border-[var(--border)] hover:border-[var(--border-strong)]'}`}
              >
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Moon className="w-5 h-5" />
                </div>
                <span className="font-medium">Dark Mode</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" /> Language & Region</CardTitle>
            <CardDescription>Select your preferred language for the interface.</CardDescription>
          </CardHeader>
          <CardContent>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="en">English (US)</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" /> Notifications</CardTitle>
            <CardDescription>Control what alerts you receive.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
              <div>
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-[var(--text-muted)]">Receive updates on document processing and weekly digests.</p>
              </div>
              <button 
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-[var(--brand-from)]' : 'bg-[var(--border-strong)]'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button variant="brand" onClick={saveSettings} className="gap-2">
            <Check className="w-4 h-4" /> Save Preferences
          </Button>
        </div>

      </div>
    </div>
  );
}
