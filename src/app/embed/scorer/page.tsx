'use client';

import * as React from 'react';

// ------- minimal types to keep the linter happy -------
type ScoreReason = {
  score?: number;
  reason?: string;
  // allow extra keys from model output without using `any`
  [k: string]: unknown;
};

type ImprovementItem = string | { text?: string };

type ResumeScore = {
  overallScore?: { score?: number; reason?: string };
  completeness?: ScoreReason;
  impactScore?: ScoreReason;
  isTailoredResume?: boolean;
  jobAlignment?: unknown; // we only `JSON.stringify` it
  overallImprovements?: ImprovementItem[];
  miscellaneous?: Record<string, ScoreReason>;
};
// ------------------------------------------------------

export default function ScorerEmbedPage() {
  const [resume, setResume] = React.useState('');
  const [job, setJob] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<ResumeScore | null>(null);

  React.useEffect(() => {
    // resize message to parent iframe (optional)
    const ro = new ResizeObserver(() => {
      window.parent?.postMessage(
        { source: 'cyme-scorer', type: 'resize', height: document.body.scrollHeight },
        '*'
      );
    });
    ro.observe(document.body);
    return () => ro.disconnect();
  }, []);

  const onScore = async () => {
    setError(null);
    if (!resume.trim()) { setError('Please paste your resume.'); return; }
    setLoading(true);
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
      const json: ResumeScore | { error?: string } = await res.json();
      if (!res.ok) throw new Error((json as { error?: string })?.error || 'Failed to score');
      setData(json as ResumeScore);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error';
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const ringDash = (n: number) => {
    const clamped = Math.max(0, Math.min(100, Number(n || 0)));
    const r = 52;
    const C = 2 * Math.PI * r;
    return `${(clamped / 100) * C} ${C}`;
  };

  return (
    <div style={{
      margin: 0, padding: 20, background: '#fafafa', color: '#0f1115',
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial'
    }}>
      <div style={{
        maxWidth: 900, margin: '0 auto 16px', background: '#fff', border: '1px solid #e9edf2',
        borderRadius: 16, boxShadow: '0 4px 14px rgba(15,17,21,0.05)', padding: 16
      }}>
        <h3 style={{ margin: '0 0 6px' }}>Resume Scorer</h3>
        <div style={{ color: '#64748b', fontSize: 14 }}>Paste resume (and optional job) for an instant score.</div>

        <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          <textarea rows={8} placeholder="Paste resume text here…" value={resume}
            onChange={e => setResume(e.target.value)}
            style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12 }} />
          <textarea rows={5} placeholder="(Optional) paste job description here…" value={job}
            onChange={e => setJob(e.target.value)}
            style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
          <button onClick={onScore} disabled={loading}
            style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 12, background: '#0f1115', color: '#fff', fontWeight: 600 }}>
            {loading ? 'Scoring…' : 'Score Resume'}
          </button>
          {error && <span style={{ color: '#ef4444', fontWeight: 600 }}>{error}</span>}
        </div>
      </div>

      {/* Results */}
      {data ? (
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
          {/* Overall */}
          <div style={{ background: '#fff', border: '1px solid #e9edf2', borderRadius: 16, padding: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 120, height: 120 }}>
                <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#eef2f7" strokeWidth="12" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#0ea5e9" strokeWidth="12" strokeLinecap="round"
                          strokeDasharray={ringDash(data.overallScore?.score ?? 0)} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 24 }}>
                  {Math.max(0, Math.min(100, Number(data.overallScore?.score || 0)))}
                </div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: 13 }}>Overall Score</div>
                <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.4 }}>{data.overallScore?.reason || ''}</div>
              </div>
            </div>
          </div>

          {/* Quick Summary */}
          <div style={{ background: '#fff', border: '1px solid #e9edf2', borderRadius: 16, padding: 16 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 15 }}>Quick Summary</h4>
            <div><span style={{ color: '#64748b' }}>Completeness:</span> {data.completeness?.score ?? '—'} {data.completeness?.reason ? `— ${data.completeness?.reason}` : ''}</div>
            <div style={{ marginTop: 4 }}><span style={{ color: '#64748b' }}>Impact:</span> {data.impactScore?.score ?? '—'} {data.impactScore?.reason ? `— ${data.impactScore?.reason}` : ''}</div>
            <div style={{ marginTop: 4 }}><span style={{ color: '#64748b' }}>Tailored:</span> {data.isTailoredResume ? 'Yes' : 'No'}</div>
          </div>

          {/* Completeness */}
          <div style={{ background: '#fff', border: '1px solid #e9edf2', borderRadius: 16, padding: 16 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 15 }}>Completeness</h4>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0, color: '#64748b' }}>
              {JSON.stringify(data.completeness ?? null, null, 2)}
            </pre>
          </div>

          {/* Impact */}
          <div style={{ background: '#fff', border: '1px solid #e9edf2', borderRadius: 16, padding: 16 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 15 }}>Impact</h4>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0, color: '#64748b' }}>
              {JSON.stringify(data.impactScore ?? null, null, 2)}
            </pre>
          </div>

          {/* Job Alignment */}
          {Boolean(data.jobAlignment) && (
            <div style={{ gridColumn: '1 / -1', background: '#fff', border: '1px solid #e9edf2', borderRadius: 16, padding: 16 }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 15 }}>Job Alignment</h4>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0, color: '#64748b' }}>
                {JSON.stringify(data.jobAlignment, null, 2)}
              </pre>
            </div>
          )}

          {/* Improvements */}
          <div style={{ gridColumn: '1 / -1', background: '#fff', border: '1px solid #e9edf2', borderRadius: 16, padding: 16 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 15 }}>Overall Improvements</h4>
            <ul style={{ margin: '8px 0 0 18px' }}>
              {(data?.overallImprovements ?? []).map((it: ImprovementItem, i: number) => (
                <li key={i} style={{ margin: '4px 0' }}>
                  {typeof it === 'string' ? it : (it?.text ?? JSON.stringify(it))}
                </li>
              ))}
            </ul>
          </div>

          {/* Misc */}
          <div style={{ gridColumn: '1 / -1', background: '#fff', border: '1px solid #e9edf2', borderRadius: 16, padding: 16 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 15 }}>Miscellaneous Metrics</h4>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0, color: '#64748b' }}>
              {JSON.stringify(data.miscellaneous ?? null, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}
