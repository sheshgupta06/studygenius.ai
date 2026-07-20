import api from "./api";
import type { GeneratedContent, GenerationType } from "@/types";

const BASE = "/api/v1/generate";

export const generateService = {
  async generate(data: {
    document_id: string;
    generation_type: GenerationType;
    options?: Record<string, unknown>;
  }): Promise<GeneratedContent> {
    const res = await api.post<GeneratedContent>(BASE, data);
    return res.data;
  },

  async getByDocument(documentId: string): Promise<GeneratedContent[]> {
    const res = await api.get<GeneratedContent[]>(`${BASE}/${documentId}`);
    return res.data;
  },
};
