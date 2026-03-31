'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Filter, Image as ImageIcon, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/client';
import type { VisualizerSubmission } from '@repo/types';

function getDaysRemaining(expiresAt: string): number {
  const now = new Date();
  const expires = new Date(expiresAt);
  return Math.max(0, Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function ExpirationBadge({ expiresAt }: { expiresAt: string }) {
  const days = getDaysRemaining(expiresAt);

  if (days <= 3) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans font-medium bg-red-500/20 text-red-400 border border-red-500/30">
        <Clock className="w-3 h-3" /> {days}d left
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
        <Clock className="w-3 h-3" /> {days}d left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans font-medium bg-white/5 text-white/50 border border-white/10">
      <Clock className="w-3 h-3" /> {days}d left
    </span>
  );
}

function MarketingBadge({ approved }: { approved: boolean }) {
  if (approved) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans font-medium bg-green-500/20 text-green-400 border border-green-500/30">
        <CheckCircle className="w-3 h-3" /> Marketing OK
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans font-medium bg-white/5 text-white/30 border border-white/10">
      <XCircle className="w-3 h-3" /> No consent
    </span>
  );
}

function SubmissionCard({ submission }: { submission: VisualizerSubmission }) {
  const meta = submission.metadata as Record<string, string | null | undefined>;
  const configItems = [
    meta.mode && `Mode: ${meta.mode}`,
    meta.enclosureType && `Enclosure: ${meta.enclosureType}`,
    meta.framingStyle && `Framing: ${meta.framingStyle}`,
    meta.hardwareFinish && `Finish: ${meta.hardwareFinish}`,
    meta.handleStyle && `Handle: ${meta.handleStyle}`,
    meta.showerShape && `Shape: ${meta.showerShape}`,
  ].filter(Boolean);

  return (
    <div className="bg-brand-black/60 border border-brand-gold/10 overflow-hidden">
      <div className="grid grid-cols-2 gap-px bg-white/5">
        <div className="bg-brand-black/80 flex items-center justify-center aspect-[4/3] overflow-hidden">
          {submission.originalPhotoPath ? (
            <img
              src={submission.originalPhotoPath}
              alt="Original upload"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-white/20">
              <ImageIcon className="w-8 h-8" />
              <span className="text-[10px]">No photo</span>
            </div>
          )}
        </div>
        <div className="bg-brand-black/80 flex items-center justify-center aspect-[4/3] overflow-hidden">
          {submission.generatedImagePath ? (
            <img
              src={submission.generatedImagePath}
              alt="AI generated"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-white/20">
              <ImageIcon className="w-8 h-8" />
              <span className="text-[10px]">Not generated</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-white/50 font-sans">
            {new Date(submission.createdAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </span>
          <ExpirationBadge expiresAt={submission.expiresAt} />
        </div>

        <div className="flex items-center gap-2">
          <MarketingBadge approved={submission.marketingConsent} />
        </div>

        {configItems.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {configItems.map((item) => (
              <span
                key={item}
                className="px-1.5 py-0.5 text-[10px] text-white/40 bg-white/5 border border-white/5 font-sans"
              >
                {item}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<VisualizerSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marketingOnly, setMarketingOnly] = useState(true);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthed(!!user?.email);
    });
  }, []);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/submissions?marketingOnly=${marketingOnly}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load submissions');
      }
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, [marketingOnly]);

  useEffect(() => {
    if (authed) {
      fetchSubmissions();
    }
  }, [authed, fetchSubmissions]);

  if (authed === false) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-display text-brand-gold mb-2">Authentication Required</h2>
        <p className="text-white/60 text-sm font-sans mb-6">
          You must be signed in as a Gatsby Glass team member to view submissions.
        </p>
        <Link
          href="/login"
          className="inline-block bg-brand-gold text-brand-black font-sans font-semibold px-6 py-3 text-sm tracking-wider uppercase hover:bg-brand-secondary transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-white/40 hover:text-white/70 text-xs font-sans transition-colors mb-2"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Visualizer
          </Link>
          <h2 className="text-2xl font-display font-bold text-brand-gold tracking-wider">
            SUBMISSIONS
          </h2>
          <p className="text-white/50 text-sm font-sans mt-1">
            Before/after images from user uploads with consent
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setMarketingOnly(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans transition-colors border ${
            marketingOnly
              ? 'bg-brand-gold/20 text-brand-gold border-brand-gold/40'
              : 'bg-transparent text-white/40 border-white/10 hover:text-white/70'
          }`}
        >
          <Filter className="w-3 h-3" />
          Marketing Approved
        </button>
        <button
          onClick={() => setMarketingOnly(false)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans transition-colors border ${
            !marketingOnly
              ? 'bg-brand-gold/20 text-brand-gold border-brand-gold/40'
              : 'bg-transparent text-white/40 border-white/10 hover:text-white/70'
          }`}
        >
          All Submissions
        </button>
        <span className="text-[11px] text-white/30 font-sans ml-auto">
          {submissions.length} result{submissions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading && authed !== null && (
        <div className="text-center py-16">
          <div className="inline-block w-6 h-6 border-2 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin" />
          <p className="text-white/40 text-sm font-sans mt-3">Loading submissions...</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-500/10 border border-red-500/30 mb-6">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400 font-sans">{error}</p>
        </div>
      )}

      {!loading && !error && submissions.length === 0 && (
        <div className="text-center py-16 bg-brand-black/30 border border-white/5">
          <ImageIcon className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/40 text-sm font-sans">
            {marketingOnly
              ? 'No marketing-approved submissions yet.'
              : 'No submissions found.'}
          </p>
        </div>
      )}

      {!loading && submissions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {submissions.map((submission) => (
            <SubmissionCard key={submission.id} submission={submission} />
          ))}
        </div>
      )}
    </div>
  );
}
