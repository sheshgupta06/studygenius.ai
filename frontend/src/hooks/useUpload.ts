import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/services/api";
import type { Document } from "@/types";

export function useUpload() {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<Document> => {
      setIsUploading(true);
      setUploadProgress(10);

      try {
        // Build multipart form data and POST directly to backend
        const formData = new FormData();
        formData.append("file", file);

        setUploadProgress(30);

        const response = await api.post<Document>("/api/v1/documents/upload", formData, {
          headers: { "Content-Type": undefined },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const pct = Math.round((progressEvent.loaded / progressEvent.total) * 60);
              setUploadProgress(30 + pct); // Scale 30→90
            }
          },
        });

        setUploadProgress(100);
        return response.data;

      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      toast.success("Document uploaded! Processing started in background...");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || error.message || "Failed to upload document.");
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  return {
    upload: uploadMutation.mutateAsync,
    isUploading,
    uploadProgress,
  };
}
