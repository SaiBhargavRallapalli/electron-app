import { useState, useCallback, useEffect } from 'react';
import { useElectronAPI } from './useElectronAPI';

export function useDownloads() {
  const { getAllJobs } = useElectronAPI();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshJobs = useCallback(async () => {
    setLoading(true);
    try {
      const allJobs = await getAllJobs();
      setJobs(allJobs);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [getAllJobs]);

  const addJob = useCallback((job) => {
    setJobs(prev => [job, ...prev]);
  }, []);

  const updateJob = useCallback((jobId, updates) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, ...updates } : job
    ));
  }, []);

  const removeJob = useCallback((jobId) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
  }, []);

  const getJob = useCallback((jobId) => {
    return jobs.find(job => job.id === jobId);
  }, [jobs]);

  const getRunningJobs = useCallback(() => {
    return jobs.filter(job => job.status === 'running' || job.status === 'pending');
  }, [jobs]);

  const getCompletedJobs = useCallback(() => {
    return jobs.filter(job => job.status === 'completed');
  }, [jobs]);

  const getErrorJobs = useCallback(() => {
    return jobs.filter(job => job.status === 'error' || job.status === 'cancelled');
  }, [jobs]);

  // Auto-refresh on mount
  useEffect(() => {
    refreshJobs();
  }, [refreshJobs]);

  return {
    jobs,
    loading,
    refreshJobs,
    addJob,
    updateJob,
    removeJob,
    getJob,
    getRunningJobs,
    getCompletedJobs,
    getErrorJobs,
  };
}