import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { History, FileText, Bot, Download, BookOpen, Clock } from "lucide-react";

import api from "@/services/api";
import { formatFullDate, formatRelativeDate, formatActivityAction } from "@/utils/format";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import type { ActivityLog } from "@/types";

export default function HistoryPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const res = await api.get<ActivityLog[]>("/api/v1/history?limit=100");
      return res.data;
    },
  });

  if (isLoading) return <LoadingScreen />;

  // Group by date (relative)
  const groupedLogs = logs?.reduce((acc, log) => {
    const dateStr = formatRelativeDate(log.created_at);
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(log);
    return acc;
  }, {} as Record<string, ActivityLog[]>) || {};

  const getIconForAction = (action: string) => {
    if (action.includes("uploaded")) return <FileText className="w-5 h-5 text-blue-500" />;
    if (action.includes("chatted")) return <Bot className="w-5 h-5 text-emerald-500" />;
    if (action.includes("generated")) return <BookOpen className="w-5 h-5 text-purple-500" />;
    if (action.includes("exported")) return <Download className="w-5 h-5 text-amber-500" />;
    return <Clock className="w-5 h-5 text-[var(--text-muted)]" />;
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Activity History</h1>
        <p className="text-[var(--text-secondary)]">A complete timeline of your interactions across all documents.</p>
      </div>

      {logs?.length === 0 ? (
        <div className="p-12 text-center border border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-elevated)]">
          <History className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-1">No activity yet</h3>
          <p className="text-[var(--text-secondary)] text-sm">
            Upload a document to start building your learning history.
          </p>
        </div>
      ) : (
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[1.4rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[var(--brand-from)] before:via-[var(--border)] before:to-transparent">
          
          {Object.entries(groupedLogs).map(([dateLabel, dayLogs]) => (
            <div key={dateLabel} className="relative z-10">
              <div className="sticky top-16 z-20 md:flex md:justify-center mb-6">
                <span className="inline-flex items-center justify-center px-4 py-1.5 font-bold text-xs uppercase tracking-wide rounded-full bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-secondary)] shadow-sm">
                  {dateLabel}
                </span>
              </div>
              
              <div className="space-y-6">
                {dayLogs.map((log) => (
                  <div key={log.id} className="relative flex items-start gap-6 md:justify-between">
                    
                    {/* Desktop left side (empty or timestamp) */}
                    <div className="hidden md:flex w-1/2 justify-end pr-8 text-sm text-[var(--text-muted)] mt-1 font-medium">
                      {formatFullDate(log.created_at).split(" at ")[1]}
                    </div>
                    
                    {/* Timeline Node */}
                    <div className="absolute left-0 md:left-1/2 -translate-x-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-[var(--bg-surface)] border-2 border-[var(--border-strong)] shadow-sm group-hover:border-[var(--brand-from)] transition-colors">
                      {getIconForAction(log.action)}
                    </div>
                    
                    {/* Right side content */}
                    <div className="flex-1 md:w-1/2 pl-12 md:pl-8">
                      <div className="card-elevated p-4">
                        <div className="font-semibold text-sm mb-1">{formatActivityAction(log.action)}</div>
                        
                        {log.document_title ? (
                          <Link to={`/documents/${log.document_id}`} className="text-xs text-[var(--brand-from)] hover:text-[var(--brand-to)] hover:underline flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {log.document_title}
                          </Link>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">Document deleted</span>
                        )}
                        
                        <div className="md:hidden mt-2 text-xs text-[var(--text-muted)]">
                          {formatFullDate(log.created_at).split(" at ")[1]}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
        </div>
      )}
    </div>
  );
}
