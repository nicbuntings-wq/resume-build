'use client';

import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Target, Award, UploadCloud, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------- Types aligned to resumeScoreSchema ----------
type ScoreNode = { score: number; reason: string };

// ----- PDF Upload helpers -----
type DragEvt = React.DragEvent<HTMLDivElement>;

type JobAlignmentNode = {
  score: number;
  reason: string;
  matchedKeywords?: string[];
  missingKeywords?: string[];
  matchedRequirements?: string[];
  gapAnalysis?: string[];
  suggestions?: string[];
};

type ResumeScoreResponse = {
  overallScore: ScoreNode;

  completeness: {
    contactInformation: ScoreNode;
    detailLevel: ScoreNode;
  };

  impactScore: {
    activeVoiceUsage: ScoreNode;
    quantifiedAchievements: ScoreNode;
  };

  roleMatch: {
    skillsRelevance: ScoreNode;
    experienceAlignment: ScoreNode;
    educationFit: ScoreNode;
  };

  jobAlignment?: {
    keywordMatch: JobAlignmentNode;
    requirementsMatch: JobAlignmentNode;
    companyFit: JobAlignmentNode;
  };

  miscellaneous?: Record<
    string,
    number | { score?: number; reason?: string }
  >;

  overallImprovements: string[];
  jobSpecificImprovements?: string[];
  isTailoredResume?: boolean;
};
// -------------------------------------------------------

// Small helper for label niceness
function camelCaseToReadable(text: string): string {
  return text.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (s) => s.toUpperCase());
}

export default function ScorerEmbedPage() {
  const [resume, setResume] = useState('');
  const [job, setJob] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ResumeScoreResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Resize the iframe height automatically for nicer embeds
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      window.parent?.postMessage(
        { source: 'cyme-scorer', type: 'resize', height: document.body.scrollHeight },
        '*'
      );
    });
    ro.observe(document.body);
    return () => ro.disconnect();
  }, []);

      // Minimal local types so we don't use `any`
  type PDFTextItem = { str?: string };
  type PDFTextContent = { items: PDFTextItem[] };
  type PDFPageProxy = { getTextContent: () => Promise<PDFTextContent> };
  type PDFDocumentProxy = { numPages: number; getPage: (n: number) => Promise<PDFPageProxy> };
  type PDFJSLite = {
    GlobalWorkerOptions: { workerSrc: unknown };
    getDocument: (opts: { data: ArrayBuffer }) => { promise: Promise<PDFDocumentProxy> };
  };

  // Extract text from a PDF client-side using pdfjs-dist (dynamic import to avoid SSR issues)
  const extractTextFromPdf = async (file: File): Promise<string> => {
    setPdfLoading(true);
    try {
      // ESM build for Next 15; dynamic import keeps worker bundling sane
      const pdfjsLib = (await import('pdfjs-dist/build/pdf.mjs')) as unknown as PDFJSLite;
      // The worker module exports a value the library accepts as workerSrc. Typing is opaque,
      // so we intentionally expect a TS error here.
      // @ts-expect-error: pdfjs worker module provides a URL/object acceptable to workerSrc
      pdfjsLib.GlobalWorkerOptions.workerSrc = await import('pdfjs-dist/build/pdf.worker.mjs');

      const buf = await file.arrayBuffer();
      const pdf = (await pdfjsLib.getDocument({ data: buf }).promise) as PDFDocumentProxy;

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items
          .map((it) => (typeof it?.str === 'string' ? it.str : ''))
          .filter((s): s is string => Boolean(s));
        fullText += strings.join(' ') + '\n';
      }
      return fullText.trim();
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePdfFile = async (file: File) => {
    if (!file || file.type !== 'application/pdf') return;
    const text = await extractTextFromPdf(file);
    if (text) setResume(text);
  };
  
  const onScore = async () => {
    setError(null);
    if (!resume.trim()) {
      setError('Please paste your resume.');
      return;
    }
    setLoading(true);
    setData(null);
    try {
      const body = {
        resume: { raw_text: resume.trim(), is_base_resume: !job.trim() },
        job: job.trim() ? { description: job.trim() } : null,
      };
      const res = await fetch('/api/public/resume-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      });

      const json = (await res.json()) as ResumeScoreResponse & { error?: string };
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to score');
      }
      setData(json);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error';
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // ---- UI helpers for the progress ring (Overall) ----
  const ringColor = (n: number) =>
    n >= 70 ? '#10b981' : n >= 50 ? '#f59e0b' : '#ef4444';

  // ----- Renderers reused below -----
  const ScoreItem = ({ label, score, reason }: { label: string; score: number; reason: string }) => {
    const getScoreColor = (s: number) => (s >= 70 ? 'bg-green-500' : s >= 50 ? 'bg-yellow-500' : 'bg-red-500');
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{camelCaseToReadable(label)}</span>
          <span
            className={cn(
              'text-xs px-2 py-1 rounded-full font-medium',
              score >= 70 ? 'bg-green-100 text-green-700' : score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
            )}
          >
            {score}/100
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, score))}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={cn('h-full rounded-full', getScoreColor(score))}
          />
        </div>
        <p className="text-xs text-muted-foreground">{reason}</p>
      </motion.div>
    );
  };

  const JobAlignmentItem = ({
    label,
    data,
  }: {
    label: string;
    data: JobAlignmentNode;
  }) => {
    const getScoreColor = (s: number) => (s >= 70 ? 'bg-blue-500' : s >= 50 ? 'bg-yellow-500' : 'bg-red-500');
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-blue-700">{camelCaseToReadable(label)}</span>
          <span
            className={cn(
              'text-xs px-2 py-1 rounded-full font-medium',
              data.score >= 70 ? 'bg-blue-100 text-blue-700' : data.score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
            )}
          >
            {data.score}/100
          </span>
        </div>
        <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, data.score))}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={cn('h-full rounded-full', getScoreColor(data.score))}
          />
        </div>
        <p className="text-xs text-blue-600">{data.reason}</p>

        {Array.isArray(data.matchedKeywords) && data.matchedKeywords.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-green-600">Matched Keywords:</p>
            <div className="flex flex-wrap gap-1">
              {data.matchedKeywords.slice(0, 5).map((kw, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(data.missingKeywords) && data.missingKeywords.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-red-600">Missing Keywords:</p>
            <div className="flex flex-wrap gap-1">
              {data.missingKeywords.slice(0, 5).map((kw, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(data.gapAnalysis) && data.gapAnalysis.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-orange-600">Areas to Address:</p>
            <div className="space-y-1">
              {data.gapAnalysis.slice(0, 3).map((gap, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <div className="mt-1.5 h-1 w-1 rounded-full bg-orange-500 flex-shrink-0" />
                  <p className="text-orange-600">{gap}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div
      style={{
        margin: 0,
        padding: 20,
        background: '#fafafa',
        color: '#0f1115',
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial',
      }}
      className="space-y-4"
    >
      {/* Input block (keep anonymous flow) */}
      <Card>
        <CardContent className="p-4">
         <h3 className="text-lg font-semibold mb-1">Import Resume Content To Get Your Score</h3>
<p className="text-sm text-muted-foreground mb-4">
  Upload your PDF resume <span className="font-medium">or</span> paste the text below. Optionally add a job description for a tailored score.
</p>

         <div className="grid gap-3">
  {/* Hidden file input */}
  <input
    ref={fileInputRef}
    type="file"
    accept="application/pdf"
    className="hidden"
    onChange={async (e) => {
      const f = e.target.files?.[0];
      if (f) await handlePdfFile(f);
      e.currentTarget.value = '';
    }}
  />

  {/* Drop zone */}
  <div
    onClick={() => fileInputRef.current?.click()}
    onDragOver={(e: DragEvt) => {
      e.preventDefault();
      setDragActive(true);
    }}
    onDragLeave={() => setDragActive(false)}
    onDrop={async (e: DragEvt) => {
      e.preventDefault();
      setDragActive(false);
      const f = e.dataTransfer.files?.[0];
      if (f) await handlePdfFile(f);
    }}
    className={cn(
      'rounded-xl border-2 border-dashed cursor-pointer transition-colors',
      dragActive ? 'border-violet-500 bg-violet-50/70' : 'border-violet-300 bg-violet-50/40 hover:bg-violet-50'
    )}
  >
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      {pdfLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      ) : (
        <UploadCloud className="h-6 w-6 text-violet-600" />
      )}
      <div className="text-sm">
        <span className="font-medium text-violet-700">Drop your PDF resume here</span>{' '}
        <span className="text-muted-foreground">or click to browse files</span>
      </div>
      <div className="text-xs text-muted-foreground">.pdf only • We’ll extract the text automatically</div>
    </div>
  </div>

  {/* Paste-text fallback */}
  <div className="space-y-1">
    <label className="text-xs font-medium text-slate-500">Or paste your resume text here</label>
    <textarea
      rows={8}
      placeholder="Start pasting your resume content here…"
      value={resume}
      onChange={(e) => setResume(e.target.value)}
      className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
    />
  </div>

  {/* Optional Job Description */}
  <div className="space-y-1">
    <label className="text-xs font-medium text-slate-500">(Optional) paste job description</label>
    <textarea
      rows={5}
      placeholder="Paste the job description if you want a tailored alignment score…"
      value={job}
      onChange={(e) => setJob(e.target.value)}
      className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
    />
  </div>
</div>
          <div className="flex items-center gap-3 mt-3">
            <Button onClick={onScore} disabled={loading || (!resume.trim() && !job.trim())}>
              <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
              {loading ? 'Scoring…' : 'Score Resume'}
            </Button>
            {error && <span className="text-red-600 font-medium text-sm">Oops — {error}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {data && (
        <div className="grid gap-4">
          {/* Header + Overall */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20">
                  <CircularProgressbar
                    value={Math.max(0, Math.min(100, data.overallScore?.score ?? 0))}
                    text={`${Math.max(0, Math.min(100, data.overallScore?.score ?? 0))}%`}
                    styles={buildStyles({
                      pathColor: ringColor(data.overallScore?.score ?? 0),
                      textColor: '#374151',
                      trailColor: '#e5e7eb',
                      pathTransitionDuration: 1,
                      textSize: '24px',
                    })}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium mb-1">Overall Score</h4>
                  <p className="text-sm text-muted-foreground">{data.overallScore?.reason}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Improvements */}
          {Array.isArray(data.overallImprovements) && data.overallImprovements.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Key Improvements
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {data.overallImprovements.slice(0, 5).map((improvement, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-2 text-sm"
                    >
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      <p className="text-muted-foreground">{improvement}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job-specific Improvements (tailored only) */}
          {data.isTailoredResume &&
            Array.isArray(data.jobSpecificImprovements) &&
            data.jobSpecificImprovements.length > 0 && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-blue-700">
                    <Award className="h-4 w-4" />
                    Job-Specific Improvements
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {data.jobSpecificImprovements.slice(0, 5).map((improvement, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-2 text-sm"
                      >
                        <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                        <p className="text-blue-700">{improvement}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Job Alignment (tailored only) */}
          {data.isTailoredResume && data.jobAlignment && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-blue-700">
                  <Target className="h-4 w-4" />
                  Job Alignment Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {(Object.entries(data.jobAlignment ?? {}) as [string, JobAlignmentNode][])
  .map(([label, node]) => (
    <JobAlignmentItem key={label} label={label} data={node} />
  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Metrics */}
          {(() => {
            const sections: Array<{
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  metrics: Record<string, ScoreNode>;
}> = [
  { title: 'Completeness', icon: Award, metrics: data.completeness },
  { title: 'Impact Score', icon: TrendingUp, metrics: data.impactScore },
  { title: 'Role Match', icon: Target, metrics: data.roleMatch },
];

            return sections.map(({ title, icon: Icon, metrics }) => (
              <Card key={title}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {(Object.entries(metrics ?? {}) as [string, ScoreNode][])
  .map(([label, node]) => (
    <ScoreItem 
      key={label} 
      label={label} 
      score={node.score} 
      reason={node.reason} 
    />
  ))}
                  </div>
                </CardContent>
              </Card>
            ));
          })()}
        </div>
      )}
    </div>
  );
}
