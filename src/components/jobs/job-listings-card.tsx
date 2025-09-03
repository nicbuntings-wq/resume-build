'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Briefcase, MapPin, Link as LinkIcon } from 'lucide-react';
import type { Resume as CanonicalResume, Job as CanonicalJob } from '@/lib/types';
import { deleteTailoredJob } from '@/utils/actions/jobs/actions';
import { Badge } from '@/components/ui/badge';

// Allow legacy shape during rollout: include optional company_name
type Job = CanonicalJob & { company_name?: string };
type Resume = CanonicalResume;

interface TailoredJobCardProps {
  resume: Resume;
  job: Job | null; // can be null while loading
  onDeleted?: () => void; // optional callback after delete
}

export default function TailoredJobCard({ resume, job, onDeleted }: TailoredJobCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const title = job?.position_title || 'Target Job';
  const company = job?.company ?? job?.company_name ?? 'Unknown Company';
  const location = job?.location ?? 'Location not specified';
  const url = job?.job_url ?? undefined;
  const wl = job?.work_location ? job.work_location.replace('_', ' ') : 'Not specified';
  const keywords = job?.keywords ?? [];

  async function handleDelete() {
    if (!resume?.job_id) return;
    try {
      setIsDeleting(true);
      await deleteTailoredJob(resume.job_id);
      onDeleted?.();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <div className="text-gray-700">{company}</div>

          <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
            <div className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{location}</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="capitalize">{wl}</span>
            </div>
            {url && (
              <a
                href={url.startsWith('http') ? url : `https://${url}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:underline"
              >
                <LinkIcon className="h-4 w-4" />
                View posting
              </a>
            )}
          </div>
        </div>

        {resume?.job_id && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label="Delete tailored job"
            title="Delete tailored job"
            className="text-gray-500 hover:text-red-600"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
      </div>

      {job?.description && (
        <p className="text-sm text-gray-700 leading-relaxed">
          {job.description}
        </p>
      )}

      {!!keywords.length && (
        <div className="flex flex-wrap gap-2 pt-2">
          {keywords.slice(0, 6).map((kw, i) => (
            <Badge key={`${kw}-${i}`} variant="secondary">
              {kw}
            </Badge>
          ))}
          {keywords.length > 6 && (
            <Badge variant="secondary">+{keywords.length - 6} more</Badge>
          )}
        </div>
      )}
    </Card>
  );
}
