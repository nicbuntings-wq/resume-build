'use client';

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Building2, MapPin, Clock, DollarSign, Trash2 } from "lucide-react";
import { getJobListings, deleteJob } from "@/utils/actions/jobs/actions";
import { createClient } from "@/utils/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import type { Job as CanonicalJob } from "@/lib/types";

// ---- Types -----------------------------------------------------------------

type WorkLocationType = 'remote' | 'in_person' | 'hybrid';
type EmploymentType = 'full_time' | 'part_time' | 'co_op' | 'internship';

// Use the canonical Job, but allow legacy `company_name`
type UIJob = CanonicalJob & { company_name?: string };

// ---- Component --------------------------------------------------------------

export function JobListingsCard() {
  const [jobs, setJobs] = useState<UIJob[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [workLocation, setWorkLocation] = useState<WorkLocationType | undefined>();
  const [employmentType, setEmploymentType] = useState<EmploymentType | undefined>();

  // Fetch admin status
  useEffect(() => {
    async function checkAdminStatus() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('user_id', user.id)
          .single();
        
        setIsAdmin(profile?.is_admin ?? false);
      }
    }
    checkAdminStatus();
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getJobListings({
        page: currentPage,
        pageSize: 6,
        filters: {
          workLocation,
          employmentType,
        },
      });

      setJobs(result.jobs as UIJob[]);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, workLocation, employmentType]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  const formatWorkLocation = (wl: UIJob['work_location']) => {
    if (!wl) return 'Not specified';
    return wl.replace('_', ' ');
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await deleteJob(jobId);
      fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  return (
    <div className="relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-teal-50/20 to-rose-50/30 rounded-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff20_1px,transparent_1px),linear-gradient(to_bottom,#ffffff20_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <Card className="relative p-8 bg-white/60 backdrop-blur-2xl border-white/40 shadow-2xl rounded-3xl overflow-hidden">
        <div className="relative flex flex-col space-y-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold bg-gradient-to-r from-teal-600 via-purple-600 to-rose-600 bg-clip-text text-transparent"
            >
              Job Listings
            </motion.h2>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Select
                value={workLocation}
                onValueChange={(value: WorkLocationType) => setWorkLocation(value)}
              >
                <SelectTrigger className="w-full sm:w-[180px] bg-white/80 border-white/40">
                  <MapPin className="w-4 h-4 mr-2 text-teal-500" />
                  <SelectValue placeholder="Work Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">🌍 Remote</SelectItem>
                  <SelectItem value="in_person">🏢 In Person</SelectItem>
                  <SelectItem value="hybrid">🔄 Hybrid</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={employmentType}
                onValueChange={(value: EmploymentType) => setEmploymentType(value)}
              >
                <SelectTrigger className="w-full sm:w-[180px] bg-white/80 border-white/40">
                  <Briefcase className="w-4 h-4 mr-2 text-purple-500" />
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">⭐ Full Time</SelectItem>
                  <SelectItem value="part_time">⌛ Part Time</SelectItem>
                  <SelectItem value="co_op">🤝 Co-op</SelectItem>
                  <SelectItem value="internship">🎓 Internship</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>
          </div>

          {/* Jobs Grid */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <Card key={i} className="p-6 space-y-4 animate-pulse bg-white/40 rounded-2xl" />
              ))
            ) : jobs.map((job) => (
              <Card key={job.id} className="p-6 rounded-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{job.position_title}</h3>
                    <span>{job.company ?? job.company_name ?? 'Unknown Company'}</span>
                  </div>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteJob(job.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </motion.div>

          {/* Pagination */}
          <div className="flex justify-center gap-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
