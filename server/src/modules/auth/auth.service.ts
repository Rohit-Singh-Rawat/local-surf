import { createHash, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '../../config/db';
import type { GoogleProfile } from '../../config/passport';
import { refreshTokens } from '../../db/schema';
import { UnauthorizedError } from '../../lib/app-error';
import { REFRESH_TOKEN_EXPIRY_MS } from '../../lib/constants';
import { signAccessToken } from '../../lib/jwt';
import type { UserService } from '../user/user.service';

export class AuthService {
  constructor(private userService: UserService) {}

  async handleGoogleAuth(profile: GoogleProfile) {
    const user = await this.userService.upsertFromGoogle(profile);
    const accessToken = await signAccessToken(user.id, user.email);
    const refreshToken = this.generateOpaqueToken();

    await this.persistRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken, user };
  }

  /**
   * Rotates a refresh token: validates the old one, deletes it, issues a new pair.
   * Each token is single-use — limits the damage window if a token is stolen.
   */
  async refresh(oldToken: string) {
    const hash = this.hashToken(oldToken);
    const [stored] = await db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, hash));

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id));
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id));

    const user = await this.userService.findById(stored.userId);
    const accessToken = await signAccessToken(user.id, user.email);
    const refreshToken = this.generateOpaqueToken();

    await this.persistRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  async logout(token: string) {
    const hash = this.hashToken(token);
    await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, hash));
  }

  async logoutAll(userId: string) {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
  }

  private generateOpaqueToken(): string {
    return randomBytes(48).toString('base64url');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async persistRefreshToken(userId: string, token: string) {
    await db.insert(refreshTokens).values({
      userId,
      tokenHash: this.hashToken(token),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    });
  }
}
