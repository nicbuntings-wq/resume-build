// src/app/api/public/resume-score/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Reuse your existing schema & AI client helper:
import { resumeScoreSchema } from "@/lib/zod-schemas";
import { initializeAIClient, type AIConfig } from "@/utils/ai-tools";

const Body = z.object({
  resume: z.any(),                 // e.g., { raw_text: string, is_base_resume: boolean }
  job: z.any().nullish(),          // e.g., { description: string } | null
});

export const runtime = "edge";     // fast cold starts (optional)

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { resume, job } = Body.parse(json);

    // Initialize your AI client (uses your server-side key via your helper).
    const aiClient = initializeAIClient({
      model: process.env.CYME_PUBLIC_SCORER_MODEL || undefined,
    } as AIConfig);

    // Build the prompt (mirror your internal approach).
    let prompt = `
      You are scoring a resume. Return JSON that matches resumeScoreSchema exactly.
      Resume JSON: ${JSON.stringify(resume)}
      REQUIREMENT: include a 'miscellaneous' object with 2–3 metrics:
      {
        "metricName": { "score": number, "reason": "string" }
      }
    `;
    if (job) {
      prompt += `
      This is a tailored resume. Job JSON: ${JSON.stringify(job)}
      Include 'jobAlignment' covering:
      - KEYWORD MATCH (percent, examples, gaps)
      - SKILLS MATCH (hard/soft mapping)
      - EXPERIENCE RELEVANCE (top 3 alignments, 1–2 missing)
      - COMPANY FIT (signals + improvements)
      Set isTailoredResume=true and add jobSpecificImprovements (3–5).
      `;
    } else {
      prompt += `\nThis is a base resume. Set isTailoredResume=false and omit jobAlignment.\n`;
    }

    // Structured output (same shape your app expects):
    const { object } = await (await import("ai")).generateObject({
      model: aiClient,
      schema: resumeScoreSchema,
      prompt,
    });

    return NextResponse.json(object, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Bad Request" }, { status: 400 });
  }
}
