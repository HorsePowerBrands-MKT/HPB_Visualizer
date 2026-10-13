'use client';

/**
 * Shared visitor session for every visualizer product module.
 *
 * Owns everything that is independent of the product being designed:
 *  - anonymous fingerprint (localStorage) and monthly usage count / limit
 *  - Supabase auth user + team / candidate permissions
 *  - past visualizations for the visitor (auth or fingerprint)
 *  - the `?team=` UTM attribution param
 *
 * Extracted verbatim from `GatsbyGlassVisualizer` so the shower and railing
 * flows share one implementation.
 */

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '../lib/supabase/client';
import { isCandidate, type AccessLevel, type UserType } from '../lib/permissions';
import type { PastVisualizationItem } from '../components/PastVisualizations';

export interface VisualizerAuthUser {
  email: string;
  locationName: string | null;
  accessLevel: AccessLevel | null;
  userType: UserType;
}

export interface VisualizerSession {
  userFingerprint: string | null;
  usageCount: number;
  setUsageCount: React.Dispatch<React.SetStateAction<number>>;
  usageLimit: number;
  setUsageLimit: React.Dispatch<React.SetStateAction<number>>;
  isRateLimited: boolean;
  authUser: VisualizerAuthUser | null;
  /** Signed-in team member with unlimited generations. */
  isUnlimitedTeamMember: boolean;
  /** Signed-in candidate with a capped allowance and no lead actions. */
  isCandidateUser: boolean;
  pastVisualizations: PastVisualizationItem[];
  refreshPastVisualizations: () => void;
  teamUtm: string | null;
  handleLogout: () => Promise<void>;
}

export function useVisualizerSession(): VisualizerSession {
  // UTM team param — read once on mount from the URL
  const [teamUtm, setTeamUtm] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('team');
      if (t) setTeamUtm(t);
    }
  }, []);

  // --- Rate limiting state ---
  const [userFingerprint, setUserFingerprint] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [usageLimit, setUsageLimit] = useState(10);
  const isRateLimited = usageCount >= usageLimit;

  // --- Past visualizations state ---
  const [pastVisualizations, setPastVisualizations] = useState<PastVisualizationItem[]>([]);

  // --- Auth state ---
  const [authUser, setAuthUser] = useState<VisualizerAuthUser | null>(null);

  const isUnlimitedTeamMember = !!authUser && authUser.userType === 'team';
  const isCandidateUser = isCandidate(authUser?.userType);

  // Generate or retrieve fingerprint from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let fp = localStorage.getItem('hpb_user_id');
    if (!fp) {
      fp = uuidv4();
      localStorage.setItem('hpb_user_id', fp);
    }
    setUserFingerprint(fp);
  }, []);

  // Helper: fetch past visualizations using the right strategy (auth vs fingerprint)
  const refreshPastVisualizations = useCallback(() => {
    const url = authUser
      ? '/api/my-visualizations'
      : userFingerprint
        ? `/api/my-visualizations?fingerprint=${encodeURIComponent(userFingerprint)}`
        : null;
    if (!url) return;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.visualizations)) setPastVisualizations(data.visualizations);
      })
      .catch(() => {});
  }, [authUser, userFingerprint]);

  // Fetch usage count + past visualizations for anonymous users
  useEffect(() => {
    if (!userFingerprint || authUser) return;

    fetch(`/api/usage-count?fingerprint=${encodeURIComponent(userFingerprint)}`)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.usageCount === 'number') setUsageCount(data.usageCount);
        if (typeof data.limit === 'number') setUsageLimit(data.limit);
      })
      .catch(() => {});

    refreshPastVisualizations();
  }, [userFingerprint, authUser, refreshPastVisualizations]);

  // Fetch past visualizations for authenticated users
  useEffect(() => {
    if (!authUser) return;
    refreshPastVisualizations();
  }, [authUser, refreshPastVisualizations]);

  // Check Supabase auth state on mount and load team permissions
  useEffect(() => {
    const supabase = createClient();

    const loadTeamProfile = async (email: string) => {
      try {
        const res = await fetch('/api/team-profile');
        if (!res.ok) {
          setAuthUser({ email, locationName: null, accessLevel: null, userType: 'team' });
          return;
        }
        const data = await res.json();
        setAuthUser({
          email: data.email ?? email,
          locationName: data.locationName ?? null,
          accessLevel: data.accessLevel ?? null,
          userType: data.userType ?? 'team',
        });
        if (data.userType === 'candidate') {
          if (typeof data.usageCount === 'number') setUsageCount(data.usageCount);
          if (typeof data.renderingCap === 'number') setUsageLimit(data.renderingCap);
        }
      } catch {
        setAuthUser({ email, locationName: null, accessLevel: null, userType: 'team' });
      }
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        loadTeamProfile(user.email);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        loadTeamProfile(session.user.email);
      } else {
        setAuthUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setAuthUser(null);
  }, []);

  return {
    userFingerprint,
    usageCount,
    setUsageCount,
    usageLimit,
    setUsageLimit,
    isRateLimited,
    authUser,
    isUnlimitedTeamMember,
    isCandidateUser,
    pastVisualizations,
    refreshPastVisualizations,
    teamUtm,
    handleLogout,
  };
}
