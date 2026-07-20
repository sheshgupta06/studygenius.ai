import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { Layers, RefreshCw, ChevronLeft, ChevronRight, Rotate3d, Check, X } from "lucide-react";
import { cn } from "@/utils/cn";

import { generateService } from "@/services/generate.service";
import { Button } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import type { Document, FlashcardsContent } from "@/types";

export default function FlashcardsPage() {
  const { document } = useOutletContext<{ document: Document }>();
  const queryClient = useQueryClient();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set());

  const { data: generations, isLoading } = useQuery({
    queryKey: ["generations", document.id],
    queryFn: () => generateService.getByDocument(document.id),
  });

  const generateMutation = useMutation({
    mutationFn: () => generateService.generate({ document_id: document.id, generation_type: "flashcards" }),
    onSuccess: () => {
      setCurrentIdx(0);
      setIsFlipped(false);
      setKnownCards(new Set());
      queryClient.invalidateQueries({ queryKey: ["generations", document.id] });
    },
  });

  if (isLoading) return <LoadingScreen />;

  const cardsGen = generations?.find(g => g.generation_type === "flashcards");
  const flashcardsContent = cardsGen?.content as FlashcardsContent | undefined;

  if (!flashcardsContent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-6 border border-[var(--border)]">
          <Layers className="w-8 h-8 text-[var(--accent)]" />
        </div>
        <h3 className="text-2xl font-bold mb-3">Interactive Flashcards</h3>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-8">
          Master key concepts with auto-generated 3D flashcards. Perfect for active recall and spaced repetition.
        </p>
        <Button 
          variant="brand" 
          size="lg" 
          onClick={() => generateMutation.mutate()} 
          isLoading={generateMutation.isPending}
        >
          Generate Flashcards
        </Button>
      </div>
    );
  }

  const cards = flashcardsContent.cards;

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIdx((c) => Math.min(cards.length - 1, c + 1)), 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIdx((c) => Math.max(0, c - 1)), 150);
  };

  const markKnown = () => {
    setKnownCards(prev => new Set(prev).add(currentIdx));
    if (currentIdx < cards.length - 1) handleNext();
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-base)]">
      {/* Header */}
      <div className="h-14 border-b border-[var(--border)] flex items-center justify-between px-6 bg-[var(--bg-surface)] shrink-0">
        <div className="flex items-center gap-4 w-full max-w-2xl mx-auto">
          <div className="text-sm font-medium text-[var(--text-secondary)] w-16">
            {currentIdx + 1} / {cards.length}
          </div>
          <div className="flex-1 progress-bar">
            <div 
              className="progress-bar-fill"
              style={{ width: `${((currentIdx + 1) / cards.length) * 100}%` }}
            />
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => generateMutation.mutate()} 
            isLoading={generateMutation.isPending}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2 ml-4"
            title="Regenerate Flashcards"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 p-6 md:p-12 flex flex-col items-center justify-center overflow-hidden">
        
        {/* Flashcard container (3D perspective) */}
        <div className="w-full max-w-2xl aspect-[4/3] sm:aspect-[16/9] mb-10 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
          <div className="flashcard-scene">
            <div className={cn("flashcard-card shadow-lg hover:shadow-xl group-hover:scale-[1.02]", isFlipped && "flipped")}>
              
              {/* Front Face */}
              <div className="flashcard-face flashcard-front">
                <div className="absolute top-4 right-4 text-xs font-bold text-[var(--text-muted)] tracking-wider uppercase">
                  Term
                </div>
                <h2 className="text-2xl sm:text-4xl font-bold text-center leading-tight">
                  {cards[currentIdx].front}
                </h2>
                {cards[currentIdx].hint && (
                  <div className="absolute bottom-6 text-sm text-[var(--brand-from)] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                    <Rotate3d className="w-4 h-4" /> Click to flip
                  </div>
                )}
              </div>

              {/* Back Face */}
              <div className="flashcard-face flashcard-back">
                <div className="absolute top-4 right-4 text-xs font-bold text-[var(--text-muted)] tracking-wider uppercase">
                  Definition
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-medium leading-relaxed text-[var(--text-primary)]">
                    {cards[currentIdx].back}
                  </p>
                  {cards[currentIdx].hint && (
                    <p className="mt-6 text-sm font-medium text-[var(--brand-to)] bg-[var(--accent-muted)] inline-block px-3 py-1 rounded-full">
                      Hint: {cards[currentIdx].hint}
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 w-full max-w-2xl">
          <Button variant="outline" size="icon" onClick={handlePrev} disabled={currentIdx === 0} className="w-12 h-12 rounded-full">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          
          <div className="flex-1 flex justify-center gap-3">
            <Button variant="danger" size="lg" className="w-full max-w-[140px] rounded-full" onClick={() => handleNext()}>
              <X className="w-5 h-5 mr-2" /> Needs Review
            </Button>
            <Button variant="brand" size="lg" className="w-full max-w-[140px] rounded-full bg-emerald-500 hover:bg-emerald-600 border-none shadow-[0_4px_14px_rgba(16,185,129,0.35)]" onClick={markKnown}>
              <Check className="w-5 h-5 mr-2" /> Got It
            </Button>
          </div>

          <Button variant="outline" size="icon" onClick={handleNext} disabled={currentIdx === cards.length - 1} className="w-12 h-12 rounded-full">
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

        {/* Progress summary */}
        <div className="mt-8 text-sm text-[var(--text-muted)]">
          Mastered: <span className="text-emerald-500 font-bold">{knownCards.size}</span> / {cards.length}
        </div>

      </div>
    </div>
  );
}
