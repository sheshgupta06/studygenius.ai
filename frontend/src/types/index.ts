// ── Auth ───────────────────────────────────────────────────────────────────────
export type Plan = "free" | "pro" | "enterprise";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: Plan;
  credits_used: number;
  credits_limit: number;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

// ── Documents ──────────────────────────────────────────────────────────────────
export type DocumentStatus = "uploading" | "processing" | "ready" | "failed";

export interface Document {
  id: string;
  user_id: string;
  title: string;
  original_name: string;
  s3_url: string;
  file_size: number | null;
  page_count: number | null;
  status: DocumentStatus;
  chroma_collection_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadUrlResponse {
  upload_url: string;
  s3_key: string;
  s3_url: string;
}

// ── Chat ───────────────────────────────────────────────────────────────────────
export type MessageRole = "user" | "assistant";

export interface SourceChunk {
  chunk_id: string;
  content: string;
  page_number: number | null;
  score: number;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  sources: SourceChunk[] | null;
  created_at: string;
  isStreaming?: boolean;
  isError?: boolean;
}

export interface Conversation {
  id: string;
  document_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

// ── Generation ─────────────────────────────────────────────────────────────────
export type GenerationType = "summary" | "notes" | "quiz" | "flashcards";

export interface SummaryContent {
  executive_summary: string;
  key_points: string[];
  sections: Array<{ title: string; content: string }>;
}

export interface NoteSubsection { title: string; content: string; }
export interface NoteSection    { title: string; content: string; subsections: NoteSubsection[]; }
export interface NotesContent   { title: string; sections: NoteSection[]; }

export interface QuizOption   { key: string; text: string; }
export interface QuizQuestion {
  question_number: number;
  question: string;
  options: QuizOption[];
  correct_answer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}
export interface QuizContent { title: string; total_questions: number; questions: QuizQuestion[]; }

export interface Flashcard       { card_number: number; front: string; back: string; hint: string | null; }
export interface FlashcardsContent { title: string; total_cards: number; cards: Flashcard[]; }

export interface GeneratedContent {
  id: string;
  document_id: string;
  generation_type: GenerationType;
  title: string | null;
  content: SummaryContent | NotesContent | QuizContent | FlashcardsContent;
  created_at: string;
}

// ── History ────────────────────────────────────────────────────────────────────
export interface ActivityLog {
  id: string;
  document_id: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  document_title?: string | null;
}

// ── API ────────────────────────────────────────────────────────────────────────
export interface ApiError {
  detail: string;
}

// ── UI State ───────────────────────────────────────────────────────────────────
export type Theme = "dark" | "light";
