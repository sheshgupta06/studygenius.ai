import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FileText, Trash2, Download, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { documentsService } from "@/services/documents.service";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { useUpload } from "@/hooks/useUpload";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatRelativeDate, formatFileSize } from "@/utils/format";
import type { Document } from "@/types";

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const { upload, isUploading, uploadProgress } = useUpload();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: documentsService.list,
    refetchInterval: (data) => {
      // Poll every 3s if any document is processing
      const hasProcessing = (data?.state.data as Document[])?.some(d => d.status === "processing" || d.status === "uploading");
      return hasProcessing ? 3000 : false;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: documentsService.delete,
    onSuccess: () => {
      toast.success("Document deleted");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const filteredDocs = documents?.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase())) || [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Uploader */}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Document Library</h1>
            <p className="text-[var(--text-secondary)]">Manage your uploaded PDFs and generated content.</p>
          </div>
          
          <DocumentUploader 
            onUploadStart={upload} 
            isUploading={isUploading} 
            uploadProgress={uploadProgress} 
          />
        </div>
      </div>

      {/* List Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <h2 className="text-xl font-bold">Your Files ({filteredDocs.length})</h2>
          <div className="w-full sm:w-64">
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-[var(--text-muted)] animate-pulse border border-[var(--border)] rounded-2xl">
            Loading your library...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center border border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-elevated)]">
            <FileText className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-1">No documents found</h3>
            <p className="text-[var(--text-secondary)] text-sm">
              {searchQuery ? "Try a different search term." : "Upload a PDF above to get started."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => (
              <DocumentCard 
                key={doc.id} 
                document={doc} 
                onDelete={() => {
                  if (confirm("Are you sure you want to delete this document? This cannot be undone.")) {
                    deleteMutation.mutate(doc.id);
                  }
                }} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentCard({ document: doc, onDelete }: { document: Document; onDelete: () => void }) {
  const isReady = doc.status === "ready";
  const isProcessing = doc.status === "processing" || doc.status === "uploading";

  return (
    <div className="card-elevated p-5 flex flex-col group relative overflow-hidden">
      {/* Decorative gradient blob */}
      {isReady && <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--brand-from)] opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity" />}
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="w-10 h-10 rounded-lg bg-[var(--bg-overlay)] border border-[var(--border-strong)] flex items-center justify-center flex-shrink-0 text-[var(--text-secondary)]">
          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" /> : <FileText className="w-5 h-5" />}
        </div>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] rounded-md transition-colors" title="Download Source">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition-colors" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <h3 className="font-semibold text-[var(--text-primary)] truncate mb-1" title={doc.title}>{doc.title}</h3>
      
      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mb-5">
        <span>{formatRelativeDate(doc.created_at)}</span>
        <span>•</span>
        <span>{doc.file_size ? formatFileSize(doc.file_size) : "Unknown size"}</span>
      </div>
      
      <div className="mt-auto pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
        <StatusBadge status={doc.status} />
        
        <Link to={`/documents/${doc.id}`} className={isReady ? "" : "pointer-events-none"}>
          <Button variant={isReady ? "outline" : "ghost"} size="sm" disabled={!isReady}>
            Open
          </Button>
        </Link>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Document["status"] }) {
  const map: Record<string, { label: string; cn: string }> = {
    uploading: { label: "Uploading", cn: "badge-warning" },
    processing: { label: "Processing", cn: "badge-accent" },
    ready: { label: "Ready", cn: "badge-success" },
    failed: { label: "Failed", cn: "badge-error" },
  };
  const { label, cn: className } = map[status] || { label: "Unknown", cn: "" };
  
  return (
    <span className={`badge ${className}`}>
      {status === "processing" && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
      {label}
    </span>
  );
}
