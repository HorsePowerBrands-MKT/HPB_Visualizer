'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Search,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/client';

type AccessLevel = 'member' | 'social' | 'admin' | 'super_admin';

interface TeamUser {
  id: string;
  email: string;
  locationId: string;
  locationName: string | null;
  isActive: boolean;
  accessLevel: AccessLevel;
  source: string;
  createdAt: string;
}

interface LocationOption {
  locationId: string;
  locationName: string | null;
}

interface UsersResponse {
  users: TeamUser[];
  locations: LocationOption[];
  currentUser: { email: string; accessLevel: AccessLevel };
}

const ACCESS_LABELS: Record<AccessLevel, string> = {
  member: 'Member',
  social: 'Social',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

const CORPORATE_ID = 'CORPORATE';

function isCorporate(user: TeamUser): boolean {
  return user.locationId === CORPORATE_ID;
}

function AddUserForm({
  locations,
  grantableLevels,
  onCreated,
  onClose,
}: {
  locations: LocationOption[];
  grantableLevels: AccessLevel[];
  onCreated: (user: TeamUser) => void;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<'corporate' | 'franchise'>('corporate');
  const [name, setName] = useState('');
  const [locationId, setLocationId] = useState('');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('member');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (userType === 'franchise' && !locationId) {
      setError('Please choose a franchise location');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          userType,
          locationName: userType === 'corporate' ? name : undefined,
          locationId: userType === 'franchise' ? locationId : undefined,
          accessLevel,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || 'Failed to create user');
      }
      onCreated(body.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-brand-black/80 border border-white/10 focus:border-brand-gold/40 outline-none px-3 py-2 text-sm font-sans text-white/90 placeholder:text-white/25 transition-colors';

  return (
    <div className="bg-brand-black/60 border border-brand-gold/20 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-sans font-semibold uppercase tracking-wider text-brand-gold">
          Add User
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-white/40 hover:text-white/80 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-white/40 font-sans mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@gatsbyglass.com"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-white/40 font-sans mb-1.5">
              User Type
            </label>
            <div className="flex gap-0 border border-white/10">
              {(['corporate', 'franchise'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setUserType(type)}
                  className={`flex-1 px-3 py-2 text-xs font-sans font-semibold uppercase tracking-wider transition-colors ${
                    userType === type
                      ? 'bg-brand-gold/15 text-brand-gold'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {type === 'corporate' ? 'Corporate' : 'Franchise'}
                </button>
              ))}
            </div>
          </div>

          {userType === 'corporate' ? (
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/40 font-sans mb-1.5">
                Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Smith"
                className={inputClass}
              />
            </div>
          ) : (
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/40 font-sans mb-1.5">
                Location
              </label>
              <select
                required
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className={inputClass}
              >
                <option value="">Select a location&hellip;</option>
                {locations.map((loc) => (
                  <option key={loc.locationId} value={loc.locationId}>
                    {loc.locationName || loc.locationId}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-white/40 font-sans mb-1.5">
              Access Level
            </label>
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value as AccessLevel)}
              className={inputClass}
            >
              {grantableLevels.map((level) => (
                <option key={level} value={level}>
                  {ACCESS_LABELS[level]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400 font-sans">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-white/35 font-sans">
            New users sign in at <span className="text-white/60">/login</span> with a magic
            link &mdash; no password setup needed.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2 text-xs font-sans font-semibold uppercase tracking-wider bg-brand-gold text-brand-black hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            {submitting ? 'Adding\u2026' : 'Add User'}
          </button>
        </div>
      </form>
    </div>
  );
}

function UserRow({
  user,
  readOnly,
  isSelf,
  grantableLevels,
  onUpdate,
}: {
  user: TeamUser;
  readOnly: boolean;
  isSelf: boolean;
  grantableLevels: AccessLevel[];
  onUpdate: (id: string, updates: { accessLevel?: AccessLevel; isActive?: boolean }) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  const handle = async (updates: { accessLevel?: AccessLevel; isActive?: boolean }) => {
    setSaving(true);
    try {
      await onUpdate(user.id, updates);
    } finally {
      setSaving(false);
    }
  };

  const disabled = readOnly || saving;
  const corporate = isCorporate(user);

  // A super_admin row viewed by a non-super-admin won't include super_admin
  // in grantableLevels; show it as a fixed label instead of a select.
  const levelInOptions = grantableLevels.includes(user.accessLevel);

  return (
    <tr className={`border-b border-white/5 transition-colors ${user.isActive ? '' : 'opacity-50'}`}>
      <td className="py-3 px-4 text-sm font-sans text-white/90">
        <div className="flex items-center gap-2">
          {user.email}
          {isSelf && (
            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-brand-gold/15 text-brand-gold font-sans">
              You
            </span>
          )}
        </div>
      </td>
      <td className="py-3 px-4 text-sm font-sans text-white/70">
        <div className="flex items-center gap-2">
          <span
            className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 font-sans ${
              corporate ? 'bg-purple-500/15 text-purple-300' : 'bg-sky-500/15 text-sky-300'
            }`}
          >
            {corporate ? 'Corporate' : 'Franchise'}
          </span>
          <span className="text-white/60">{user.locationName || user.locationId}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        {readOnly || !levelInOptions ? (
          <span className="text-sm font-sans text-white/60">{ACCESS_LABELS[user.accessLevel]}</span>
        ) : (
          <select
            value={user.accessLevel}
            disabled={disabled}
            onChange={(e) => handle({ accessLevel: e.target.value as AccessLevel })}
            className="bg-brand-black/80 border border-white/10 focus:border-brand-gold/40 outline-none px-2 py-1.5 text-xs font-sans text-white/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {grantableLevels.map((level) => (
              <option key={level} value={level}>
                {ACCESS_LABELS[level]}
              </option>
            ))}
          </select>
        )}
      </td>
      <td className="py-3 px-4">
        {readOnly ? (
          <span className={`text-xs font-sans ${user.isActive ? 'text-emerald-400' : 'text-white/40'}`}>
            {user.isActive ? 'Active' : 'Inactive'}
          </span>
        ) : (
          <button
            disabled={disabled}
            onClick={() => handle({ isActive: !user.isActive })}
            className={`px-3 py-1.5 text-[10px] font-sans font-semibold uppercase tracking-wider border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              user.isActive
                ? 'text-red-400/80 border-red-500/20 hover:bg-red-500/10'
                : 'text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10'
            }`}
          >
            {saving ? '\u2026' : user.isActive ? 'Deactivate' : 'Reactivate'}
          </button>
        )}
      </td>
    </tr>
  );
}

export default function ManageUsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'corporate' | 'franchise'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthed(!!user?.email);
    });
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to load users');
      }
      const body: UsersResponse = await res.json();
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) {
      fetchUsers();
    }
  }, [authed, fetchUsers]);

  const grantableLevels = useMemo<AccessLevel[]>(() => {
    if (data?.currentUser.accessLevel === 'super_admin') {
      return ['member', 'social', 'admin', 'super_admin'];
    }
    return ['member', 'social', 'admin'];
  }, [data?.currentUser.accessLevel]);

  const handleUpdate = useCallback(
    async (id: string, updates: { accessLevel?: AccessLevel; isActive?: boolean }) => {
      setActionError(null);
      setNotice(null);
      try {
        const res = await fetch(`/api/admin/users/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        const body = await res.json();
        if (!res.ok) {
          throw new Error(body.error || 'Failed to update user');
        }
        const updated: TeamUser = body.user;
        setData((prev) =>
          prev
            ? { ...prev, users: prev.users.map((u) => (u.id === updated.id ? updated : u)) }
            : prev
        );
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Failed to update user');
      }
    },
    []
  );

  const handleCreated = useCallback((user: TeamUser) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            users: [...prev.users, user].sort((a, b) => a.email.localeCompare(b.email)),
          }
        : prev
    );
    setShowAddForm(false);
    setNotice(`${user.email} added. They can now sign in at /login.`);
  }, []);

  const filteredUsers = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.users.filter((u) => {
      if (typeFilter === 'corporate' && !isCorporate(u)) return false;
      if (typeFilter === 'franchise' && isCorporate(u)) return false;
      if (statusFilter === 'active' && !u.isActive) return false;
      if (statusFilter === 'inactive' && u.isActive) return false;
      if (q) {
        const haystack = `${u.email} ${u.locationName ?? ''} ${u.locationId}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [data, search, typeFilter, statusFilter]);

  if (authed === false) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-display text-brand-gold mb-2">
          Authentication Required
        </h2>
        <p className="text-white/60 text-sm font-sans mb-6">
          You must be signed in as a Gatsby Glass admin to manage users.
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

  const filterButtonClass = (active: boolean) =>
    `px-3 py-1.5 text-[10px] font-sans font-semibold uppercase tracking-wider transition-colors ${
      active ? 'bg-brand-gold/15 text-brand-gold' : 'text-white/40 hover:text-white/70'
    }`;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-white/40 hover:text-white/70 text-xs font-sans transition-colors mb-2"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Visualizer
          </Link>
          <h2 className="text-2xl font-display font-bold text-brand-gold tracking-wider">
            MANAGE USERS
          </h2>
          <p className="text-white/50 text-sm font-sans mt-1">
            Add team members and control their access level
          </p>
        </div>
        {!showAddForm && data && (
          <button
            onClick={() => {
              setShowAddForm(true);
              setNotice(null);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-sans font-semibold uppercase tracking-wider bg-brand-gold text-brand-black hover:bg-brand-secondary transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add User
          </button>
        )}
      </div>

      {/* Add user form */}
      {showAddForm && data && (
        <AddUserForm
          locations={data.locations}
          grantableLevels={grantableLevels}
          onCreated={handleCreated}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Success notice */}
      {notice && (
        <div className="flex items-start gap-2 p-4 bg-emerald-500/10 border border-emerald-500/30 mb-6">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-400 font-sans">{notice}</p>
        </div>
      )}

      {/* Action error */}
      {actionError && (
        <div className="flex items-start gap-2 p-4 bg-red-500/10 border border-red-500/30 mb-6">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400 font-sans">{actionError}</p>
        </div>
      )}

      {/* Loading */}
      {loading && authed !== null && (
        <div className="text-center py-16">
          <div className="inline-block w-6 h-6 border-2 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin" />
          <p className="text-white/40 text-sm font-sans mt-3">Loading users&hellip;</p>
        </div>
      )}

      {/* Load error (incl. permission denied) */}
      {!loading && error && (
        <div className="flex items-start gap-2 p-4 bg-red-500/10 border border-red-500/30 mb-6">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400 font-sans">{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Search + filters */}
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email or location&hellip;"
                className="w-full bg-brand-black/60 border border-white/10 focus:border-brand-gold/40 outline-none pl-9 pr-3 py-2 text-sm font-sans text-white/90 placeholder:text-white/25 transition-colors"
              />
            </div>
            <div className="flex border border-white/10">
              {(['all', 'corporate', 'franchise'] as const).map((t) => (
                <button key={t} onClick={() => setTypeFilter(t)} className={filterButtonClass(typeFilter === t)}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex border border-white/10">
              {(['active', 'inactive', 'all'] as const).map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)} className={filterButtonClass(statusFilter === s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Users table */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16 bg-brand-black/30 border border-white/5">
              <Users className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-white/40 text-sm font-sans">No users match the current filters.</p>
            </div>
          ) : (
            <div className="bg-brand-black/60 border border-brand-gold/10 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-gold/10 text-[10px] uppercase tracking-wider text-white/40 font-sans">
                    <th className="py-3 px-4 text-left">Email</th>
                    <th className="py-3 px-4 text-left">Location</th>
                    <th className="py-3 px-4 text-left">Access Level</th>
                    <th className="py-3 px-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const isSelf = user.email === data.currentUser.email;
                    const isProtectedSuperAdmin =
                      user.accessLevel === 'super_admin' &&
                      data.currentUser.accessLevel !== 'super_admin';
                    return (
                      <UserRow
                        key={user.id}
                        user={user}
                        isSelf={isSelf}
                        readOnly={isSelf || isProtectedSuperAdmin}
                        grantableLevels={grantableLevels}
                        onUpdate={handleUpdate}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-white/30 font-sans mt-4">
            Showing {filteredUsers.length} of {data.users.length} users. Deactivated users keep
            their history but can no longer sign in. Franchise locations are synced nightly from
            ZeeDatabase; users added here are never auto-deactivated by that sync.
          </p>
        </>
      )}
    </div>
  );
}
