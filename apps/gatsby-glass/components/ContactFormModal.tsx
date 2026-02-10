'use client';

import React, { useState } from 'react';
import { X, Loader2, Check, AlertCircle } from 'lucide-react';
import type { Payload } from '@repo/types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  visualizationData: {
    resultUrl: string;
    uploadedImage: string;
    configs: Payload;
  };
  mode: 'save' | 'quote';
}

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  visualizationData,
  mode
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    zipCode: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'Zip code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = 'Please enter a valid US zip code';
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
      const response = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          zipCode: formData.zipCode,
          visualizationImage: visualizationData.resultUrl,
          originalImage: visualizationData.uploadedImage,
          doorType: visualizationData.configs.enclosure_type,
          finish: visualizationData.configs.glass_style,
          hardware: visualizationData.configs.hardware_finish,
          handleStyle: visualizationData.configs.handle_style,
          trackPreference: visualizationData.configs.track_preference,
          mode: visualizationData.configs.mode,
          showerShape: visualizationData.configs.shower_shape,
          sessionId: visualizationData.configs.session_id,
          source: 'Gatsby Glass Visualizer'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit');
      }

      setSuccess(true);

      // Auto-close after 3 seconds on success
      setTimeout(() => {
        onClose();
        setFormData({ name: '', email: '', phone: '', zipCode: '' });
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
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-brand-black-secondary border-brand-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-brand-secondary">
              {mode === 'save' ? 'Save & Send to Me' : 'Request Quote'}
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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
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
                  : 'Provide your details and we\'ll connect you with a local Gatsby Glass franchisee.'}
              </p>

              {errors.submit && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{errors.submit}</p>
                </div>
              )}

              <div>
                <Label htmlFor="name" className="text-white">Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="John Doe"
                  disabled={submitting}
                />
                {errors.name && (
                  <p className="text-xs text-red-400 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="text-white">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`mt-1 ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="john@example.com"
                  disabled={submitting}
                />
                {errors.email && (
                  <p className="text-xs text-red-400 mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone" className="text-white">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="mt-1"
                  placeholder="(555) 123-4567"
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="zipCode" className="text-white">Zip Code *</Label>
                <Input
                  id="zipCode"
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleChange('zipCode', e.target.value)}
                  className={`mt-1 ${errors.zipCode ? 'border-red-500' : ''}`}
                  placeholder="12345"
                  maxLength={10}
                  disabled={submitting}
                />
                {errors.zipCode && (
                  <p className="text-xs text-red-400 mt-1">{errors.zipCode}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  We&apos;ll connect you with your local Gatsby Glass franchisee
                </p>
              </div>

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
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
