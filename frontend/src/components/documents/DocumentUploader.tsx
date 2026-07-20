import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

interface DocumentUploaderProps {
  onUploadStart: (file: File) => void;
  isUploading: boolean;
  uploadProgress: number;
}

export function DocumentUploader({ onUploadStart, isUploading, uploadProgress }: DocumentUploaderProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    if (rejectedFiles.length > 0) {
      const err = rejectedFiles[0].errors[0];
      if (err.code === "file-invalid-type") setError("Only PDF files are supported.");
      else if (err.code === "file-too-large") setError("File size must be under 50MB.");
      else setError(err.message);
      return;
    }

    if (acceptedFiles.length > 0) {
      onUploadStart(acceptedFiles[0]);
    }
  }, [onUploadStart]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: 52_428_800, // 50MB
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 ease-in-out cursor-pointer",
          isDragActive ? "border-[var(--brand-from)] bg-[var(--accent-muted)]" : "border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:border-[var(--brand-from)] hover:bg-[var(--accent-muted)]/50",
          isUploading ? "pointer-events-none opacity-80" : ""
        )}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="flex flex-col items-center justify-center max-w-sm mx-auto animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[var(--accent-muted)] flex items-center justify-center mb-6">
              <UploadCloud className="w-8 h-8 text-[var(--accent)] animate-pulse" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">Uploading Document...</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6 truncate max-w-xs">
              {acceptedFiles[0]?.name}
            </p>
            
            <div className="w-full bg-[var(--border-strong)] rounded-full h-2 mb-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] h-2 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{uploadProgress}%</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-base)] border border-[var(--border-strong)] shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8 text-[var(--text-secondary)]" />
            </div>
            <h3 className="text-xl font-bold mb-2">Drag & drop your PDF here</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">
              Or click to browse from your computer. Maximum file size is 50MB.
            </p>
            <Button variant="outline" type="button" className="pointer-events-none">
              Select File
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-500 animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm font-medium">{error}</div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-red-500/20 rounded-md transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
