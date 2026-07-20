import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[var(--bg-base)]">
      <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)] mb-4" />
      <h2 className="text-xl font-bold gradient-text">StudyGenius AI</h2>
      <p className="text-[var(--text-muted)] text-sm mt-2 animate-pulse">Loading experience...</p>
    </div>
  );
}
