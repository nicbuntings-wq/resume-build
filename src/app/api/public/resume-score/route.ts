import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resumeScoreSchema } from "@/lib/zod-schemas";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";

export const runtime = "edge";

// bump this string whenever you want to verify which code is live
const VERSION = "embed-2025-10-27-02";

const Body = z.object({
  resume: z.any(),
  job: z.any().nullish(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { resume, job } = Body.parse(json);

    // ✅ Force a concrete model; uses OPENAI_API_KEY from env automatically
    const model = openai("gpt-4o-mini");

    let prompt = `
You are scoring a resume. Return JSON that matches resumeScoreSchema exactly.
Resume JSON: ${JSON.stringify(resume)}
REQUIREMENT: include a 'miscellaneous' object with 2–3 metrics:
{
  "metricName": { "score": number, "reason": "string" }
}
`.trim();

    if (job) {
      prompt += `
This is a tailored resume. Job JSON: ${JSON.stringify(job)}
Include 'jobAlignment' covering:
- KEYWORD MATCH (percent, examples, gaps)
- SKILLS MATCH (hard/soft mapping)
- EXPERIENCE RELEVANCE (top 3 alignments, 1–2 missing)
- COMPANY FIT (signals + improvements)
Set isTailoredResume=true and add jobSpecificImprovements (3–5).
`.trimStart();
    } else {
      prompt += `

This is a base resume. Set isTailoredResume=false and omit jobAlignment.
`;
    }

    const { object } = await generateObject({
      model,
      schema: resumeScoreSchema,
      prompt,
    });

    return NextResponse.json(object, {
      headers: {
        "Cache-Control": "no-store",
        "x-scorer-version": VERSION,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Bad Request";
    return NextResponse.json(
      {
        error: `Scoring failed: ${message}`,
        code: "SCORER_ERROR",
      },
      {
        status: 400,
        headers: { "x-scorer-version": VERSION },
      }
    );
  }
}
