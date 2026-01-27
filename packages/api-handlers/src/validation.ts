/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate US zip code format (5 digits or 5+4 digits)
 */
export function validateZipCode(zipCode: string): boolean {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zipCode);
}

/**
 * Validate phone number (basic US format)
 */
export function validatePhone(phone: string): boolean {
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  // Check for 10 digits (US format)
  return /^\d{10}$/.test(cleaned);
}

/**
 * Validate image file type
 */
export function validateImageType(mimeType: string): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];
  return allowedTypes.includes(mimeType.toLowerCase());
}

/**
 * Validate image file size (in bytes)
 */
export function validateImageSize(sizeBytes: number, maxSizeMB: number = 10): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return sizeBytes <= maxBytes;
}

/**
 * Convert File to base64 ImageData
 */
export async function fileToImageData(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Extract base64 data without the data URL prefix
      const data = base64.split(',')[1];
      resolve({
        data,
        mimeType: file.type
      });
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Comprehensive lead data validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateLeadData(data: {
  name?: string;
  email?: string;
  phone?: string;
  zipCode?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Name is required';
  }

  if (!data.email || !data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.zipCode || !data.zipCode.trim()) {
    errors.zipCode = 'Zip code is required';
  } else if (!validateZipCode(data.zipCode)) {
    errors.zipCode = 'Please enter a valid US zip code (e.g., 12345 or 12345-6789)';
  }

  if (data.phone && data.phone.trim() && !validatePhone(data.phone)) {
    errors.phone = 'Please enter a valid 10-digit phone number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
