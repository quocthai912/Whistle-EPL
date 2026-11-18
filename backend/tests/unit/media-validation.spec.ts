import sharp from 'sharp';
import { normalizeClubLogo } from '../../src/media/media-validation';

function image(width = 4) {
  return sharp({
    create: { width, height: 3, channels: 4, background: { r: 90, g: 20, b: 200, alpha: 0.5 } },
  });
}

describe('Club logo validation', () => {
  it.each(['png', 'jpeg', 'webp'] as const)(
    'decodes and strips metadata from static %s',
    async (format) => {
      const input = await image().withMetadata({ orientation: 6 }).toFormat(format).toBuffer();
      const result = await normalizeClubLogo(input);
      const output = await sharp(result.bytes).metadata();
      expect(output).toMatchObject({ format: 'webp', width: 3, height: 4 });
      expect(output.exif).toBeUndefined();
      expect(result).toMatchObject({ width: 3, height: 4 });
    },
  );

  it('rejects actual GIF, corruption, oversized bytes and oversized dimensions', async () => {
    const png = await image().png().toBuffer();
    const invalid = [
      await image().gif().toBuffer(),
      png.subarray(0, 30),
      Buffer.alloc(2_097_153),
      await image(2049).png().toBuffer(),
    ];
    for (const bytes of invalid)
      await expect(normalizeClubLogo(bytes)).rejects.toMatchObject({ status: 400 });
  });

  it('rejects animated WebP with distinct frames', async () => {
    const pixels = Buffer.concat([Buffer.alloc(4 * 3 * 3, 190), Buffer.alloc(4 * 3 * 3, 40)]);
    const input = await sharp(pixels, {
      raw: { width: 4, height: 6, channels: 3, pageHeight: 3 },
    })
      .webp({ delay: [100, 100] })
      .toBuffer();
    expect((await sharp(input).metadata()).pages).toBe(2);
    await expect(normalizeClubLogo(input)).rejects.toMatchObject({ status: 400 });
  });

  it('rejects concatenated JPEG frames and accepts a progressive JPEG', async () => {
    const jpeg = await image().jpeg({ progressive: true }).toBuffer();
    await expect(normalizeClubLogo(jpeg)).resolves.toMatchObject({ width: 4, height: 3 });
    await expect(normalizeClubLogo(Buffer.concat([jpeg, jpeg]))).rejects.toMatchObject({
      status: 400,
    });
  });
});
