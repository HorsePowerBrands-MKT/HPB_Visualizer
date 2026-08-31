'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Users,
  Clock,
  ImageIcon,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/client';

interface CandidateVisualization {
  id: string;
  visualizationImageUrl: string | null;
  createdAt: string;
  sessionId: string;
}

interface CandidateRow {
  id: string;
  email: string;
  locationName: string | null;
  isActive: boolean;
  renderingCap: number;
  createdAt: string;
  monthlyRenderCount: number;
  totalRenderCount: number;
  lastRenderAt: string | null;
  totalSessionSeconds: number;
  avgSessionSeconds: number;
  sessionCount: number;
  visualizations: CandidateVisualization[];
}

interface CandidatesData {
  year: number;
  month: number;
  candidates: CandidateRow[];
  canManage: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function CandidateRowCard({
  row,
  canManage,
  onUpdate,
}: {
  row: CandidateRow;
  canManage: boolean;
  onUpdate: (id: string, updates: { isActive?: boolean; renderingCap?: number }) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [capValue, setCapValue] = useState(row.renderingCap);

  const handleToggleActive = async () => {
    setSaving(true);
    try {
      await onUpdate(row.id, { isActive: !row.isActive });
    } finally {
      setSaving(false);
    }
  };

  const handleCapSave = async () => {
    if (capValue === row.renderingCap) return;
    setSaving(true);
    try {
      await onUpdate(row.id, { renderingCap: capValue });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`border border-white/10 bg-brand-black/30 ${!row.isActive ? 'opacity-60' : ''}`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-sans text-white/90 truncate">{row.email}</span>
            {row.locationName && (
              <span className="text-xs text-white/40 font-sans">({row.locationName})</span>
            )}
            <span
              className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 font-sans ${
                row.isActive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/10 text-white/40'
              }`}
            >
              {row.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-[11px] text-white/40 font-sans">
            <span>{row.monthlyRenderCount} renders this month</span>
            <span>{row.totalRenderCount} total</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ~{formatDuration(row.avgSessionSeconds)} avg session
            </span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-white/30 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/30 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-white/10 px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-sans">
            <div>
              <p className="text-white/35 uppercase tracking-wider text-[10px] mb-1">Created</p>
              <p className="text-white/70">{formatDateTime(row.createdAt)}</p>
            </div>
            <div>
              <p className="text-white/35 uppercase tracking-wider text-[10px] mb-1">Last Render</p>
              <p className="text-white/70">
                {row.lastRenderAt ? formatDateTime(row.lastRenderAt) : '—'}
              </p>
            </div>
            <div>
              <p className="text-white/35 uppercase tracking-wider text-[10px] mb-1">Sessions</p>
              <p className="text-white/70">{row.sessionCount}</p>
            </div>
            <div>
              <p className="text-white/35 uppercase tracking-wider text-[10px] mb-1">Total Time (approx.)</p>
              <p className="text-white/70">{formatDuration(row.totalSessionSeconds)}</p>
            </div>
          </div>

          {canManage && (
            <div className="flex flex-wrap items-end gap-4 p-3 bg-brand-black/40 border border-white/5">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">
                  Monthly Cap
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={capValue}
                    onChange={(e) => setCapValue(parseInt(e.target.value, 10) || 10)}
                    className="w-20 bg-brand-black/80 border border-white/10 px-2 py-1.5 text-xs text-white/90"
                  />
                  <button
                    type="button"
                    disabled={saving || capValue === row.renderingCap}
                    onClick={handleCapSave}
                    className="px-3 py-1.5 text-[10px] uppercase tracking-wider bg-brand-gold/15 text-brand-gold hover:bg-brand-gold/25 disabled:opacity-40 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={handleToggleActive}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors ${
                  row.isActive
                    ? 'bg-red-500/10 text-red-300 hover:bg-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                }`}
              >
                {row.isActive ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          )}

          {row.visualizations.length > 0 ? (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-sans mb-2">
                Render Files ({row.visualizations.length} this month)
              </p>
              <div className="flex flex-wrap gap-2">
                {row.visualizations.map((viz) => (
                  <a
                    key={viz.id}
                    href={viz.visualizationImageUrl ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative w-24 h-24 border border-white/10 hover:border-brand-gold/40 overflow-hidden transition-colors"
                  >
                    {viz.visualizationImageUrl ? (
                      <img
                        src={viz.visualizationImageUrl}
                        alt="Design preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-brand-black/60">
                        <ImageIcon className="w-6 h-6 text-white/20" />
                      </div>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-4 h-4 text-white" />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-white/30 font-sans">No renders this month.</p>
          )}

          <p className="text-[10px] text-white/25 font-sans">
            Session time is approximate, based on time between first and last render in each session.
          </p>
        </div>
      )}
    </div>
  );
}

export default function CandidatesPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<CandidatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthed(!!user?.email);
    });
  }, []);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/candidates?year=${year}&month=${month}`);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to load candidates');
      }
      const body: CandidatesData = await res.json();
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    if (authed) fetchCandidates();
  }, [authed, fetchCandidates]);

  const handleUpdate = useCallback(
    async (id: string, updates: { isActive?: boolean; renderingCap?: number }) => {
      const res = await fetch('/api/admin/candidates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to update candidate');
      }
      await fetchCandidates();
    },
    [fetchCandidates]
  );

  const goToPrevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  if (authed === false) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-display text-brand-gold mb-2">Authentication Required</h2>
        <p className="text-white/60 text-sm font-sans mb-6">
          You must be signed in as a corporate team member to view candidate analytics.
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

  const totalMonthlyRenders = data?.candidates.reduce((sum, c) => sum + c.monthlyRenderCount, 0) ?? 0;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-white/40 hover:text-white/70 text-xs font-sans transition-colors mb-2"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Visualizer
        </Link>
        <h2 className="text-2xl font-display font-bold text-brand-gold tracking-wider">
          CANDIDATE ANALYTICS
        </h2>
        <p className="text-white/50 text-sm font-sans mt-1">
          Track candidate engagement, renderings, and session activity
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevMonth}
            className="p-2 text-white/40 hover:text-white/70 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-sans text-white/80 min-w-[140px] text-center">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button
            onClick={goToNextMonth}
            className="p-2 text-white/40 hover:text-white/70 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        {data && (
          <div className="flex items-center gap-4 text-xs font-sans text-white/50">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {data.candidates.length} candidates
            </span>
            <span>{totalMonthlyRenders} renders this month</span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-500/10 border border-red-500/30 mb-6">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400 font-sans">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-white/40 text-sm font-sans">Loading candidates&hellip;</div>
      ) : data && data.candidates.length === 0 ? (
        <div className="text-center py-16 bg-brand-black/30 border border-white/5">
          <Users className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/40 text-sm font-sans">No candidates provisioned yet.</p>
          <Link
            href="/admin/users"
            className="inline-block mt-4 text-xs text-brand-gold hover:text-brand-secondary font-sans transition-colors"
          >
            Add a candidate in User Management &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {data?.candidates.map((row) => (
            <CandidateRowCard
              key={row.id}
              row={row}
              canManage={data.canManage}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
