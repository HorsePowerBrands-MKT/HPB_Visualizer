import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

let watermarkBuffer: Buffer | null = null;

/**
 * Load the watermark PNG once and cache it for the process lifetime.
 */
async function getWatermarkBuffer(): Promise<Buffer> {
  if (watermarkBuffer) return watermarkBuffer;

  const watermarkPath = path.join(process.cwd(), 'public', 'watermark-logo.png');
  watermarkBuffer = fs.readFileSync(watermarkPath);
  return watermarkBuffer;
}

/**
 * Apply a semi-transparent watermark to a base64-encoded image.
 * Returns the watermarked image as a base64 data URL.
 */
export async function applyWatermark(base64DataUrl: string): Promise<string> {
  const base64Data = base64DataUrl.replace(/^data:image\/\w+;base64,/, '');
  const imageBuffer = Buffer.from(base64Data, 'base64');

  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const imgWidth = metadata.width || 1024;
  const imgHeight = metadata.height || 1024;

  const logoRaw = await getWatermarkBuffer();

  // Determine logo's native aspect ratio to pick the constraining dimension
  const logoMeta = await sharp(logoRaw).metadata();
  const logoNativeW = logoMeta.width || 748;
  const logoNativeH = logoMeta.height || 972;
  const logoAspect = logoNativeW / logoNativeH;
  const imgAspect = imgWidth / imgHeight;

  let logoTargetWidth: number;
  if (imgAspect > logoAspect) {
    logoTargetWidth = Math.round(imgHeight * 0.50 * logoAspect);
  } else {
    logoTargetWidth = Math.round(imgWidth * 0.50);
  }

  const logo = await sharp(logoRaw)
    .resize({ width: logoTargetWidth })
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  // Lower opacity to ~15% by manipulating the alpha channel
  const fadedLogo = await sharp(logo.data)
    .ensureAlpha()
    .composite([{
      input: Buffer.from(
        Array(logo.info.width * logo.info.height * 4)
          .fill(0)
          .map((_, i) => (i % 4 === 3 ? 38 : 255))
      ),
      raw: {
        width: logo.info.width,
        height: logo.info.height,
        channels: 4,
      },
      blend: 'dest-in',
    }])
    .png()
    .toBuffer();

  // Center the watermark
  const left = Math.round((imgWidth - logo.info.width) / 2);
  const top = Math.round((imgHeight - logo.info.height) / 2);

  const watermarked = await image
    .composite([{
      input: fadedLogo,
      left,
      top,
      blend: 'over',
    }])
    .png()
    .toBuffer();

  return `data:image/png;base64,${watermarked.toString('base64')}`;
}

/**
 * Convert a base64 data URL to a Buffer (for uploading to storage).
 */
export function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mimeType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid data URL');
  return {
    buffer: Buffer.from(match[2], 'base64'),
    mimeType: match[1],
  };
}
