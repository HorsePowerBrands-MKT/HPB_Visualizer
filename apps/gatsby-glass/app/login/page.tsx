'use client';

import React, { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setStatus('error');
        setErrorMessage(error.message);
        return;
      }

      setStatus('sent');
    } catch {
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-brown flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-brand-gold tracking-wider">
            TEAM LOGIN
          </h1>
          <p className="text-white/60 mt-2 text-sm tracking-widest uppercase font-sans">
            Gatsby Glass Internal
          </p>
        </div>

        {/* Card */}
        <div className="bg-brand-black/60 border border-brand-gold/20 p-8">
          {status === 'sent' ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-brand-gold mx-auto mb-4" />
              <h2 className="text-xl font-display text-brand-gold mb-2">
                CHECK YOUR EMAIL
              </h2>
              <p className="text-white/70 text-sm font-sans">
                We sent a login link to{' '}
                <span className="text-white font-medium">{email}</span>.
                Click the link in the email to sign in.
              </p>
              <button
                onClick={() => { setStatus('idle'); setEmail(''); }}
                className="mt-6 text-brand-gold/80 hover:text-brand-gold text-sm font-sans underline underline-offset-4 transition-colors"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label htmlFor="email" className="block text-sm font-sans text-white/80 mb-2 tracking-wide uppercase">
                Location Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gold/60" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="store@gatsbyglass.com"
                  required
                  className="w-full bg-brand-black border border-brand-gold/30 text-white pl-10 pr-4 py-3 text-sm font-sans placeholder:text-white/30 focus:outline-none focus:border-brand-gold transition-colors"
                />
              </div>

              {status === 'error' && (
                <div className="flex items-start gap-2 mt-3 text-red-400 text-xs font-sans">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading' || !email}
                className="w-full mt-6 bg-brand-gold text-brand-black font-sans font-semibold py-3 text-sm tracking-wider uppercase hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Sending...' : 'Send Login Link'}
              </button>
            </form>
          )}
        </div>

        {/* Back link */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 mt-6 text-white/50 hover:text-white/80 text-sm font-sans transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Visualizer
        </Link>
      </div>
    </div>
  );
}
