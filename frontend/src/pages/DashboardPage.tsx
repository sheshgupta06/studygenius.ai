import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FileText, Plus, BrainCircuit, History, CheckSquare, MessageSquare, Layers, TrendingUp } from "lucide-react";
import { motion, type Variants } from "framer-motion";

import { useAuthStore } from "@/context/useAuthStore";
import { documentsService } from "@/services/documents.service";
import { dashboardService } from "@/services/dashboard.service";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { formatRelativeDate, formatActivityAction } from "@/utils/format";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: documentsService.list,
  });

  const { data: dashStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: dashboardService.getStats,
    refetchInterval: 15000, // Refetch every 15 seconds to keep it real-time
  });

  const stats = [
    { title: "Total Documents", value: documents?.length || 0, icon: FileText, color: "text-blue-500" },
    { title: "Credits Used", value: `${user?.credits_used || 0} / ${user?.credits_limit || 10}`, icon: BrainCircuit, color: "text-purple-500" },
    { title: "Plan Status", value: user?.plan.toUpperCase() || "FREE", icon: History, color: "text-emerald-500" },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
              Welcome back, <span className="text-[var(--brand-from)]">{user?.full_name?.split(" ")[0] || "Student"}</span>
            </h1>
            <p className="text-[var(--text-secondary)] text-base">
              Here's an overview of your learning progress.
            </p>
          </div>
          <Link to="/documents">
            <Button variant="brand" size="lg" className="gap-2 shadow-lg shadow-[var(--brand-from)]/20 hover:shadow-[var(--brand-from)]/40 transition-shadow">
              <Plus className="w-5 h-5" />
              Upload Document
            </Button>
          </Link>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <Card key={i} className="hover:-translate-y-1 transition-transform duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column - Progress and Documents */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Learning Progress Card (Mocked) */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-500"/> Learning Progress</CardTitle>
                  <CardDescription>Your study consistency this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium">Weekly Goal</span>
                        <span className="text-[var(--text-secondary)]">{dashStats?.weekly_goal || 0}%</span>
                      </div>
                      <div className="h-3 w-full bg-[var(--bg-base)] rounded-full overflow-hidden border border-[var(--border)]">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${dashStats?.weekly_goal || 0}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                          className="h-full bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] rounded-full"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center pt-2">
                      <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-lg p-2">
                        <p className="text-xl font-bold text-[var(--brand-from)]">{dashStats?.docs_read || 0}</p>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Docs Read</p>
                      </div>
                      <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-lg p-2">
                        <p className="text-xl font-bold text-emerald-500">{dashStats?.quiz_score || 0}%</p>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Quiz Score</p>
                      </div>
                      <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-lg p-2">
                        <p className="text-xl font-bold text-amber-500">{dashStats?.study_time_hours || 0}h</p>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Study Time</p>
                      </div>
                      <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-lg p-2">
                        <p className="text-xl font-bold text-purple-500">{dashStats?.day_streak || 0}</p>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Day Streak</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Documents */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Recent Documents</h2>
                <Link to="/documents" className="text-sm font-medium text-[var(--brand-from)] hover:text-[var(--brand-to)] transition-colors">
                  View all
                </Link>
              </div>
              
              <Card>
                {isLoading ? (
                  <div className="p-8 text-center text-[var(--text-muted)] animate-pulse">Loading documents...</div>
                ) : documents && documents.length > 0 ? (
                  <div className="divide-y divide-[var(--border)]">
                    {documents.slice(0, 5).map((doc) => (
                      <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-[var(--bg-elevated)] transition-colors group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-medium truncate text-sm md:text-base group-hover:text-[var(--brand-from)] transition-colors">{doc.title}</p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {formatRelativeDate(doc.created_at)}
                            </p>
                          </div>
                        </div>
                        <Link to={`/documents/${doc.id}`}>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            Open
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-[var(--text-muted)]" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No documents yet</h3>
                    <p className="text-[var(--text-secondary)] text-sm max-w-sm mb-6">
                      Upload your first PDF to start chatting, generating flashcards, and taking quizzes.
                    </p>
                    <Link to="/documents">
                      <Button variant="outline">Upload your first PDF</Button>
                    </Link>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Right Column - AI Activity */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-purple-500"/> AI Activity</CardTitle>
                  <CardDescription>Recent generations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isStatsLoading ? (
                      <div className="text-center text-sm text-[var(--text-muted)] py-4 animate-pulse">Loading activity...</div>
                    ) : dashStats?.recent_activities && dashStats.recent_activities.length > 0 ? (
                      dashStats.recent_activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div className={`mt-0.5 p-1.5 rounded-md ${
                            activity.action.includes('chat') ? 'bg-blue-500/10 text-blue-500' :
                            activity.action.includes('quiz') ? 'bg-purple-500/10 text-purple-500' :
                            activity.action.includes('flashcard') ? 'bg-amber-500/10 text-amber-500' :
                            'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            {activity.action.includes('chat') ? <MessageSquare className="w-4 h-4"/> :
                             activity.action.includes('quiz') ? <CheckSquare className="w-4 h-4"/> :
                             activity.action.includes('flashcard') ? <Layers className="w-4 h-4"/> :
                             <FileText className="w-4 h-4"/>}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{formatActivityAction(activity.action)} {activity.document_title ? <span className="font-normal text-[var(--text-secondary)]">on {activity.document_title}</span> : ''}</p>
                            <p className="text-xs text-[var(--text-muted)]">{formatRelativeDate(activity.created_at)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-sm text-[var(--text-muted)] py-4">No recent activity</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}
