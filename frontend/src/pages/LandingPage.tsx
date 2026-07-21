import { Link } from "react-router-dom";
import { 
  ArrowRight, Sparkles, FileText, MessageSquare, 
  CheckSquare, Layers, UploadCloud, BrainCircuit,
  ChevronDown, Star, PlayCircle
} from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/context/useAuthStore";
import { useState } from "react";
import { cn } from "@/utils/cn";
import { motion, AnimatePresence, type Variants } from "framer-motion";

// FAQ Component
function FaqItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-[var(--border)] py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left focus:outline-none group"
      >
        <h4 className="text-lg font-medium group-hover:text-[var(--brand-from)] transition-colors">{question}</h4>
        <ChevronDown className={cn("w-5 h-5 text-[var(--text-muted)] transition-transform duration-300", isOpen && "rotate-180")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="text-[var(--text-secondary)] mt-4">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LandingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--bg-base)] selection:bg-[var(--brand-from)]/30">
      <Navbar />
      
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden hero-bg">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg-base)] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              <motion.div 
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-100px" }}
                className="text-center lg:text-left"
              >
                <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--brand-from)]/10 border border-[var(--brand-from)]/20 text-sm font-medium mb-8">
                  <Sparkles className="w-4 h-4 text-[var(--brand-from)]" />
                  <span className="text-[var(--brand-from)]">StudyGenius AI 2.0 is now live</span>
                </motion.div>

                <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
                  Turn your PDFs into <br />
                  <span className="gradient-text">Interactive Tutors</span>
                </motion.h1>
                
                <motion.p variants={fadeUp} className="text-lg md:text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto lg:mx-0">
                  Upload any textbook or document and instantly generate study notes, flashcards, quizzes, and chat with your content in real-time.
                </motion.p>

                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link to={isAuthenticated ? "/dashboard" : "/sign-up"}>
                    <Button variant="brand" size="lg" className="w-full sm:w-auto gap-2 group h-14 px-8 text-base shadow-lg shadow-[var(--brand-from)]/20">
                      Start Learning for Free
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <a href="#how-it-works">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-base gap-2 hover:bg-[var(--bg-elevated)]">
                      <PlayCircle className="w-5 h-5 text-[var(--text-muted)]" />
                      Watch Demo
                    </Button>
                  </a>
                </motion.div>
                
                <motion.div variants={fadeUp} className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-[var(--text-muted)]">
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-[var(--bg-base)] bg-[var(--bg-elevated)] flex items-center justify-center overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                      </div>
                    ))}
                  </div>
                  <p>Trusted by <span className="text-[var(--text-primary)] font-semibold">10,000+</span> students worldwide</p>
                </motion.div>
              </motion.div>

              {/* Upload PDF Illustration */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="relative hidden lg:block"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--brand-from)]/20 to-[var(--brand-to)]/20 blur-[100px] rounded-full" />
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="glass border border-[var(--border)] rounded-2xl p-4 shadow-2xl relative z-10 transform rotate-2"
                >
                  <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                    <div className="h-10 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center px-4 gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 rounded-full bg-[var(--brand-from)]/10 flex items-center justify-center mb-6">
                        <UploadCloud className="w-10 h-10 text-[var(--brand-from)]" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Drag & Drop your PDF here</h3>
                      <p className="text-[var(--text-secondary)] mb-6 text-sm">Supports up to 50MB per file</p>
                      <Link to={isAuthenticated ? "/upload" : "/sign-in"}>
                        <Button variant="outline" className="border-[var(--brand-from)] text-[var(--brand-from)] hover:bg-[var(--brand-from)]/10">Browse Files</Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
                
                {/* Floating Elements */}
                <motion.div 
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -left-8 top-1/4 glass p-4 rounded-xl shadow-xl flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <CheckSquare className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Generated</p>
                    <p className="text-sm font-bold">10 Question Quiz</p>
                  </div>
                </motion.div>
                <motion.div 
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                  className="absolute -right-4 bottom-1/4 glass p-4 rounded-xl shadow-xl flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Generated</p>
                    <p className="text-sm font-bold">Executive Summary</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* LOGO BAR (Brands) */}
        <section className="py-10 border-y border-[var(--border)] bg-[var(--bg-elevated)]/50">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm font-medium text-[var(--text-muted)] tracking-widest uppercase mb-6">Powered by Industry Leading AI Models</p>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2 text-xl font-bold"><BrainCircuit /> OpenAI</div>
              <div className="flex items-center gap-2 text-xl font-bold"><Sparkles /> Google Gemini</div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="py-24 bg-[var(--bg-base)]">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="max-w-7xl mx-auto px-6"
          >
            <motion.div variants={fadeUp} className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Everything you need to learn faster</h2>
              <p className="text-[var(--text-secondary)] text-lg">
                StudyGenius AI replaces multiple tools by combining reading, notes, and testing into one seamless platform.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: <MessageSquare className="w-6 h-6 text-blue-500" />, title: "Chat with PDF", desc: "Ask questions and get instant, cited answers." },
                { icon: <FileText className="w-6 h-6 text-emerald-500" />, title: "Smart Summaries", desc: "Get executive summaries and structured notes instantly." },
                { icon: <CheckSquare className="w-6 h-6 text-purple-500" />, title: "AI Quizzes", desc: "Test knowledge with auto-generated multiple-choice questions." },
                { icon: <Layers className="w-6 h-6 text-amber-500" />, title: "Flashcards", desc: "Master concepts using 3D flipping flashcards." }
              ].map((f, i) => (
                <motion.div variants={scaleIn} key={i} className="card-elevated p-8 flex flex-col group hover:-translate-y-2 transition-transform duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--bg-base)] border border-[var(--border)] shadow-inner flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* DEEP DIVE SECTIONS */}
        <section id="how-it-works" className="py-24 bg-[var(--bg-surface)] relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 space-y-32">
            
            {/* Chat Section */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                  <MessageSquare className="w-6 h-6 text-blue-500" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Chat directly with your documents</h2>
                <p className="text-lg text-[var(--text-secondary)] mb-8">
                  Stop reading hundreds of pages. Just ask StudyGenius what you need to know. It will instantly search your document and provide an exact answer, complete with the specific page numbers so you can verify the source.
                </p>
                <ul className="space-y-4 text-[var(--text-secondary)]">
                  <li className="flex items-center gap-3"><CheckSquare className="w-5 h-5 text-[var(--brand-from)]" /> Precise page citations</li>
                  <li className="flex items-center gap-3"><CheckSquare className="w-5 h-5 text-[var(--brand-from)]" /> Remembers conversation history</li>
                  <li className="flex items-center gap-3"><CheckSquare className="w-5 h-5 text-[var(--brand-from)]" /> Real-time streaming responses</li>
                </ul>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full" />
                <div className="glass border border-[var(--border)] rounded-2xl p-6 shadow-2xl relative z-10">
                  <div className="flex gap-4 mb-6">
                    <div className="w-8 h-8 rounded-full bg-[var(--brand-from)] flex-shrink-0" />
                    <div className="bg-[var(--bg-base)] border border-[var(--border-strong)] p-4 rounded-2xl rounded-tl-none w-full">
                      <p className="text-sm">What is the mitochondria?</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex-shrink-0 flex items-center justify-center"><Sparkles className="w-4 h-4 text-blue-500" /></div>
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl rounded-tr-none w-full">
                      <p className="text-sm mb-3">The mitochondria is known as the powerhouse of the cell, responsible for generating most of the cell's supply of adenosine triphosphate (ATP).</p>
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--bg-base)] border border-[var(--border)] text-xs text-[var(--text-muted)]">
                        Citation: Page 42
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Summaries & Notes */}
            <div className="grid lg:grid-cols-2 gap-16 items-center flex-col-reverse lg:flex-row">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="order-2 lg:order-1 relative"
              >
                <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full" />
                <div className="glass border border-[var(--border)] rounded-2xl p-8 shadow-2xl relative z-10">
                  <h4 className="font-bold text-lg mb-6 flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-500"/> Executive Summary</h4>
                  <div className="space-y-4">
                    <div className="h-4 w-3/4 bg-[var(--border)] rounded animate-pulse" />
                    <div className="h-4 w-full bg-[var(--border)] rounded animate-pulse" />
                    <div className="h-4 w-5/6 bg-[var(--border)] rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-[var(--border)] rounded animate-pulse" />
                    
                    <h5 className="font-bold text-sm mt-6 mb-2">Key Notes:</h5>
                    <ul className="space-y-2 list-disc pl-5">
                      <li className="text-sm text-[var(--text-secondary)]">First important bullet point here</li>
                      <li className="text-sm text-[var(--text-secondary)]">Second critical takeaway from the text</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="order-1 lg:order-2"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                  <FileText className="w-6 h-6 text-emerald-500" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Automatic Summaries & Notes</h2>
                <p className="text-lg text-[var(--text-secondary)] mb-8">
                  Get the gist of any document in seconds. StudyGenius uses advanced AI to extract the most important information, providing executive summaries and detailed bulleted notes.
                </p>
                <ul className="space-y-4 text-[var(--text-secondary)]">
                  <li className="flex items-center gap-3"><CheckSquare className="w-5 h-5 text-[var(--brand-from)]" /> Executive summaries</li>
                  <li className="flex items-center gap-3"><CheckSquare className="w-5 h-5 text-[var(--brand-from)]" /> Bulleted study notes</li>
                  <li className="flex items-center gap-3"><CheckSquare className="w-5 h-5 text-[var(--brand-from)]" /> Export to Markdown</li>
                </ul>
              </motion.div>
            </div>

            {/* Quizzes & Flashcards */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
                  <CheckSquare className="w-6 h-6 text-purple-500" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Test yourself instantly</h2>
                <p className="text-lg text-[var(--text-secondary)] mb-8">
                  Generate multiple-choice quizzes and interactive flashcards from your PDF in a single click. StudyGenius identifies the most important concepts and creates study materials tailored exactly to your curriculum.
                </p>
                <ul className="space-y-4 text-[var(--text-secondary)]">
                  <li className="flex items-center gap-3"><CheckSquare className="w-5 h-5 text-[var(--brand-from)]" /> Explanations for wrong answers</li>
                  <li className="flex items-center gap-3"><CheckSquare className="w-5 h-5 text-[var(--brand-from)]" /> 3D-flipping flashcard interface</li>
                  <li className="flex items-center gap-3"><CheckSquare className="w-5 h-5 text-[var(--brand-from)]" /> Customizable difficulty levels</li>
                </ul>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-purple-500/20 blur-[100px] rounded-full" />
                
                {/* Quiz Card */}
                <div className="glass border border-[var(--border)] rounded-2xl p-8 shadow-2xl relative z-10 mb-8 transform -rotate-1">
                  <h4 className="font-bold text-lg mb-6 flex items-center gap-2"><CheckSquare className="w-5 h-5 text-purple-500"/> Pop Quiz</h4>
                  <div className="space-y-4">
                    <p className="font-medium">Which of the following best describes Newton's first law?</p>
                    <div className="space-y-2">
                      <div className="p-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-base)] text-sm">A) Force equals mass times acceleration</div>
                      <div className="p-3 rounded-lg border border-purple-500 bg-purple-500/10 text-sm font-medium">B) An object at rest stays at rest</div>
                      <div className="p-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-base)] text-sm">C) For every action there is a reaction</div>
                    </div>
                  </div>
                </div>

                {/* Flashcard Preview */}
                <div className="absolute -bottom-10 -right-6 glass border border-amber-500/30 rounded-xl p-6 shadow-2xl z-20 transform rotate-6 w-64 bg-amber-500/10 backdrop-blur-xl">
                   <div className="flex justify-between items-start mb-4">
                     <Layers className="w-5 h-5 text-amber-500" />
                     <span className="text-xs font-bold text-amber-500">FLASHCARD</span>
                   </div>
                   <p className="text-center font-bold text-lg py-4">Photosynthesis</p>
                   <p className="text-center text-xs text-[var(--text-muted)] mt-2">Click to flip ↺</p>
                </div>
              </motion.div>
            </div>

          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-24 bg-[var(--bg-base)]">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="max-w-7xl mx-auto px-6"
          >
            <motion.div variants={fadeUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Loved by Students</h2>
              <p className="text-[var(--text-secondary)] text-lg">Don't just take our word for it.</p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "Sarah M.", role: "Medical Student", quote: "StudyGenius saved me hundreds of hours summarizing my anatomy textbooks. The quizzes are a lifesaver for finals." },
                { name: "James L.", role: "Law Student", quote: "Being able to upload 200-page case studies and chat with them instantly is basically a superpower." },
                { name: "Emily R.", role: "High School Senior", quote: "The flashcards feature is amazing. It automatically pulls out the most important dates and facts for my history class." }
              ].map((t, i) => (
                <motion.div variants={scaleIn} key={i} className="card-elevated p-8 flex flex-col">
                  <div className="flex text-amber-400 mb-6">
                    <Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" />
                  </div>
                  <p className="text-[var(--text-primary)] italic mb-8 flex-1">"{t.quote}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-surface)] overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i+40}`} alt={t.name} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{t.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* FAQ */}
        <section className="py-24 bg-[var(--bg-surface)] border-t border-[var(--border)]">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto px-6"
          >
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-2">
              <FaqItem 
                question="How large can the PDFs be?" 
                answer="Currently, you can upload PDFs up to 50MB in size. We plan to increase this limit for Pro users in the future."
              />
              <FaqItem 
                question="What languages does StudyGenius support?" 
                answer="StudyGenius AI can process documents and converse in over 30 languages, including English, Spanish, French, German, Chinese, and Hindi."
              />
              <FaqItem 
                question="Are my documents private?" 
                answer="Yes, absolutely. Your documents are securely stored and are only accessible by you. We do not use your personal documents to train public AI models."
              />
              <FaqItem 
                question="Can I export the flashcards?" 
                answer="Yes! You can export your generated flashcards and notes to PDF or markdown formats to use offline."
              />
            </div>
          </motion.div>
        </section>

        {/* CTA Banner */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-from)] to-[var(--brand-to)]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto px-6 relative z-10 text-center text-white"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-8">Ready to ace your exams?</h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Join thousands of students who are learning faster and remembering more with StudyGenius AI.
            </p>
            <Link to="/sign-up">
              <Button size="lg" className="bg-white text-[var(--brand-from)] hover:bg-white/90 text-lg h-16 px-10 rounded-2xl shadow-2xl transition-transform hover:scale-105">
                Get Started for Free
              </Button>
            </Link>
          </motion.div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
