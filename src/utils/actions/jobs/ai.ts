'use server';

import { generateObject, LanguageModelV1 } from 'ai';
import { z } from 'zod';
import { 
  simplifiedJobSchema, 
  simplifiedResumeSchema, 
} from "@/lib/zod-schemas";
import { Job, Resume } from "@/lib/types";
import { AIConfig } from '@/utils/ai-tools';
import { initializeAIClient } from '@/utils/ai-tools';
import { getSubscriptionPlan } from '../stripe/actions';
import { checkRateLimit } from '@/lib/rateLimiter';

export async function tailorResumeToJob(
  resume: Resume, 
  jobListing: z.infer<typeof simplifiedJobSchema>,
  config?: AIConfig
) {
  const { plan, id } = await getSubscriptionPlan(true);
  const isPro = plan === 'pro';

  // Gate by plan: Pro → gpt-4o, Free → gpt-4o-mini
  const hardcodedConfig: AIConfig = {
    model: isPro ? 'gpt-4o' : 'gpt-4o-mini',
    apiKeys: config?.apiKeys || []
  };

  const aiClient = isPro
    ? initializeAIClient(hardcodedConfig, isPro, true)
    : initializeAIClient(hardcodedConfig);

  // Check rate limit
  await checkRateLimit(id);

  try {
    const { object } = await generateObject({
      model: aiClient as LanguageModelV1, 
      temperature: 0.7,
      schema: z.object({
        content: simplifiedResumeSchema,
      }),
      system: `
You are Cyme.AI, an advanced AI resume transformer that specializes in optimizing resumes for target roles using ATS-aware strategies. Your mission is to transform the provided resume into a highly targeted, ATS-friendly document that precisely aligns with the job description.

**Core Objectives:**
1) Integrate job-specific terminology & reorder content to foreground the most relevant experiences.
2) Use the STAR framework for bullets where possible (Situation, Task, Action, Result) without inventing facts.
3) Enhance clarity, quantify impact when supported by the resume, and keep claims truthful.

**Strict Constraints:**
- Preserve factual accuracy; do not fabricate tools, versions, or experiences.
- Maintain original employment chronology.
- If a perfect match is missing, map to the closest relevant concept.
- Remove any internal annotations from the final output.
      `,
      prompt: `
This is the Resume:
${JSON.stringify(resume, null, 2)}

This is the Job Description:
${JSON.stringify(jobListing, null, 2)}
      `,
    });

    return object.content satisfies z.infer<typeof simplifiedResumeSchema>;
  } catch (error) {
    console.error('Error tailoring resume:', error);
    throw error;
  }
}

export async function formatJobListing(jobListing: string, config?: AIConfig) {
  const { plan, id } = await getSubscriptionPlan(true);
  const isPro = plan === 'pro';

  // Gate by plan: Pro → gpt-4o, Free → gpt-4o-mini
  const hardcodedConfig: AIConfig = {
    model: isPro ? 'gpt-4o' : 'gpt-4o-mini',
    apiKeys: config?.apiKeys || []
  };

  const aiClient = isPro
    ? initializeAIClient(hardcodedConfig, isPro, true)
    : initializeAIClient(hardcodedConfig);

  // Check rate limit
  await checkRateLimit(id);

  try {
    const { object } = await generateObject({
      model: aiClient as LanguageModelV1,
      temperature: 0.7,
      schema: z.object({
        content: simplifiedJobSchema
      }),
      system: `You are an AI assistant specializing in structured data extraction from job listings. Strictly adhere to the schema. If a field is missing/uncertain, return "" (empty string).

For the "description" field:
1) Start with 3–5 bullet points of the most important responsibilities (each starting with "• " on a new line).
2) Then include a clean paragraph version of the full job description with non-job fluff removed.
      `,
      prompt: `Analyze this job listing and return data matching the schema exactly.

TASKS:
1) ESSENTIAL INFO: company, position, URL, location, salary. Description must include 3–5 key bullets first.
2) KEYWORDS: 
   - Technical Skills
   - Soft Skills
   - Industry Knowledge
   - Required Qualifications
   - Responsibilities

Rules:
- Deduplicate skills/keywords.
- Keep exact keyword casing (e.g., "React.js" stays "React.js").
- Infer seniority from context if present, else "".
- For any unknown field, return "".

FORMAT THE FOLLOWING JOB LISTING AS A JSON OBJECT:
${jobListing}`,
    });

    return object.content satisfies Partial<Job>;
  } catch (error) {
    console.error('Error formatting job listing:', error);
    throw error;
  }
}
