import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resumeScoreSchema } from "@/lib/zod-schemas";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";

export const runtime = "edge";
const VERSION = "embed-2025-10-27-schema-lock-FINAL";

const Body = z.object({
  // your embed page sends: { resume: { raw_text: string, is_base_resume?: boolean }, job?: { description: string } | null }
  resume: z.any(),
  job: z.any().nullish(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { resume, job } = Body.parse(json);

    // Uses OPENAI_API_KEY automatically
    const model = openai("gpt-4o-mini");

    // strict instructions aligned to your resumeScoreSchema
    const system = `
You are a resume scoring engine. Return ONLY JSON that validates against the schema described.

Rules:
- All "score" fields are numbers 0..100 (never strings).
- "overallImprovements" is an array of strings (3–7 items).
- "miscellaneous" values are either:
    • a number 0..100, OR
    • an object { "score"?: number 0..100, "reason"?: string }.
- If a job is provided: include "jobAlignment" AND "jobSpecificImprovements" and set "isTailoredResume": true.
- If no job: omit BOTH "jobAlignment" AND "jobSpecificImprovements" and set "isTailoredResume": false.
Output JSON only. No prose.
`.trim();

    // examples that VALIDATE against your resumeScoreSchema
    const exampleBase = {
      overallScore: { score: 78, reason: "Clear structure; some quantified impact but can improve." },
      completeness: {
        contactInformation: { score: 90, reason: "Name, email, location present; consider LinkedIn/GitHub." },
        detailLevel: { score: 72, reason: "Add outcomes/metrics for 1–2 roles." }
      },
      impactScore: {
        activeVoiceUsage: { score: 75, reason: "Mostly active voice." },
        quantifiedAchievements: { score: 60, reason: "Add more numbers for scope/results." }
      },
      roleMatch: {
        skillsRelevance: { score: 70, reason: "Core stack present; a few gaps." },
        experienceAlignment: { score: 74, reason: "Generally aligned; some tangential items." },
        educationFit: { score: 85, reason: "Meets expectations." }
      },
      miscellaneous: {
        readability: { score: 82, reason: "Consistent formatting." },
        keywordDensity: 68
      },
      overallImprovements: [
        "Add 2–3 quantified metrics to recent roles.",
        "Tighten bullets to action → result.",
        "Link to portfolio or GitHub."
      ],
      isTailoredResume: false
    };

    const exampleTailored = {
      overallScore: { score: 84, reason: "Well aligned to job; strong skills and outcomes." },
      completeness: {
        contactInformation: { score: 95, reason: "Email, location, LinkedIn present." },
        detailLevel: { score: 80, reason: "Good depth; minor scope clarification." }
      },
      impactScore: {
        activeVoiceUsage: { score: 85, reason: "Consistent active voice." },
        quantifiedAchievements: { score: 78, reason: "Several measurable outcomes." }
      },
      roleMatch: {
        skillsRelevance: { score: 88, reason: "Most key tools match JD." },
        experienceAlignment: { score: 82, reason: "Recent roles map to responsibilities." },
        educationFit: { score: 80, reason: "Meets baseline; certs help." }
      },
      jobAlignment: {
        keywordMatch: {
          score: 86, reason: "High overlap.", matchedKeywords: ["React","TypeScript","CI/CD"], missingKeywords: ["GraphQL"]
        },
        requirementsMatch: {
          score: 82, reason: "Meets most; expand on testing.",
          matchedRequirements: ["Frontend ownership","Performance tuning"],
          gapAnalysis: ["End-to-end testing tooling not highlighted"]
        },
        companyFit: {
          score: 79, reason: "Shows product interest.",
          suggestions: ["Add collaboration note with design/research."]
        }
      },
      miscellaneous: {
        layoutConsistency: { score: 88, reason: "Consistent spacing & headings." },
        keywordDensity: 74
      },
      overallImprovements: [
        "Mention GraphQL or adjacent experience.",
        "Add testing bullet with tooling and coverage.",
        "Quantify performance improvements."
      ],
      jobSpecificImprovements: [
        "Highlight collaboration with product/design.",
        "Surface metrics aligned to role KPIs."
      ],
      isTailoredResume: true
    };

    const prompt = `
RESUME_JSON:
${JSON.stringify(resume)}

${job ? `JOB_JSON:\n${JSON.stringify(job)}\n` : ""}

OUTPUT CONTRACT (must validate exactly):
- "overallScore": { "score": number 0-100, "reason": string }
- "completeness": {
    "contactInformation": { "score": number 0-100, "reason": string },
    "detailLevel": { "score": number 0-100, "reason": string }
  }
- "impactScore": {
    "activeVoiceUsage": { "score": number 0-100, "reason": string },
    "quantifiedAchievements": { "score": number 0-100, "reason": string }
  }
- "roleMatch": {
    "skillsRelevance": { "score": number 0-100, "reason": string },
    "experienceAlignment": { "score": number 0-100, "reason": string },
    "educationFit": { "score": number 0-100, "reason": string }
  }
- "jobAlignment": (INCLUDE ONLY IF JOB_JSON PROVIDED) {
    "keywordMatch": {
      "score": number 0-100,
      "reason": string,
      "matchedKeywords"?: string[],
      "missingKeywords"?: string[]
    },
    "requirementsMatch": {
      "score": number 0-100,
      "reason": string,
      "matchedRequirements"?: string[],
      "gapAnalysis"?: string[]
    },
    "companyFit": {
      "score": number 0-100,
      "reason": string,
      "suggestions"?: string[]
    }
  }
- "miscellaneous": { [metricName: string]: number(0-100) | { "score"?: number 0-100, "reason"?: string } }
- "overallImprovements": string[]
- "jobSpecificImprovements": string[] (INCLUDE ONLY IF JOB_JSON PROVIDED)
- "isTailoredResume": boolean (true if JOB_JSON provided, else false)

VALID EXAMPLES (emulate structure, not values):
Base (no job):
${JSON.stringify(exampleBase, null, 2)}

Tailored (with job):
${JSON.stringify(exampleTailored, null, 2)}

RETURN JSON ONLY.
`.trim();

    const { object } = await generateObject({
      model,
      schema: resumeScoreSchema,
      system,
      prompt,
      temperature: 0.2,
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
      { error: `Scoring failed: ${message}`, code: "SCORER_SCHEMA_FAIL" },
      { status: 400, headers: { "x-scorer-version": VERSION } }
    );
  }
}
