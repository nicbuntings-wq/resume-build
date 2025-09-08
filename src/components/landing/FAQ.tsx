"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { HelpCircle, Sparkles } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQ() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const faqItems: FAQItem[] = [
    {
      question: "How does Cyme.AI tailor my resume for specific jobs?",
      answer:
        "Our AI analyzes the job description and adjusts your content, keywords, and structure to match what recruiters and ATS systems look for. It sharpens bullet points, highlights relevant skills, and aligns your experience with the role."
    },
    {
      question: "Is Cyme.AI free to use?",
      answer:
        "Yes—there’s a free tier so you can get started quickly. You can also use your own AI provider API keys. Our Pro plan unlocks more usage and built-in access to premium models without bringing your own keys."
    },
    {
      question: "What makes Cyme.AI different from other resume builders?",
      answer:
        "Cyme.AI focuses on AI-powered tailoring, ATS compatibility, and quick iteration. Start from a single base resume, then generate targeted versions for each job in minutes."
    },
    {
      question: "How long does it take to create a resume with Cyme.AI?",
      answer:
        "Most people create a solid base resume in under 15 minutes. From there, generating tailored versions for new roles typically takes just a couple of minutes."
    },
    {
      question: "Will my resume pass ATS (Applicant Tracking Systems)?",
      answer:
        "That’s the goal. Our templates and suggestions favor clean formatting, consistent sectioning, and keyword alignment so ATS can parse and rank your resume more reliably."
    },
    {
      question: "Can I use my own AI API keys?",
      answer:
        "Absolutely. You can plug in your own OpenAI, Anthropic, or other supported provider keys and keep full control of costs. Pro users can also use Cyme.AI’s built-in models without bringing keys."
    },
    {
      question: "Is my data secure and private?",
      answer:
        "We take privacy seriously. Data is transmitted securely and we don’t sell your personal information. You’re in control of your content and API keys."
    },
    {
      question: "Is Cyme.AI good for students and career changers?",
      answer:
        "Yes. Cyme.AI helps surface transferable skills and reshape experience for new roles or industries, making it ideal for students, career changers, and seasoned professionals alike."
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <section
      ref={sectionRef}
      className="py-16 md:py-20 px-4 relative overflow-hidden scroll-mt-20"
      id="faq"
      aria-labelledby="faq-heading"
    >
      {/* Background accents */}
      <div
        aria-hidden="true"
        className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-gradient-to-br from-purple-200/15 to-indigo-200/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-gradient-to-tr from-teal-200/15 to-cyan-200/15 blur-3xl"
      />

      {/* Heading */}
      <div className="relative z-10 max-w-2xl mx-auto text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-3"
        >
          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-600/10 to-indigo-600/10 border border-purple-200/40 text-sm text-purple-700 flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            FAQ
          </span>
        </motion.div>

        <motion.h2
          id="faq-heading"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
        >
          <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Questions & Answers
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-base md:text-lg text-muted-foreground"
        >
          Quick answers to help you get started with Cyme.AI
        </motion.p>
      </div>

      {/* FAQ */}
      <motion.div
        className="relative z-10 max-w-3xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <Accordion type="single" collapsible className="space-y-2">
          {faqItems.map((item, index) => (
            <motion.div key={index} variants={itemVariants} className="group">
              <AccordionItem
                value={`item-${index}`}
                className="border border-gray-200/50 rounded-lg bg-white/40 backdrop-blur-sm hover:bg-white/60 transition-all duration-200 hover:shadow-sm hover:border-purple-200/50 px-4 py-1"
              >
                <AccordionTrigger className="text-left hover:no-underline group-hover:text-purple-700 transition-colors duration-200 py-4 text-sm md:text-base font-medium">
                  <span className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity duration-200" />
                    {item.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-4 pl-6 text-sm">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </motion.div>
    </section>
  );
}
