'use client';

/**
 * The header strip every visualizer module shares: optional "Change product"
 * link, the signed-in badge (or the anonymous usage counter + team login),
 * the candidate usage counter, and the visitor's past design previews.
 *
 * Purely presentational — state comes from `useVisualizerSession`.
 * Extracted from `GatsbyGlassVisualizer`.
 */

import React from 'react';
import Link from 'next/link';
import { LogOut, User as UserIcon, ArrowLeft } from 'lucide-react';
import { UsageCounter } from './UsageCounter';
import { PastVisualizations, type PastVisualizationItem } from './PastVisualizations';
import { hasAccess } from '../lib/permissions';
import type { VisualizerAuthUser } from '../hooks/useVisualizerSession';

interface VisualizerChromeProps {
  onChangeProduct?: () => void;
  authUser: VisualizerAuthUser | null;
  isCandidateUser: boolean;
  usageCount: number;
  usageLimit: number;
  isRateLimited: boolean;
  onLogout: () => void;
  pastVisualizations: PastVisualizationItem[];
  onPastSave?: (item: PastVisualizationItem) => void;
  onPastRequestQuote?: (item: PastVisualizationItem) => void;
}

export const VisualizerChrome: React.FC<VisualizerChromeProps> = ({
  onChangeProduct,
  authUser,
  isCandidateUser,
  usageCount,
  usageLimit,
  isRateLimited,
  onLogout,
  pastVisualizations,
  onPastSave,
  onPastRequestQuote,
}) => (
  <>
    {onChangeProduct && (
      <div className="mb-3">
        <button
          type="button"
          onClick={onChangeProduct}
          className="inline-flex items-center gap-1.5 text-[11px] font-sans text-white/40 hover:text-brand-gold transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Change product
        </button>
      </div>
    )}

    {/* Team Login / Auth badge */}
    {authUser ? (
      <div className="flex items-center justify-between bg-brand-black/40 border border-white/[0.06] px-4 py-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <UserIcon className="w-3.5 h-3.5 text-brand-gold shrink-0" />
          <span className="text-xs font-sans text-brand-gold truncate">
            {authUser.email}
          </span>
          {isCandidateUser && (
            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-amber-500/15 text-amber-300 font-sans shrink-0">
              Candidate
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 ml-3 shrink-0">
          {authUser.accessLevel && hasAccess(authUser.accessLevel, 'social') && (
            <Link
              href="/admin/submissions"
              className="text-[11px] text-white/40 hover:text-brand-gold font-sans transition-colors"
            >
              Submissions
            </Link>
          )}
          {authUser.accessLevel && hasAccess(authUser.accessLevel, 'corporate_team') && (
            <>
              <Link
                href="/admin/candidates"
                className="text-[11px] text-white/40 hover:text-brand-gold font-sans transition-colors"
              >
                Candidates
              </Link>
              <Link
                href="/admin/leads"
                className="text-[11px] text-white/40 hover:text-brand-gold font-sans transition-colors"
              >
                Leads
              </Link>
              <Link
                href="/admin/usage-report"
                className="text-[11px] text-white/40 hover:text-brand-gold font-sans transition-colors"
              >
                Usage Report
              </Link>
            </>
          )}
          {authUser.accessLevel && hasAccess(authUser.accessLevel, 'admin') && (
            <Link
              href="/admin/users"
              className="text-[11px] text-white/40 hover:text-brand-gold font-sans transition-colors"
            >
              Users
            </Link>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70 font-sans transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Sign out
          </button>
        </div>
      </div>
    ) : (
      <UsageCounter
        usageCount={usageCount}
        limit={usageLimit}
        isRateLimited={isRateLimited}
        loginSlot={
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-[11px] font-sans text-white/40 hover:text-brand-gold transition-colors"
          >
            <UserIcon className="w-3 h-3" />
            Team Login
          </Link>
        }
      />
    )}

    {isCandidateUser && (
      <UsageCounter
        usageCount={usageCount}
        limit={usageLimit}
        isRateLimited={isRateLimited}
      />
    )}

    {/* Past visualizations */}
    <PastVisualizations
      items={pastVisualizations}
      onSave={isCandidateUser ? undefined : onPastSave}
      onRequestQuote={isCandidateUser ? undefined : onPastRequestQuote}
    />
  </>
);
