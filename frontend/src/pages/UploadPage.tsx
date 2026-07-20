import { useNavigate } from "react-router-dom";
import { useUpload } from "@/hooks/useUpload";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

export default function UploadPage() {
  const navigate = useNavigate();
  const { upload, isUploading, uploadProgress } = useUpload();
  
  // Custom upload wrapper to redirect on success
  const handleUpload = async (file: File) => {
    try {
      const doc = await upload(file);
      // Wait a moment for UX then redirect to the chat page for that document
      setTimeout(() => navigate(`/documents/${doc.id}`), 1000);
    } catch {
      // Error is handled by hook
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in-up h-full flex flex-col">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Upload PDF</h1>
          <p className="text-[var(--text-secondary)]">Drag and drop your document to begin processing.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="w-full max-w-2xl mx-auto">
          <DocumentUploader 
            onUploadStart={handleUpload} 
            isUploading={isUploading} 
            uploadProgress={uploadProgress} 
          />
        </div>
        
        {!isUploading && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-3">1</div>
              <h4 className="font-semibold mb-1">Upload</h4>
              <p className="text-xs text-[var(--text-secondary)]">Drop any PDF up to 50MB.</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-3">2</div>
              <h4 className="font-semibold mb-1">Process</h4>
              <p className="text-xs text-[var(--text-secondary)]">We securely extract and index the text.</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-purple-500/10 text-purple-500 rounded-full flex items-center justify-center mb-3">3</div>
              <h4 className="font-semibold mb-1">Learn</h4>
              <p className="text-xs text-[var(--text-secondary)]">Chat, generate notes, and take quizzes instantly.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
