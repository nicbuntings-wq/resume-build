'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from 'next/cache';
import { simplifiedJobSchema } from "@/lib/zod-schemas";
import type { Job } from "@/lib/types";
import { z } from "zod";
import { JobListingParams } from "./schema";

export async function createJob(jobListing: z.infer<typeof simplifiedJobSchema>) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  // Prefer `company`, but gracefully fall back to `company_name`
  const company =
    // @ts-expect-error tolerate older schema for now
    (jobListing as any).company ??
    // @ts-expect-error tolerate older schema for now
    (jobListing as any).company_name;

  const jobData = {
    user_id: user.id,
    company, // ✅ matches Supabase column
    position_title: jobListing.position_title,
    job_url: jobListing.job_url,
    description: jobListing.description,
    location: jobListing.location,
    salary_range: jobListing.salary_range,
    keywords: jobListing.keywords,
    work_location: jobListing.work_location || 'in_person',
    employment_type: jobListing.employment_type || 'full_time',
    is_active: true,
  };

  const { data, error } = await supabase
    .from('jobs')
    .insert([jobData])
    .select()
    .single();

  if (error) {
    console.error('[createJob] Error creating job:', error);
    throw error;
  }

  return data;
}

export async function deleteJob(jobId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('User not authenticated');
  }

  // Find resumes referencing this job
  const { data: affectedResumes } = await supabase
    .from('resumes')
    .select('id')
    .eq('job_id', jobId);

  // Delete the job
  const { error: deleteError } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId);

  if (deleteError) {
    console.error('Delete error:', deleteError);
    throw new Error('Failed to delete job');
  }

  // Revalidate affected pages
  affectedResumes?.forEach((resume) => {
    revalidatePath(`/resumes/${resume.id}`);
  });

  revalidatePath('/', 'layout');
  revalidatePath('/resumes', 'layout');
}

export async function getJobListings({
  page = 1,
  pageSize = 10,
  filters,
}: JobListingParams) {
  const supabase = await createClient();

  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('jobs')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (filters) {
    if (filters.workLocation) {
      query = query.eq('work_location', filters.workLocation);
    }
    if (filters.employmentType) {
      query = query.eq('employment_type', filters.employmentType);
    }
    if (filters.keywords && filters.keywords.length > 0) {
      query = query.contains('keywords', filters.keywords);
    }
  }

  const { data: jobs, error, count } = await query.range(
    offset,
    offset + pageSize - 1
  );

  if (error) {
    console.error('Error fetching jobs:', error);
    throw new Error('Failed to fetch job listings');
  }

  return {
    jobs,
    totalCount: count ?? 0,
    currentPage: page,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function deleteTailoredJob(jobId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('jobs')
    .update({ is_active: false })
    .eq('id', jobId);

  if (error) {
    throw new Error('Failed to delete job');
  }

  revalidatePath('/', 'layout');
}

export async function createEmptyJob(): Promise<Job> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  const emptyJob: Partial<Job> = {
    user_id: user.id,
    company: 'New Company', // ✅ use `company`
    position_title: 'New Position',
    job_url: null,
    description: null,
    location: null,
    salary_range: null,
    keywords: [],
    work_location: null,
    employment_type: null,
    is_active: true,
  };

  const { data, error } = await supabase
    .from('jobs')
    .insert([emptyJob])
    .select()
    .single();

  if (error) {
    console.error('Error creating job:', error);
    throw new Error('Failed to create job');
  }

  revalidatePath('/', 'layout');
  return data as Job;
}
