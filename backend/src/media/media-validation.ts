import sharp from 'sharp';
import { ApplicationError } from '../platform/application-error';

export const CLUB_LOGO_MAX_BYTES = 2_097_152;
const MAX_DIMENSION = 2048;
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function invalidLogo() {
  return new ApplicationError(
    400,
    'VALIDATION_FAILED',
    'Logo phải là ảnh PNG, JPEG hoặc WebP tĩnh, tối đa 2 MiB và 2048 pixel mỗi chiều.',
  );
}

/** Reject APNG even if the decoder would silently select its fallback frame. */
function staticPng(bytes: Buffer): boolean {
  for (let offset = PNG_SIGNATURE.length; offset + 12 <= bytes.length;) {
    const size = bytes.readUInt32BE(offset);
    const chunk = bytes.toString('ascii', offset + 4, offset + 8);
    offset += 12 + size;
    if (offset > bytes.length || ['acTL', 'fcTL', 'fdAT'].includes(chunk)) return false;
    if (chunk === 'IEND') return size === 0 && offset === bytes.length;
  }
  return false;
}

function staticWebp(bytes: Buffer): boolean {
  if (bytes.readUInt32LE(4) !== bytes.length - 8) return false;
  let offset = 12;
  let frames = 0;
  for (; offset + 8 <= bytes.length;) {
    const chunk = bytes.toString('ascii', offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    if (chunk === 'ANIM' || chunk === 'ANMF') return false;
    if (chunk === 'VP8X' && (size !== 10 || (bytes[offset + 8] & 2) !== 0)) return false;
    if (chunk === 'VP8 ' || chunk === 'VP8L') frames += 1;
    offset += 8 + size + (size % 2);
  }
  return frames === 1 && offset === bytes.length;
}

function staticJpeg(bytes: Buffer): boolean {
  let offset = 2;
  let scanning = false;
  while (offset < bytes.length) {
    if (scanning) offset = bytes.indexOf(0xff, offset);
    if (offset < 0 || bytes[offset] !== 0xff) return false;
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset++];
    // Stuffed bytes and restart markers belong to the current entropy-coded scan.
    if (scanning && (marker === 0 || (marker >= 0xd0 && marker <= 0xd7))) continue;
    if (marker === 0xd9) return offset === bytes.length;
    if (marker === 0xd8 || offset + 2 > bytes.length) return false;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) return false;
    if (
      marker === 0xe2 &&
      length >= 6 &&
      bytes.toString('latin1', offset + 2, offset + 6) === 'MPF\0'
    )
      return false;
    scanning = marker === 0xda;
    offset += length;
  }
  return false;
}

function inputFormat(bytes: Buffer): 'png' | 'jpeg' | 'webp' {
  if (bytes.subarray(0, 8).equals(PNG_SIGNATURE) && staticPng(bytes)) return 'png';
  if (
    bytes.length >= 12 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP' &&
    staticWebp(bytes)
  )
    return 'webp';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && staticJpeg(bytes)) return 'jpeg';
  throw invalidLogo();
}

export async function normalizeClubLogo(input: Buffer) {
  if (input.length === 0 || input.length > CLUB_LOGO_MAX_BYTES) throw invalidLogo();
  const format = inputFormat(input);
  try {
    const image = sharp(input, {
      failOn: 'warning',
      limitInputPixels: MAX_DIMENSION ** 2,
      sequentialRead: true,
    });
    const meta = await image.metadata();
    if (
      meta.format !== format ||
      !meta.width ||
      !meta.height ||
      meta.width > MAX_DIMENSION ||
      meta.height > MAX_DIMENSION ||
      (meta.pages ?? 1) !== 1 ||
      (meta.delay?.length ?? 0) > 0
    )
      throw invalidLogo();
    const { data, info } = await image
      .autoOrient()
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    if (!data.length || data.length > CLUB_LOGO_MAX_BYTES) throw invalidLogo();
    return { bytes: data, width: info.width, height: info.height };
  } catch {
    throw invalidLogo();
  }
}
