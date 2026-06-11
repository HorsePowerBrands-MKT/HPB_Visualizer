'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Users,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  ShieldOff,
  Inbox,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/client';

interface VisualizationHistoryItem {
  watermarked: string | null;
  original: string | null;
  created_at: string;
  mode?: string | null;
  enclosure_type?: string | null;
  framing_style?: string | null;
  hardware_finish?: string | null;
  handle_style?: string | null;
}

interface AdminLeadRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  zipCode: string | null;
  locationId: string | null;
  locationName: string | null;
  createdAt: string;
  status: string | null;
  doorType: string | null;
  finish: string | null;
  hardware: string | null;
  handleStyle: string | null;
  trackPreference: string | null;
  showerShape: string | null;
  mode: string | null;
  visualizationImageUrl: string | null;
  allVisualizationUrls: VisualizationHistoryItem[] | null;
  tcpaConsent: boolean;
}

interface LeadsData {
  year: number;
  month: number;
  leads: AdminLeadRow[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  contacted: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  quoted: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  closed: 'bg-green-500/15 text-green-300 border-green-500/30',
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function DetailItem({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-white/30 font-sans">
        {label}
      </div>
      <div className="text-xs text-white/70 font-sans mt-0.5">
        {titleCase(value)}
      </div>
    </div>
  );
}

function LeadRow({ lead }: { lead: AdminLeadRow }) {
  const [expanded, setExpanded] = useState(false);

  const status = (lead.status ?? 'new').toLowerCase();
  const statusClass =
    STATUS_STYLES[status] ?? 'bg-white/10 text-white/50 border-white/20';

  // Build a deduped list of visualization images for the expanded view
  const images = useMemo(() => {
    const seen = new Set<string>();
    const list: { url: string; label: string | null }[] = [];
    for (const item of lead.allVisualizationUrls ?? []) {
      const url = item.watermarked || item.original;
      if (url && !seen.has(url)) {
        seen.add(url);
        const labelParts = [item.enclosure_type, item.hardware_finish].filter(
          Boolean
        ) as string[];
        list.push({
          url,
          label: labelParts.length > 0 ? labelParts.map(titleCase).join(' / ') : null,
        });
      }
    }
    if (lead.visualizationImageUrl && !seen.has(lead.visualizationImageUrl)) {
      list.unshift({ url: lead.visualizationImageUrl, label: null });
    }
    return list;
  }, [lead]);

  return (
    <>
      <tr
        className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-3 px-4 text-xs font-sans text-white/50 whitespace-nowrap">
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-white/30 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-white/30 shrink-0" />
            )}
            {formatDateTime(lead.createdAt)}
          </div>
        </td>
        <td className="py-3 px-4 text-sm font-sans text-white/90">
          {lead.name || '\u2014'}
        </td>
        <td className="py-3 px-4 text-xs font-sans text-white/70">
          <div className="flex flex-col gap-0.5">
            {lead.email && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-white/30 shrink-0" />
                {lead.email}
              </span>
            )}
            {lead.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-white/30 shrink-0" />
                {lead.phone}
              </span>
            )}
            {!lead.email && !lead.phone && '\u2014'}
          </div>
        </td>
        <td className="py-3 px-4 text-sm font-sans tabular-nums text-white/70">
          {lead.zipCode || '\u2014'}
        </td>
        <td className="py-3 px-4 text-sm font-sans text-white/70">
          {lead.locationName || lead.locationId || '\u2014'}
        </td>
        <td className="py-3 px-4 text-right">
          <span
            className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider font-sans font-semibold border ${statusClass}`}
          >
            {status}
          </span>
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-white/5">
          <td colSpan={6} className="p-0">
            <div className="bg-white/[0.02] border-t border-white/5 px-4 py-4 pl-12">
              {/* Design details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-4">
                <DetailItem label="Mode" value={lead.mode} />
                <DetailItem label="Door Type" value={lead.doorType} />
                <DetailItem label="Finish" value={lead.finish} />
                <DetailItem label="Hardware" value={lead.hardware} />
                <DetailItem label="Handle" value={lead.handleStyle} />
                <DetailItem label="Framing" value={lead.trackPreference} />
                <DetailItem label="Shape" value={lead.showerShape} />
              </div>

              {/* TCPA consent */}
              <div className="flex items-center gap-1.5 mb-4">
                {lead.tcpaConsent ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs text-green-400 font-sans">
                      TCPA consent given
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldOff className="w-3.5 h-3.5 text-white/30" />
                    <span className="text-xs text-white/40 font-sans">
                      No TCPA consent
                    </span>
                  </>
                )}
              </div>

              {/* Visualization images */}
              {images.length > 0 ? (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/30 font-sans mb-2">
                    Design Previews ({images.length})
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {images.map((img) => (
                      <a
                        key={img.url}
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="group relative block border border-white/10 hover:border-brand-gold/40 transition-colors"
                        title={img.label ?? 'Open full image'}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={img.label ?? 'Design preview'}
                          className="h-24 w-32 object-cover"
                          loading="lazy"
                        />
                        <span className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/50">
                          <ExternalLink className="w-4 h-4 text-white/80" />
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-white/30 font-sans">
                  No design preview images for this lead.
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function LeadsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<LeadsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [locationFilter, setLocationFilter] = useState<string>('all');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthed(!!user?.email);
    });
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads?month=${month}&year=${year}`);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to load leads');
      }
      const body: LeadsData = await res.json();
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    if (authed) {
      fetchLeads();
    }
  }, [authed, fetchLeads]);

  // Reset the location filter when switching months
  useEffect(() => {
    setLocationFilter('all');
  }, [month, year]);

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

  const locations = useMemo(() => {
    const map = new Map<string, string>();
    for (const lead of data?.leads ?? []) {
      const id = lead.locationId ?? 'UNKNOWN';
      if (!map.has(id)) {
        map.set(id, lead.locationName || id);
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const filteredLeads = useMemo(() => {
    const leads = data?.leads ?? [];
    if (locationFilter === 'all') return leads;
    return leads.filter((l) => (l.locationId ?? 'UNKNOWN') === locationFilter);
  }, [data, locationFilter]);

  if (authed === false) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-display text-brand-gold mb-2">
          Authentication Required
        </h2>
        <p className="text-white/60 text-sm font-sans mb-6">
          You must be signed in as a Gatsby Glass team member to view leads.
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
          LEADS
        </h2>
        <p className="text-white/50 text-sm font-sans mt-1">
          Monthly lead details across franchise locations
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
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-brand-black/60 border border-brand-gold/10 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-brand-gold/60" />
              <span className="text-[10px] uppercase tracking-wider text-white/40 font-sans">
                Leads
              </span>
            </div>
            <span className="text-2xl font-display text-white tabular-nums">
              {data.leads.length}
            </span>
          </div>
          <div className="bg-brand-black/60 border border-brand-gold/10 p-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-brand-gold/60" />
              <span className="text-[10px] uppercase tracking-wider text-white/40 font-sans">
                Locations
              </span>
            </div>
            <span className="text-2xl font-display text-white tabular-nums">
              {locations.length}
            </span>
          </div>
          <div className="bg-brand-black/60 border border-brand-gold/10 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="w-4 h-4 text-brand-gold/60" />
              <span className="text-[10px] uppercase tracking-wider text-white/40 font-sans">
                With Phone
              </span>
            </div>
            <span className="text-2xl font-display text-white tabular-nums">
              {data.leads.filter((l) => l.phone).length}
            </span>
          </div>
        </div>
      )}

      {/* Location filter */}
      {!loading && data && data.leads.length > 0 && (
        <div className="flex justify-end mb-4">
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="bg-brand-black/60 border border-brand-gold/20 text-white/80 text-xs font-sans px-3 py-2 focus:outline-none focus:border-brand-gold/50"
          >
            <option value="all">All Locations ({data.leads.length})</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Loading */}
      {loading && authed !== null && (
        <div className="text-center py-16">
          <div className="inline-block w-6 h-6 border-2 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin" />
          <p className="text-white/40 text-sm font-sans mt-3">
            Loading leads&hellip;
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
      {!loading && !error && data && filteredLeads.length === 0 && (
        <div className="text-center py-16 bg-brand-black/30 border border-white/5">
          <Inbox className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/40 text-sm font-sans">
            No leads found for {MONTH_NAMES[month - 1]} {year}.
          </p>
        </div>
      )}

      {/* Leads table */}
      {!loading && !error && filteredLeads.length > 0 && (
        <div className="bg-brand-black/60 border border-brand-gold/10 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-gold/10 text-[10px] uppercase tracking-wider text-white/40 font-sans">
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Contact</th>
                <th className="py-3 px-4 text-left">Zip</th>
                <th className="py-3 px-4 text-left">Location</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <LeadRow key={lead.id} lead={lead} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
