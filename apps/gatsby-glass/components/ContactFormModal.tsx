'use client';

import React, { useState } from 'react';
import { X, Loader2, Check, AlertCircle } from 'lucide-react';
import type { Payload } from '@repo/types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { useLegalModal } from './legal/LegalModalProvider';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  visualizationData: {
    resultUrl: string;
    uploadedImage: string;
    configs: Payload;
  };
  mode: 'save' | 'quote';
  userFingerprint?: string;
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function formatZip(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function stripPhoneFormatting(formatted: string): string {
  return formatted.replace(/\D/g, '');
}

const TCPA_CONSENT_TEXT = 'I agree to receive calls and/or text messages from Gatsby Glass and its local franchisees at the phone number provided. I understand that consent is not a condition of purchase. Message & data rates may apply. Reply STOP to opt out at any time.';

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  visualizationData,
  mode,
  userFingerprint,
}) => {
  const { openPrivacyPolicy } = useLegalModal();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    zipCode: ''
  });
  const [tcpaConsent, setTcpaConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const phoneRequired = mode === 'quote';
  const hasPhone = stripPhoneFormatting(formData.phone).length > 0;
  const tcpaRequired = phoneRequired || hasPhone;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    const phoneDigits = stripPhoneFormatting(formData.phone);
    if (phoneRequired && phoneDigits.length === 0) {
      newErrors.phone = 'Phone number is required for a quote request';
    } else if (phoneDigits.length > 0 && phoneDigits.length < 10) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    const zipDigits = formData.zipCode.replace(/\D/g, '');
    if (!zipDigits) {
      newErrors.zipCode = 'Zip code is required';
    } else if (zipDigits.length !== 5 && zipDigits.length !== 9) {
      newErrors.zipCode = 'Please enter a valid US zip code';
    }

    if (tcpaRequired && !tcpaConsent) {
      newErrors.tcpa = 'Consent is required to proceed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const phoneDigits = stripPhoneFormatting(formData.phone);

      const response = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: phoneDigits || undefined,
          zipCode: formData.zipCode.replace(/[^\d-]/g, ''),
          visualizationImage: visualizationData.resultUrl,
          doorType: visualizationData.configs.enclosure_type,
          finish: visualizationData.configs.glass_style,
          hardware: visualizationData.configs.hardware_finish,
          handleStyle: visualizationData.configs.handle_style,
          trackPreference: visualizationData.configs.track_preference,
          mode: visualizationData.configs.mode,
          showerShape: visualizationData.configs.shower_shape,
          sessionId: visualizationData.configs.session_id,
          source: 'Gatsby Glass Visualizer',
          leadType: mode === 'save' ? 'SAS' : 'RAQ',
          tcpaConsent: tcpaRequired ? tcpaConsent : undefined,
          tcpaConsentText: tcpaRequired && tcpaConsent ? TCPA_CONSENT_TEXT : undefined,
          consentUserAgent: tcpaRequired && tcpaConsent ? navigator.userAgent : undefined,
          userFingerprint: userFingerprint || undefined,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit');
      }

      setSuccess(true);

      setTimeout(() => {
        onClose();
        setFormData({ name: '', email: '', phone: '', zipCode: '' });
        setTcpaConsent(false);
        setSuccess(false);
      }, 3000);

    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to submit. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    let formatted = value;
    if (field === 'phone') formatted = formatPhone(value);
    if (field === 'zipCode') formatted = formatZip(value);

    setFormData(prev => ({ ...prev, [field]: formatted }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    if (field === 'phone' && errors.tcpa) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.tcpa;
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-brand-brown border-brand-gold">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-brand-gold">
              {mode === 'save' ? 'Save & Send to Me' : 'Request a Quote'}
            </CardTitle>
            <button
              onClick={onClose}
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
              <h3 className="text-lg font-semibold text-white mb-2">Success!</h3>
              <p className="text-gray-400">
                {mode === 'save'
                  ? 'Your visualization has been sent to your email.'
                  : 'Your quote request has been submitted. We\'ll contact you soon!'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-400 mb-4">
                {mode === 'save'
                  ? 'Enter your information to receive your visualization via email.'
                  : 'Provide your details and we\'ll connect you with a local Gatsby Glass professional.'}
              </p>

              {errors.submit && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{errors.submit}</p>
                </div>
              )}

              {/* Name */}
              <div>
                <Label htmlFor="name" className="text-white">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Jane Doe"
                  disabled={submitting}
                />
                {errors.name && (
                  <p className="text-xs text-red-400 mt-1">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-white">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`mt-1 ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="jane@example.com"
                  disabled={submitting}
                />
                {errors.email && (
                  <p className="text-xs text-red-400 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone" className="text-white">
                  Phone{phoneRequired ? ' *' : ' (Optional)'}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={`mt-1 ${errors.phone ? 'border-red-500' : ''}`}
                  placeholder="(555) 123-4567"
                  disabled={submitting}
                />
                {errors.phone && (
                  <p className="text-xs text-red-400 mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Zip Code */}
              <div>
                <Label htmlFor="zipCode" className="text-white">Zip Code *</Label>
                <Input
                  id="zipCode"
                  type="text"
                  autoComplete="postal-code"
                  inputMode="numeric"
                  value={formData.zipCode}
                  onChange={(e) => handleChange('zipCode', e.target.value)}
                  className={`mt-1 ${errors.zipCode ? 'border-red-500' : ''}`}
                  placeholder="12345"
                  disabled={submitting}
                />
                {errors.zipCode && (
                  <p className="text-xs text-red-400 mt-1">{errors.zipCode}</p>
                )}
              </div>

              {/* TCPA Consent — visible whenever phone is required or provided */}
              {tcpaRequired && (
                <div className="pt-1">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <span className="relative flex-shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={tcpaConsent}
                        onChange={(e) => {
                          setTcpaConsent(e.target.checked);
                          if (errors.tcpa) {
                            setErrors(prev => {
                              const n = { ...prev };
                              delete n.tcpa;
                              return n;
                            });
                          }
                        }}
                        disabled={submitting}
                        className="sr-only peer"
                      />
                      <span className={`
                        block w-[18px] h-[18px] border-2 transition-colors
                        ${errors.tcpa
                          ? 'border-red-500'
                          : 'border-white/40 group-hover:border-brand-gold/70'}
                        peer-checked:bg-brand-gold peer-checked:border-brand-gold
                        peer-focus-visible:ring-2 peer-focus-visible:ring-brand-gold/50
                      `} />
                      {tcpaConsent && (
                        <Check className="absolute inset-0 w-[18px] h-[18px] text-brand-black p-[2px] pointer-events-none" />
                      )}
                    </span>
                    <span className="text-xs text-white/70 leading-relaxed select-none">
                      {TCPA_CONSENT_TEXT}
                    </span>
                  </label>
                  {errors.tcpa && (
                    <p className="text-xs text-red-400 mt-1.5 ml-[30px]">{errors.tcpa}</p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
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
                    mode === 'save' ? 'Send to Me' : 'Request Quote'
                  )}
                </Button>
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed pt-2">
                By submitting this form you consent to being contacted by Gatsby Glass or a local Gatsby Glass franchisee via email regarding your inquiry.{' '}
                All visualization images generated during your session will be retained and shared with the franchisee serving your area to assist with your consultation.{' '}
                Your information will not be sold to third parties.{' '}
                View our{' '}
                <button type="button" onClick={openPrivacyPolicy} className="underline hover:text-gray-300 transition-colors">Privacy Policy</button>.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
