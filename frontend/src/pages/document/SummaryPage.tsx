import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { AlignLeft, RefreshCw, CheckCircle } from "lucide-react";

import { generateService } from "@/services/generate.service";
import { Button } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import type { Document, SummaryContent } from "@/types";

export default function SummaryPage() {
  const { document } = useOutletContext<{ document: Document }>();
  const queryClient = useQueryClient();

  const { data: generations, isLoading } = useQuery({
    queryKey: ["generations", document.id],
    queryFn: () => generateService.getByDocument(document.id),
  });

  const generateMutation = useMutation({
    mutationFn: () => generateService.generate({ document_id: document.id, generation_type: "summary" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["generations", document.id] }),
  });

  if (isLoading) return <LoadingScreen />;

  const summaryGen = generations?.find(g => g.generation_type === "summary");
  const summaryContent = summaryGen?.content as SummaryContent | undefined;

  if (!summaryContent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-6 border border-[var(--border)]">
          <AlignLeft className="w-8 h-8 text-[var(--accent)]" />
        </div>
        <h3 className="text-2xl font-bold mb-3">Executive Summary</h3>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-8">
          Get a high-level executive summary, key takeaways, and section breakdowns instantly.
        </p>
        <Button 
          variant="brand" 
          size="lg" 
          onClick={() => generateMutation.mutate()} 
          isLoading={generateMutation.isPending}
        >
          Generate Summary
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-base)] overflow-y-auto">
      <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-10 animate-fade-in">
        
        {/* Header Action */}
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => generateMutation.mutate()} 
            isLoading={generateMutation.isPending}
            className="gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <RefreshCw className="w-4 h-4" /> Regenerate
          </Button>
        </div>

        {/* Executive Summary */}
        <section className="bg-[var(--bg-surface)] p-8 rounded-2xl border border-[var(--border)] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--brand-from)]" />
          <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">Executive Summary</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed text-lg">
            {summaryContent.executive_summary}
          </p>
        </section>

        {/* Key Points */}
        <section>
          <h2 className="text-xl font-bold mb-6 text-[var(--text-primary)] flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            Key Takeaways
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {summaryContent.key_points.map((point, idx) => (
              <div key={idx} className="card-elevated p-5 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--accent-muted)] text-[var(--brand-from)] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sections */}
        <section>
          <h2 className="text-xl font-bold mb-6 text-[var(--text-primary)]">Section Breakdown</h2>
          <div className="space-y-6">
            {summaryContent.sections.map((section, idx) => (
              <div key={idx} className="border-l-2 border-[var(--border)] pl-6 py-1">
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">{section.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
