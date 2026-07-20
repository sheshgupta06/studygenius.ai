import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { CheckSquare, RefreshCw, ChevronRight, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { generateService } from "@/services/generate.service";
import { Button } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { cn } from "@/utils/cn";
import type { Document, QuizContent } from "@/types";

export default function QuizPage() {
  const { document } = useOutletContext<{ document: Document }>();
  const queryClient = useQueryClient();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const { data: generations, isLoading } = useQuery({
    queryKey: ["generations", document.id],
    queryFn: () => generateService.getByDocument(document.id),
  });

  const generateMutation = useMutation({
    mutationFn: () => generateService.generate({ document_id: document.id, generation_type: "quiz" }),
    onSuccess: () => {
      setCurrentIdx(0);
      setSelectedAnswers({});
      setShowResults(false);
      queryClient.invalidateQueries({ queryKey: ["generations", document.id] });
    },
  });

  if (isLoading) return <LoadingScreen />;

  const quizGen = generations?.find(g => g.generation_type === "quiz");
  const quizContent = quizGen?.content as QuizContent | undefined;

  if (!quizContent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-6 border border-[var(--border)]">
          <CheckSquare className="w-8 h-8 text-[var(--accent)]" />
        </div>
        <h3 className="text-2xl font-bold mb-3">Interactive Quiz</h3>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-8">
          Test your knowledge with multiple-choice questions automatically generated from the document's core concepts.
        </p>
        <Button 
          variant="brand" 
          size="lg" 
          onClick={() => generateMutation.mutate()} 
          isLoading={generateMutation.isPending}
        >
          Generate Quiz
        </Button>
      </div>
    );
  }

  const questions = quizContent.questions;
  const isFinished = showResults;

  const handleSelect = (key: string) => {
    if (isFinished) return;
    setSelectedAnswers(prev => ({ ...prev, [currentIdx]: key }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(c => c + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleRetake = () => {
    setCurrentIdx(0);
    setSelectedAnswers({});
    setShowResults(false);
  };

  const score = Object.entries(selectedAnswers).reduce((acc, [idx, ans]) => {
    return acc + (ans === questions[Number(idx)].correct_answer ? 1 : 0);
  }, 0);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-base)]">
      {/* Header */}
      <div className="h-14 border-b border-[var(--border)] flex items-center justify-between px-6 bg-[var(--bg-surface)] shrink-0">
        <div className="flex items-center gap-4 w-full max-w-2xl mx-auto">
          <div className="text-sm font-medium text-[var(--text-secondary)] w-16">
            {!isFinished && `${currentIdx + 1} / ${questions.length}`}
          </div>
          <div className="flex-1 progress-bar">
            <div 
              className="progress-bar-fill"
              style={{ width: `${isFinished ? 100 : ((currentIdx) / questions.length) * 100}%` }}
            />
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => generateMutation.mutate()} 
            isLoading={generateMutation.isPending}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2 ml-4"
            title="Regenerate Quiz"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center">
        <div className="w-full max-w-2xl mt-4 sm:mt-10">
          
          <AnimatePresence mode="wait">
            {!isFinished ? (
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-8">
                  <span className="badge badge-accent mb-4">{questions[currentIdx].difficulty}</span>
                  <h2 className="text-xl sm:text-2xl font-bold leading-relaxed">
                    {questions[currentIdx].question}
                  </h2>
                </div>

                <div className="space-y-3">
                  {questions[currentIdx].options.map((opt) => {
                    const isSelected = selectedAnswers[currentIdx] === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => handleSelect(opt.key)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border transition-all duration-200 flex gap-4",
                          isSelected
                            ? "border-[var(--brand-from)] bg-[var(--accent-muted)]/50 ring-1 ring-[var(--brand-from)]"
                            : "border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)]"
                        )}
                      >
                        <span className={cn(
                          "flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-sm font-bold mt-0.5",
                          isSelected ? "bg-[var(--brand-from)] text-white" : "bg-[var(--bg-surface)] text-[var(--text-muted)]"
                        )}>
                          {opt.key}
                        </span>
                        <span className="text-[var(--text-primary)]">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-10 flex justify-end">
                  <Button 
                    variant="brand" 
                    size="lg" 
                    disabled={!selectedAnswers[currentIdx]} 
                    onClick={handleNext}
                    className="gap-2 px-8"
                  >
                    {currentIdx === questions.length - 1 ? "Finish" : "Next"}
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="w-32 h-32 mx-auto rounded-full border-8 flex items-center justify-center mb-6 border-[var(--brand-from)] shadow-[var(--shadow-glow)]">
                  <span className="text-4xl font-extrabold">{score}/{questions.length}</span>
                </div>
                <h2 className="text-3xl font-bold mb-2">Quiz Completed!</h2>
                <p className="text-[var(--text-secondary)] mb-10">
                  You answered {Math.round((score / questions.length) * 100)}% of the questions correctly.
                </p>

                <div className="flex gap-4 justify-center mb-16">
                  <Button variant="outline" size="lg" onClick={handleRetake} className="gap-2">
                    <RotateCcw className="w-5 h-5" /> Retake Quiz
                  </Button>
                </div>

                {/* Review Answers */}
                <div className="text-left space-y-6">
                  <h3 className="text-xl font-bold mb-6">Review Answers</h3>
                  {questions.map((q, idx) => {
                    const userAns = selectedAnswers[idx];
                    const isCorrect = userAns === q.correct_answer;
                    
                    return (
                      <div key={idx} className={cn(
                        "p-6 rounded-2xl border",
                        isCorrect ? "bg-[var(--success-muted)]/20 border-emerald-500/30" : "bg-[var(--error-muted)]/20 border-red-500/30"
                      )}>
                        <h4 className="font-semibold mb-4">{q.question_number}. {q.question}</h4>
                        
                        <div className="grid sm:grid-cols-2 gap-4 mb-4">
                          <div className="p-3 rounded-lg bg-[var(--bg-surface)]/50 border border-[var(--border)]">
                            <span className="text-xs text-[var(--text-muted)] block mb-1">Your Answer</span>
                            <span className={isCorrect ? "text-emerald-500 font-medium" : "text-red-500 font-medium"}>
                              {q.options.find(o => o.key === userAns)?.text || "Skipped"}
                            </span>
                          </div>
                          {!isCorrect && (
                            <div className="p-3 rounded-lg bg-[var(--bg-surface)]/50 border border-[var(--border)]">
                              <span className="text-xs text-[var(--text-muted)] block mb-1">Correct Answer</span>
                              <span className="text-emerald-500 font-medium">
                                {q.options.find(o => o.key === q.correct_answer)?.text}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] mt-4 text-sm text-[var(--text-secondary)]">
                          <strong className="text-[var(--text-primary)] block mb-1">Explanation:</strong>
                          {q.explanation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
        </div>
      </div>
    </div>
  );
}
