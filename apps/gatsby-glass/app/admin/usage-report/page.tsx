'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  BarChart3,
  Users,
  Eye,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/client';

interface UsageReportRow {
  locationId: string;
  locationName: string;
  dailyVisualizations: Record<string, number>;
  dailyLeads: Record<string, number>;
  totalVisualizations: number;
  totalLeads: number;
}

interface ApiCallReportRow {
  callType: string;
  dailyCounts: Record<string, number>;
  total: number;
}

interface ReportData {
  year: number;
  month: number;
  rows: UsageReportRow[];
  apiCalls?: ApiCallReportRow[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CALL_TYPE_LABELS: Record<string, string> = {
  image_validation: 'Image Validation',
  initial_generation: 'Initial Generation',
  update_generation: 'Update Generation',
  lead_submission: 'Lead Submission',
  issue_report: 'Issue Report',
  image_upload: 'Image Upload',
};

function getDaysInMonth(year: number, month: number): string[] {
  const count = new Date(year, month, 0).getDate();
  const days: string[] = [];
  for (let d = 1; d <= count; d++) {
    const mm = String(month).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    days.push(`${year}-${mm}-${dd}`);
  }
  return days;
}

function formatDay(dateKey: string): string {
  const [, , dd] = dateKey.split('-');
  return String(parseInt(dd, 10));
}

function formatDayLabel(dateKey: string): string {
  const monthIdx = parseInt(dateKey.split('-')[1], 10) - 1;
  return `${MONTH_NAMES[monthIdx]?.slice(0, 3)} ${formatDay(dateKey)}`;
}

function LocationRow({ row, days }: { row: UsageReportRow; days: string[] }) {
  const [expanded, setExpanded] = useState(false);

  const activeDays = days.filter(
    (d) => (row.dailyVisualizations[d] ?? 0) + (row.dailyLeads[d] ?? 0) > 0
  );

  return (
    <>
      <tr
        className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-3 px-4 text-sm font-sans text-white/90">
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-white/30 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-white/30 shrink-0" />
            )}
            {row.locationName}
          </div>
        </td>
        <td className="py-3 px-4 text-sm font-sans text-right tabular-nums text-white/70">
          {row.totalVisualizations}
        </td>
        <td className="py-3 px-4 text-sm font-sans text-right tabular-nums text-white/70">
          {row.totalLeads}
        </td>
        <td className="py-3 px-4 text-sm font-sans text-right tabular-nums text-brand-gold">
          {row.totalVisualizations + row.totalLeads}
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-white/5">
          <td colSpan={4} className="p-0">
            <div className="bg-white/[0.02] border-t border-white/5">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-white/30 font-sans">
                    <th className="py-2 px-4 text-left pl-12">Day</th>
                    <th className="py-2 px-4 text-right">Team Visualizations</th>
                    <th className="py-2 px-4 text-right">Leads</th>
                    <th className="py-2 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDays.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-3 px-4 pl-12 text-xs text-white/30 font-sans"
                      >
                        No activity this month
                      </td>
                    </tr>
                  ) : (
                    activeDays.map((day) => {
                      const viz = row.dailyVisualizations[day] ?? 0;
                      const leads = row.dailyLeads[day] ?? 0;
                      return (
                        <tr
                          key={day}
                          className="border-t border-white/[0.03] hover:bg-white/[0.02]"
                        >
                          <td className="py-1.5 px-4 pl-12 text-xs font-sans text-white/50">
                            {formatDayLabel(day)}
                          </td>
                          <td className="py-1.5 px-4 text-xs font-sans text-right tabular-nums text-white/50">
                            {viz || '\u2014'}
                          </td>
                          <td className="py-1.5 px-4 text-xs font-sans text-right tabular-nums text-white/50">
                            {leads || '\u2014'}
                          </td>
                          <td className="py-1.5 px-4 text-xs font-sans text-right tabular-nums text-white/60">
                            {viz + leads}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function ApiCallRow({ row, days }: { row: ApiCallReportRow; days: string[] }) {
  const [expanded, setExpanded] = useState(false);

  const activeDays = days.filter((d) => (row.dailyCounts[d] ?? 0) > 0);

  return (
    <>
      <tr
        className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-3 px-4 text-sm font-sans text-white/90">
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-white/30 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-white/30 shrink-0" />
            )}
            {CALL_TYPE_LABELS[row.callType] ?? row.callType}
          </div>
        </td>
        <td className="py-3 px-4 text-sm font-sans text-right tabular-nums text-brand-gold">
          {row.total}
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-white/5">
          <td colSpan={2} className="p-0">
            <div className="bg-white/[0.02] border-t border-white/5">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-white/30 font-sans">
                    <th className="py-2 px-4 text-left pl-12">Day</th>
                    <th className="py-2 px-4 text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDays.map((day) => (
                    <tr
                      key={day}
                      className="border-t border-white/[0.03] hover:bg-white/[0.02]"
                    >
                      <td className="py-1.5 px-4 pl-12 text-xs font-sans text-white/50">
                        {formatDayLabel(day)}
                      </td>
                      <td className="py-1.5 px-4 text-xs font-sans text-right tabular-nums text-white/50">
                        {row.dailyCounts[day] ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function UsageReportPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthed(!!user?.email);
    });
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/usage-report?month=${month}&year=${year}`
      );
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to load report');
      }
      const body: ReportData = await res.json();
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    if (authed) {
      fetchReport();
    }
  }, [authed, fetchReport]);

  const goPrev = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    const isCurrentMonth =
      month === now.getMonth() + 1 && year === now.getFullYear();
    if (isCurrentMonth) return;
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const isCurrentMonth =
    month === now.getMonth() + 1 && year === now.getFullYear();

  if (authed === false) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-display text-brand-gold mb-2">
          Authentication Required
        </h2>
        <p className="text-white/60 text-sm font-sans mb-6">
          You must be signed in as a Gatsby Glass team member to view usage
          reports.
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

  const days = data ? getDaysInMonth(data.year, data.month) : [];

  const totalViz =
    data?.rows.reduce((s, r) => s + r.totalVisualizations, 0) ?? 0;
  const totalLeads =
    data?.rows.reduce((s, r) => s + r.totalLeads, 0) ?? 0;
  const totalApiCalls =
    data?.apiCalls?.reduce((s, r) => s + r.total, 0) ?? 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-white/40 hover:text-white/70 text-xs font-sans transition-colors mb-2"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Visualizer
        </Link>
        <h2 className="text-2xl font-display font-bold text-brand-gold tracking-wider">
          USAGE REPORT
        </h2>
        <p className="text-white/50 text-sm font-sans mt-1">
          Monthly visualizations and leads per franchise location
        </p>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6 bg-brand-black/60 border border-brand-gold/10 px-4 py-3">
        <button
          onClick={goPrev}
          className="p-1.5 text-white/50 hover:text-white/90 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-lg font-display text-brand-gold tracking-wide">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button
          onClick={goNext}
          disabled={isCurrentMonth}
          className={`p-1.5 transition-colors ${
            isCurrentMonth
              ? 'text-white/10 cursor-not-allowed'
              : 'text-white/50 hover:text-white/90'
          }`}
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Summary cards */}
      {!loading && data && (
        <div className={`grid gap-4 mb-6 ${data.apiCalls ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <div className="bg-brand-black/60 border border-brand-gold/10 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4 text-brand-gold/60" />
              <span className="text-[10px] uppercase tracking-wider text-white/40 font-sans">
                Team Visualizations
              </span>
            </div>
            <span className="text-2xl font-display text-white tabular-nums">
              {totalViz}
            </span>
          </div>
          <div className="bg-brand-black/60 border border-brand-gold/10 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-brand-gold/60" />
              <span className="text-[10px] uppercase tracking-wider text-white/40 font-sans">
                Leads
              </span>
            </div>
            <span className="text-2xl font-display text-white tabular-nums">
              {totalLeads}
            </span>
          </div>
          <div className="bg-brand-black/60 border border-brand-gold/10 p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-brand-gold/60" />
              <span className="text-[10px] uppercase tracking-wider text-white/40 font-sans">
                Locations Active
              </span>
            </div>
            <span className="text-2xl font-display text-white tabular-nums">
              {data.rows.filter(
                (r) => r.totalVisualizations + r.totalLeads > 0
              ).length}
            </span>
          </div>
          {data.apiCalls && (
            <div className="bg-brand-black/60 border border-brand-gold/10 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-brand-gold/60" />
                <span className="text-[10px] uppercase tracking-wider text-white/40 font-sans">
                  API Calls
                </span>
              </div>
              <span className="text-2xl font-display text-white tabular-nums">
                {totalApiCalls}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && authed !== null && (
        <div className="text-center py-16">
          <div className="inline-block w-6 h-6 border-2 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin" />
          <p className="text-white/40 text-sm font-sans mt-3">
            Loading report&hellip;
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-500/10 border border-red-500/30 mb-6">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400 font-sans">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && data && data.rows.length === 0 && (
        <div className="text-center py-16 bg-brand-black/30 border border-white/5">
          <BarChart3 className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/40 text-sm font-sans">
            No location data found for {MONTH_NAMES[month - 1]} {year}.
          </p>
        </div>
      )}

      {/* Location usage table */}
      {!loading && !error && data && data.rows.length > 0 && (
        <div className="bg-brand-black/60 border border-brand-gold/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-gold/10 text-[10px] uppercase tracking-wider text-white/40 font-sans">
                <th className="py-3 px-4 text-left">Location</th>
                <th className="py-3 px-4 text-right">Team Visualizations</th>
                <th className="py-3 px-4 text-right">Leads</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <LocationRow key={row.locationId} row={row} days={days} />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-brand-gold/20 bg-white/[0.02]">
                <td className="py-3 px-4 text-sm font-sans font-semibold text-white/70">
                  All Locations
                </td>
                <td className="py-3 px-4 text-sm font-sans text-right tabular-nums font-semibold text-white/70">
                  {totalViz}
                </td>
                <td className="py-3 px-4 text-sm font-sans text-right tabular-nums font-semibold text-white/70">
                  {totalLeads}
                </td>
                <td className="py-3 px-4 text-sm font-sans text-right tabular-nums font-semibold text-brand-gold">
                  {totalViz + totalLeads}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* API call breakdown (super_admin only) */}
      {!loading && !error && data?.apiCalls && data.apiCalls.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-display font-bold text-brand-gold tracking-wider mb-4">
            API CALL BREAKDOWN
          </h3>
          <div className="bg-brand-black/60 border border-brand-gold/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-gold/10 text-[10px] uppercase tracking-wider text-white/40 font-sans">
                  <th className="py-3 px-4 text-left">Call Type</th>
                  <th className="py-3 px-4 text-right">Month Total</th>
                </tr>
              </thead>
              <tbody>
                {data.apiCalls.map((row) => (
                  <ApiCallRow key={row.callType} row={row} days={days} />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-brand-gold/20 bg-white/[0.02]">
                  <td className="py-3 px-4 text-sm font-sans font-semibold text-white/70">
                    All API Calls
                  </td>
                  <td className="py-3 px-4 text-sm font-sans text-right tabular-nums font-semibold text-brand-gold">
                    {totalApiCalls}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
