import { useState } from "react";
import { Loader2, ExternalLink, Download } from "lucide-react";

interface DocumentPdfViewerProps {
  url: string;
}

/**
 * PDF Viewer using browser's native rendering via <iframe>.
 * No third-party library needed — works across all modern browsers.
 */
export function DocumentPdfViewer({ url }: DocumentPdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-elevated)]">
      {/* PDF Controls Header */}
      <div className="h-12 border-b border-[var(--border)] flex items-center justify-between px-4 bg-[var(--bg-surface)] shrink-0">
        <span className="text-xs font-medium text-[var(--text-secondary)]">PDF Preview</span>
        <div className="flex items-center gap-2">
          <a
            href={url}
            download
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Download PDF"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open
          </a>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {/* Loading Overlay */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-elevated)] z-10">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-from)] mb-2" />
            <p className="text-sm text-[var(--text-muted)]">Loading PDF...</p>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-elevated)] z-10 gap-3">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center max-w-xs">
              <p className="text-sm text-red-400 mb-3">Could not display PDF preview.</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[var(--brand-from)] hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Open PDF in new tab
              </a>
            </div>
          </div>
        )}

        {/* Native Browser PDF Viewer */}
        <iframe
          src={url}
          className="w-full h-full border-0"
          title="PDF Document Viewer"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      </div>
    </div>
  );
}
