const assert = require('node:assert/strict');
const argon2 = require('argon2');
const sharp = require('sharp');

async function verifyNative() {
  const sample = 'isolated native compatibility sample';
  const digest = await argon2.hash(sample, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
  assert.equal(await argon2.verify(digest, sample), true);
  const png = await sharp({
    create: { width: 2, height: 3, channels: 3, background: '#ffffff' },
  })
    .png()
    .toBuffer();
  const metadata = await sharp(png).metadata();
  assert.equal(metadata.format, 'png');
  assert.equal(metadata.width, 2);
  assert.equal(metadata.height, 3);
  console.log(`Native compatibility PASS: ${process.platform}/${process.arch}, ${process.version}`);
}

verifyNative().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
