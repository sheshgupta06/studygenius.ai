import api from "./api";
import type { Document, UploadUrlResponse } from "@/types";

const BASE = "/api/v1/documents";

export const documentsService = {
  async getUploadUrl(data: { file_name: string; file_type: string; file_size: number }): Promise<UploadUrlResponse> {
    const res = await api.post<UploadUrlResponse>(`${BASE}/upload-url`, data);
    return res.data;
  },

  async uploadToS3(uploadUrl: string, file: File, onProgress?: (pct: number) => void): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload  = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`S3 upload failed: ${xhr.status}`)));
      xhr.onerror = () => reject(new Error("S3 upload network error"));
      xhr.send(file);
    });
  },

  async create(data: { title: string; original_name: string; s3_key: string; s3_url: string; file_size?: number }): Promise<Document> {
    const res = await api.post<Document>(BASE, data);
    return res.data;
  },

  async list(): Promise<Document[]> {
    const res = await api.get<Document[]>(BASE);
    return res.data;
  },

  async getById(id: string): Promise<Document> {
    const res = await api.get<Document>(`${BASE}/${id}`);
    return res.data;
  },

  async update(id: string, data: { title?: string }): Promise<Document> {
    const res = await api.patch<Document>(`${BASE}/${id}/rename`, data);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE}/${id}`);
  },

  async ingest(id: string): Promise<{ status: string; chunk_count: number }> {
    const res = await api.post(`${BASE}/${id}/ingest`);
    return res.data;
  },
};
