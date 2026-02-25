'use client';

import React, { useState } from 'react';
import { X, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Label } from './ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  visualizationImageUrl?: string | null;
  team?: string | null;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  visualizationImageUrl,
  team,
}) => {
  const [issueMessage, setIssueMessage] = useState('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!issueMessage.trim()) {
      setError('Please describe the issue');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/report-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          issueMessage: issueMessage.trim(),
          visualizationImageUrl: visualizationImageUrl || null,
          team: team || null,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit issue report');
      }

      setSuccess(true);

      // Auto-close after 2 seconds on success
      setTimeout(() => {
        onClose();
        setIssueMessage('');
        setSuccess(false);
      }, 2000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setIssueMessage('');
      setError('');
      setSuccess(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-brand-brown border-brand-gold">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-brand-gold">
              Report Issue
            </CardTitle>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
              disabled={submitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="py-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Thank you!</h3>
              <p className="text-gray-400">
                Your issue report has been submitted. Our team will review it.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-400 mb-4">
                Please describe what's not working correctly with your visualization. This helps us improve the tool.
              </p>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div>
                <Label htmlFor="issueMessage" className="text-white">Describe the issue *</Label>
                <textarea
                  id="issueMessage"
                  value={issueMessage}
                  onChange={(e) => {
                    setIssueMessage(e.target.value);
                    if (error) setError('');
                  }}
                  className={`mt-1 w-full min-h-[120px] px-3 py-2 border bg-black/30 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all ${
                    error ? 'border-red-500' : 'border-brand-gold/30'
                  }`}
                  placeholder="Example: The glass texture doesn't look right, or the door is on the wrong side..."
                  disabled={submitting}
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {issueMessage.length}/1000 characters
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Report'
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
