import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resumeScoreSchema } from "@/lib/zod-schemas";
import { initializeAIClient, type AIConfig } from "@/utils/ai-tools";

const Body = z.object({
  resume: z.any(),
  job: z.any().nullish(),
});

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { resume, job } = Body.parse(json);

    // ✅ Use env if present, otherwise hard-default to gpt-4o-mini
    const modelId =
      process.env.CYME_PUBLIC_SCORER_MODEL ?? "gpt-4o-mini";

    // OPENAI_API_KEY must be set in Vercel; initializeAIClient will use it
    const aiClient = initializeAIClient({ model: modelId } as AIConfig);

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

    const { object } = await (await import("ai")).generateObject({
      model: aiClient,
      schema: resumeScoreSchema,
      prompt,
    });

    return NextResponse.json(object, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Bad Request";
    return NextResponse.json(
      { error: message, hint: "Ensure OPENAI_API_KEY is set; model defaults to gpt-4o-mini" },
      { status: 400 }
    );
  }
}
