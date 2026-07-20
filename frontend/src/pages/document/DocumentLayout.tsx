import { useState } from "react";
import { Outlet, useParams, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, FileText, CheckSquare, Layers, FileUp, ArrowLeft, Info } from "lucide-react";

import { documentsService } from "@/services/documents.service";
import { cn } from "@/utils/cn";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { Button } from "@/components/ui/Button";
import { DocumentPdfViewer } from "./DocumentPdfViewer";
import { formatRelativeDate } from "@/utils/format";

const tabs = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "summary", label: "Summary", icon: FileText },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "quiz", label: "Quiz", icon: CheckSquare },
  { id: "flashcards", label: "Flashcards", icon: Layers },
];

export default function DocumentLayout() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch current doc
  const { data: document, isLoading, error } = useQuery({
    queryKey: ["document", id],
    queryFn: () => documentsService.getById(id!),
    enabled: !!id,
  });

  // Fetch all docs for left sidebar
  const { data: allDocuments } = useQuery({
    queryKey: ["documents"],
    queryFn: documentsService.list,
  });

  if (isLoading) return <LoadingScreen />;
  if (error || !document) return <div className="p-8 text-center text-red-500">Failed to load document.</div>;

  const currentTab = tabs.find(t => location.pathname.includes(t.id))?.id || "chat";

  return (
    <div className="flex h-[calc(100dvh-64px)] overflow-hidden bg-[var(--bg-base)]">
      
      {/* 1. Left Sidebar: Uploaded PDFs (ChatGPT Style) */}
      <div className="w-[260px] flex-shrink-0 border-r border-[var(--border)] bg-[var(--bg-surface)] hidden lg:flex flex-col">
        <div className="p-4 border-b border-[var(--border)]">
          <Link to="/upload">
            <Button variant="outline" className="w-full justify-start text-[var(--text-secondary)]">
              <span className="text-xl mr-2 mb-0.5">+</span> New Upload
            </Button>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Your Documents
          </div>
          {allDocuments?.map((doc) => (
            <Link
              key={doc.id}
              to={`/documents/${doc.id}/chat`}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg text-sm transition-colors group",
                doc.id === id 
                  ? "bg-[var(--accent-muted)]/50 text-[var(--text-primary)] font-medium" 
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
              )}
            >
              <FileText className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
              <span className="truncate flex-1">{doc.title}</span>
              {doc.id === id && <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-from)] shrink-0" />}
            </Link>
          ))}
        </div>
      </div>

      {/* 2. Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-14 flex-shrink-0 border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/documents" className="p-1.5 hover:bg-[var(--bg-overlay)] rounded-md transition-colors text-[var(--text-secondary)] lg:hidden">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h2 className="font-semibold text-sm truncate max-w-[200px] sm:max-w-md lg:max-w-full">{document.title}</h2>
            <span className="badge badge-success text-[10px] hidden sm:inline-flex">Ready</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsPdfOpen(!isPdfOpen)} title="Toggle PDF Viewer" className={isPdfOpen ? "bg-[var(--accent-muted)] text-[var(--brand-from)]" : ""}>
              <FileUp className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsDetailsOpen(!isDetailsOpen)} title="Document Details" className={isDetailsOpen ? "bg-[var(--accent-muted)] text-[var(--brand-from)]" : ""}>
              <Info className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex-shrink-0 border-b border-[var(--border)] px-2 overflow-x-auto no-scrollbar bg-[var(--bg-surface)]">
          <nav className="flex items-center space-x-1" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  to={`/documents/${id}/${tab.id}`}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    isActive
                      ? "border-[var(--brand-from)] text-[var(--brand-from)]"
                      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Split View Container */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Main Content (Chat/Notes) */}
          <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-[300px]">
            <Outlet context={{ document }} />
          </div>

          {/* Right Panel: PDF Viewer (if open) */}
          {isPdfOpen && (
            <div className="w-[45%] border-l border-[var(--border)] bg-[var(--bg-surface)] hidden xl:flex flex-col">
              <DocumentPdfViewer url={document.s3_url} />
            </div>
          )}

        </div>
        
        {/* Mobile PDF Modal Overlay */}
        {isPdfOpen && (
          <div className="xl:hidden fixed inset-0 z-50 bg-[var(--bg-base)] flex flex-col pt-16">
             <div className="absolute top-4 right-4 z-50">
                <Button variant="danger" size="sm" onClick={() => setIsPdfOpen(false)}>Close PDF</Button>
             </div>
             <DocumentPdfViewer url={document.s3_url} />
          </div>
        )}
      </div>

      {/* 3. Right Sidebar: Document Details */}
      {isDetailsOpen && (
        <div className="w-[300px] flex-shrink-0 border-l border-[var(--border)] bg-[var(--bg-surface)] hidden md:flex flex-col animate-slide-in-right">
          <div className="h-14 border-b border-[var(--border)] flex items-center px-4 font-semibold text-sm">
            Document Details
          </div>
          <div className="p-4 space-y-6 overflow-y-auto">
            
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Properties</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Uploaded</span>
                  <span className="font-medium">{formatRelativeDate(document.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Pages</span>
                  <span className="font-medium">{document.page_count || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Size</span>
                  <span className="font-medium">{document.file_size ? (document.file_size / 1024 / 1024).toFixed(2) + " MB" : "-"}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-6">
              <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Auto-Extracted Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {["Artificial Intelligence", "RAG", "Embeddings", "Vector Store", "Machine Learning"].map((kw) => (
                  <span key={kw} className="px-2.5 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)]">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-6">
              <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Summary Preview</h4>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic border-l-2 border-[var(--accent)] pl-3">
                This document discusses advanced concepts in Retrieval-Augmented Generation, specifically focusing on vector indexing strategies using ChromaDB and query routing for optimized context retrieval.
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
