'use client';

import React from 'react';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { Input } from '../ui/Input';
import { useLegalModal } from '../legal/LegalModalProvider';

interface SingleUploadProps {
  file: File | null;
  previewUrl: string | null;
  validating: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

interface PhotoUploadStepProps extends SingleUploadProps {
  type: 'bathroom' | 'inspiration' | 'both';
  // Second upload props — only used when type === 'both'
  inspirationFile?: File | null;
  inspirationPreviewUrl?: string | null;
  inspirationValidating?: boolean;
  onInspirationFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInspirationRemove?: () => void;
  error?: string | null;
  // Consent props
  uploadConsent?: boolean;
  marketingConsent?: boolean;
  onUploadConsentChange?: (value: boolean) => void;
  onMarketingConsentChange?: (value: boolean) => void;
}

const UploadBox: React.FC<SingleUploadProps & { label?: string; hint?: string; tall?: boolean }> = ({
  file,
  previewUrl,
  validating,
  onFileChange,
  onRemove,
  label,
  hint,
  tall = true,
}) => (
  <div className="space-y-2">
    {label && <h3 className="text-lg font-semibold text-brand-gold">{label}</h3>}
    {hint && <p className="text-sm text-gray-400">{hint}</p>}
    <div className={`relative flex items-center justify-center w-full border border-dashed border-brand-gold hover:border-brand-gold transition-all duration-300 bg-black/20 overflow-hidden group ${
      tall ? 'h-[400px] md:h-[450px] lg:h-[500px] max-h-[500px]' : 'h-[300px] md:h-[360px] lg:h-[400px]'
    }`}>
      {/* Art deco corners */}
      <img src="/GG-Deco-Corner.svg" alt="" className="absolute top-[-1px] left-[-1px] w-20 h-20 pointer-events-none" style={{ transform: 'scaleX(-1)' }} />
      <img src="/GG-Deco-Corner.svg" alt="" className="absolute top-[-1px] right-[-1px] w-20 h-20 pointer-events-none" />
      <img src="/GG-Deco-Corner.svg" alt="" className="absolute bottom-[-1px] left-[-1px] w-20 h-20 pointer-events-none" style={{ transform: 'scale(-1, -1)' }} />
      <img src="/GG-Deco-Corner.svg" alt="" className="absolute bottom-[-1px] right-[-1px] w-20 h-20 pointer-events-none" style={{ transform: 'scaleY(-1)' }} />

      {validating && (
        <div className="absolute inset-0 z-20 bg-brand-brown/95 flex flex-col items-center justify-center text-brand-gold animate-in fade-in">
          <Loader2 className="h-12 w-12 animate-spin mb-4" />
          <span className="text-lg font-medium">Verifying &amp; Scanning Layout...</span>
          <span className="text-sm text-white/40 mt-2 text-center px-4 max-w-sm">
            AI checks often take 30–90 seconds on a phone—keep this page open. Wi‑Fi is usually faster than cellular.
          </span>
        </div>
      )}

      {previewUrl ? (
        <>
          <img src={previewUrl} alt="Uploaded" className="object-contain h-full w-full" />
          <button
            onClick={onRemove}
            className="absolute top-4 right-4 p-3 bg-black bg-opacity-70 text-white hover:bg-opacity-90 z-10 transition-all hover:scale-110"
            aria-label="Remove uploaded image"
          >
            <X size={24} />
          </button>
        </>
      ) : (
        <div className="text-center p-8">
          <div className="mb-6 transform transition-transform group-hover:scale-110 duration-300">
            <UploadCloud className="mx-auto h-24 w-24 text-brand-gold" />
          </div>
          <p className="text-xl font-medium text-gray-300 mb-2">Click to upload or drag & drop</p>
          <p className="text-sm text-gray-400 mb-4">Best results: Straight-on photo, good lighting</p>
          <p className="text-xs text-gray-500">Maximum file size: 10MB</p>
        </div>
      )}

      <Input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        disabled={validating}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        onChange={onFileChange}
      />
    </div>
  </div>
);

const ConsentCheckboxes: React.FC<{
  uploadConsent: boolean;
  marketingConsent: boolean;
  onUploadConsentChange: (value: boolean) => void;
  onMarketingConsentChange: (value: boolean) => void;
}> = ({ uploadConsent, marketingConsent, onUploadConsentChange, onMarketingConsentChange }) => (
  <div className="space-y-3 mt-4 px-1">
    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={uploadConsent}
        onChange={(e) => onUploadConsentChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-brand-gold cursor-pointer"
      />
      <span className="text-xs text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
        I confirm that I own this image or have permission to use it, and I consent to its use for AI-generated visualizations. <span className="text-gray-500">(required)</span>
      </span>
    </label>
    <div className="space-y-1.5">
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={marketingConsent}
          onChange={(e) => onMarketingConsentChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-brand-gold cursor-pointer"
        />
        <span className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
          I grant permission for my AI-generated and uploaded images to be used for sales and promotional purposes.
        </span>
      </label>
      <p className="text-[10px] text-gray-600 leading-relaxed ml-7">
        By selecting this option, you grant Gatsby Glass an exclusive, royalty-free, perpetual, and irrevocable license to use, reproduce, modify, display, and distribute your uploaded and AI-generated images for marketing, sales, and promotional purposes in any media. You understand that these images may be used publicly and waive any claims for compensation or approval rights. These images may also be used to produce estimates with sales representatives who may reach out to you directly.
      </p>
    </div>
  </div>
);

const DisclaimerText: React.FC<{ openPrivacyPolicy: () => void }> = ({ openPrivacyPolicy }) => (
  <p className="text-xs text-gray-500 text-center mt-4 px-4">
    By uploading this image, you represent that you have the legal right to use and submit it. You acknowledge that the image will be processed by an AI service to generate visualizations. Uploaded images are retained for up to 30 days and then permanently deleted. Do not upload images containing visible people, personal information, illegal or inappropriate content, or content you do not have permission to use. See our{' '}
    <button type="button" onClick={openPrivacyPolicy} className="underline hover:text-gray-300 transition-colors">Privacy Policy</button>{' '}
    for details on how your data is used and your rights.
  </p>
);

export const PhotoUploadStep: React.FC<PhotoUploadStepProps> = ({
  type,
  file,
  previewUrl,
  validating,
  onFileChange,
  onRemove,
  inspirationFile,
  inspirationPreviewUrl,
  inspirationValidating,
  onInspirationFileChange,
  onInspirationRemove,
  error,
  uploadConsent = false,
  marketingConsent = false,
  onUploadConsentChange,
  onMarketingConsentChange,
}) => {
  const { openPrivacyPolicy } = useLegalModal();

  const hasFile = previewUrl !== null;

  if (type === 'both') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-gold">Upload Your Photos</h2>
          <p className="text-gray-400 text-base md:text-lg">Upload your bathroom and the shower style you want to match</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-sm">
            <p className="text-sm text-red-400 break-words">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <UploadBox
            file={file}
            previewUrl={previewUrl}
            validating={validating}
            onFileChange={onFileChange}
            onRemove={onRemove}
            label="Your Bathroom"
            hint="Take a clear, straight-on photo of your shower area"
            tall={false}
          />
          <UploadBox
            file={inspirationFile ?? null}
            previewUrl={inspirationPreviewUrl ?? null}
            validating={inspirationValidating ?? false}
            onFileChange={onInspirationFileChange ?? (() => {})}
            onRemove={onInspirationRemove ?? (() => {})}
            label="Inspiration Photo"
            hint="Upload a photo of the shower style you love"
            tall={false}
          />
        </div>

        {hasFile && onUploadConsentChange && onMarketingConsentChange && (
          <ConsentCheckboxes
            uploadConsent={uploadConsent}
            marketingConsent={marketingConsent}
            onUploadConsentChange={onUploadConsentChange}
            onMarketingConsentChange={onMarketingConsentChange}
          />
        )}

        <DisclaimerText openPrivacyPolicy={openPrivacyPolicy} />
      </div>
    );
  }

  const title = type === 'bathroom' ? 'Upload Your Bathroom Photo' : 'Upload Your Inspiration Photo';
  const description = type === 'bathroom'
    ? 'Take a clear, straight-on photo of your shower area for the best results'
    : 'Upload a photo of a shower style you love and we\'ll apply it to your bathroom';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-gold">{title}</h2>
        <p className="text-gray-400 text-base md:text-lg">{description}</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-sm">
          <p className="text-sm text-red-400 break-words">{error}</p>
        </div>
      )}

      <div className="mt-6 md:mt-8">
        <UploadBox
          file={file}
          previewUrl={previewUrl}
          validating={validating}
          onFileChange={onFileChange}
          onRemove={onRemove}
        />

        {hasFile && onUploadConsentChange && onMarketingConsentChange && (
          <ConsentCheckboxes
            uploadConsent={uploadConsent}
            marketingConsent={marketingConsent}
            onUploadConsentChange={onUploadConsentChange}
            onMarketingConsentChange={onMarketingConsentChange}
          />
        )}

        <DisclaimerText openPrivacyPolicy={openPrivacyPolicy} />
      </div>
    </div>
  );
};
