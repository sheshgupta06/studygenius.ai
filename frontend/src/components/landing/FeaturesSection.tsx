import { FileText, MessageSquare, CheckSquare, Layers } from "lucide-react";

const features = [
  {
    icon: <MessageSquare className="w-6 h-6 text-blue-500" />,
    title: "Chat with Any Document",
    description: "Ask questions and get instant answers backed by citations directly from your uploaded PDFs.",
  },
  {
    icon: <FileText className="w-6 h-6 text-emerald-500" />,
    title: "Instant Summaries",
    description: "Generate executive summaries and detailed study notes in seconds to grasp core concepts quickly.",
  },
  {
    icon: <CheckSquare className="w-6 h-6 text-purple-500" />,
    title: "AI Quiz Generation",
    description: "Test your knowledge with auto-generated multiple-choice quizzes complete with explanations.",
  },
  {
    icon: <Layers className="w-6 h-6 text-amber-500" />,
    title: "Interactive Flashcards",
    description: "Master definitions and facts using 3D-flipping flashcards generated directly from your text.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-[var(--bg-base)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to learn faster</h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            StudyGenius AI replaces multiple tools by combining reading, notes, and testing into one seamless platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="card-elevated p-6 flex flex-col group">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-base)] border border-[var(--border)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed flex-1">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
