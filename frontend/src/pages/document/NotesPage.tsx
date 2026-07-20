import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { BookOpen, RefreshCw, Download, FileText } from "lucide-react";

import { generateService } from "@/services/generate.service";
import { Button } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import type { Document, NotesContent } from "@/types";

export default function NotesPage() {
  const { document } = useOutletContext<{ document: Document }>();
  const queryClient = useQueryClient();

  const { data: generations, isLoading } = useQuery({
    queryKey: ["generations", document.id],
    queryFn: () => generateService.getByDocument(document.id),
  });

  const generateMutation = useMutation({
    mutationFn: () => generateService.generate({ document_id: document.id, generation_type: "notes" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["generations", document.id] }),
  });

  if (isLoading) return <LoadingScreen />;

  const notesGen = generations?.find(g => g.generation_type === "notes");
  const notesContent = notesGen?.content as NotesContent | undefined;

  if (!notesContent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-6 border border-[var(--border)]">
          <BookOpen className="w-8 h-8 text-[var(--accent)]" />
        </div>
        <h3 className="text-2xl font-bold mb-3">Structured Study Notes</h3>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-8">
          Generate comprehensive, highly structured study notes from this document, broken down into key sections and subtopics.
        </p>
        <Button 
          variant="brand" 
          size="lg" 
          onClick={() => generateMutation.mutate()} 
          isLoading={generateMutation.isPending}
        >
          Generate Notes
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-base)]">
      <div className="h-14 border-b border-[var(--border)] flex items-center justify-between px-6 bg-[var(--bg-surface)] shrink-0">
        <h3 className="font-semibold">{notesContent.title}</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => generateMutation.mutate()} 
            isLoading={generateMutation.isPending}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Regenerate
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10">
        <div className="max-w-3xl mx-auto prose-content animate-fade-in">
          {notesContent.sections.map((section, idx) => (
            <div key={idx} className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--brand-from)] border-b border-[var(--border)] pb-2 mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6" />
                {section.title}
              </h2>
              <p className="text-lg text-[var(--text-primary)] mb-6 font-medium leading-relaxed">
                {section.content}
              </p>
              
              <div className="space-y-6 pl-4 md:pl-8 border-l-2 border-[var(--border-strong)]">
                {section.subsections.map((sub, sIdx) => (
                  <div key={sIdx}>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                      {sub.title}
                    </h3>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      {sub.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
