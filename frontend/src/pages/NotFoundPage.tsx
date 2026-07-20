import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[var(--bg-base)] text-center px-6">
      <h1 className="text-6xl font-extrabold text-[var(--accent)] mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
      <p className="text-[var(--text-secondary)] mb-8">The page you are looking for doesn't exist or has been moved.</p>
      <Link to="/">
        <Button variant="brand">Return Home</Button>
      </Link>
    </div>
  );
}
