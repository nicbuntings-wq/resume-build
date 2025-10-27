import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resumeScoreSchema } from "@/lib/zod-schemas";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";

export const runtime = "edge";

const Body = z.object({
  resume: z.any(),
  job: z.any().nullish(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { resume, job } = Body.parse(json);

    // ✅ Hard-set the model; Vercel AI SDK will read OPENAI_API_KEY for you
    const model = openai("gpt-4o-mini");

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

    const { object } = await generateObject({
      model,
      schema: resumeScoreSchema,
      prompt,
    });

    return NextResponse.json(object, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Bad Request";
    return NextResponse.json(
      { error: message, hint: "Model is hard-set to gpt-4o-mini; ensure OPENAI_API_KEY is present." },
      { status: 400 }
    );
  }
}
