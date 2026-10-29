import { Injectable } from '@nestjs/common';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as argon2 from 'argon2';
import { ApplicationError } from '../platform/application-error';

const CORPUS_SHA256 = '68782d6a4a19a4768d5f15dd66bd534e7a33055cc755411e33f16d18c50fdcce';

@Injectable()
export class SecurityPrimitivesService {
  private readonly blocklist: ReadonlySet<string>;

  constructor() {
    const corpus = readFileSync(
      resolve(__dirname, '../../resources/password-blocklist/10k-most-common.txt'),
    );
    if (this.digest(corpus) !== CORPUS_SHA256)
      throw new Error('Password corpus integrity check failed.');
    this.blocklist = new Set(corpus.toString('utf8').split(/\r?\n/).filter(Boolean));
  }

  async hashPassword(password: string): Promise<string> {
    if (
      typeof password !== 'string' ||
      [...password].length < 15 ||
      [...password].length > 128 ||
      // Reject unpaired surrogates: UTF-8 replacement must not alias a different password.
      Buffer.from(password, 'utf8').toString('utf8') !== password ||
      this.blocklist.has(password)
    ) {
      throw new ApplicationError(400, 'VALIDATION_FAILED', 'Mật khẩu không đáp ứng yêu cầu.');
    }
    return argon2.hash(Buffer.from(password, 'utf8'), {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
      salt: randomBytes(16),
    });
  }

  async verifyPassword(encodedHash: string, password: string): Promise<boolean> {
    if (
      typeof password !== 'string' ||
      Buffer.from(password, 'utf8').toString('utf8') !== password ||
      [...password].length > 128
    )
      return false;
    try {
      return await argon2.verify(encodedHash, Buffer.from(password, 'utf8'));
    } catch {
      return false;
    }
  }

  digest(value: string | Buffer): string {
    return createHash('sha256').update(value).digest('hex');
  }

  createSessionTokens(): { token: string; tokenHash: string; csrfToken: string } {
    const token = randomBytes(32).toString('base64url');
    return { token, tokenHash: this.digest(token), csrfToken: this.createCsrfToken() };
  }

  createCsrfToken(): string {
    return randomBytes(32).toString('base64url');
  }
  createPreloginId(): string {
    return randomUUID();
  }

  equalTokens(actual: string, expected: string): boolean {
    const a = Buffer.from(actual, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  }

  credentialExpiry(issuedAt: Date): Date {
    return new Date(issuedAt.getTime() + 24 * 60 * 60 * 1000);
  }
  preloginExpiry(createdAt: Date): Date {
    return new Date(createdAt.getTime() + 15 * 60 * 1000);
  }
  sessionExpiry(createdAt: Date): Date {
    return new Date(createdAt.getTime() + 8 * 60 * 60 * 1000);
  }
  isSessionTimeValid(createdAt: Date, lastActivityAt: Date, now: Date): boolean {
    return (
      now.getTime() < this.sessionExpiry(createdAt).getTime() &&
      now.getTime() < lastActivityAt.getTime() + 30 * 60 * 1000
    );
  }
}
