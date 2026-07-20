import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) return formatDistanceToNow(date, { addSuffix: true });
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d, yyyy");
}

export function formatFullDate(dateString: string): string {
  return format(new Date(dateString), "MMMM d, yyyy 'at' h:mm a");
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatActivityAction(action: string): string {
  const map: Record<string, string> = {
    uploaded: "Uploaded document",
    chatted: "Chatted with document",
    generated_summary: "Generated summary",
    generated_notes: "Generated notes",
    generated_quiz: "Generated quiz",
    generated_flashcards: "Generated flashcards",
    exported: "Exported content",
    deleted: "Deleted document",
    processed: "Document processed",
  };
  return map[action] ?? capitalize(action.replace(/_/g, " "));
}
