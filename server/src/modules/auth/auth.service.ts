import { createHash, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '../../config/db';
import type { GoogleProfile } from '../../config/passport';
import { redis } from '../../config/redis';
import { refreshTokens } from '../../db/schema';
import { UnauthorizedError } from '../../lib/app-error';
import { REFRESH_TOKEN_EXPIRY_MS } from '../../lib/constants';
import { signAccessToken } from '../../lib/jwt';
import type { UserService } from '../user/user.service';

// Redis key prefix for short-lived auth codes (token-not-in-URL pattern)
const AUTH_CODE_PREFIX = 'auth:code:';
// Auth codes expire after 60 seconds — enough time for the browser redirect + client exchange
const AUTH_CODE_TTL_SECONDS = 60;

const EXCHANGE_LUA = `
local val = redis.call('GET', KEYS[1])
if val then redis.call('DEL', KEYS[1]) end
return val
`;

export class AuthService {
  constructor(private userService: UserService) {}

  async handleGoogleAuth(profile: GoogleProfile) {
    const user = await this.userService.upsertFromGoogle(profile);
    const accessToken = await signAccessToken(user.id, user.email);
    const refreshToken = this.generateOpaqueToken();
    await this.persistRefreshToken(user.id, refreshToken);

    // Create a short-lived exchange code so the access token never appears in the URL.
    const code = await this.createExchangeCode(accessToken);
    return { code, refreshToken, user };
  }

  /**
   * Atomically retrieves and deletes the auth code from Redis (single-use).
   * Returns the access token it was bound to, or throws if invalid/expired.
   */
  async exchangeAuthCode(code: string): Promise<string> {
    const key = `${AUTH_CODE_PREFIX}${code}`;
    const accessToken = (await redis.eval(EXCHANGE_LUA, 1, key)) as string | null;
    if (!accessToken) throw new UnauthorizedError('Invalid or expired auth code');
    return accessToken;
  }

  /**
   * Rotates a refresh token: atomically deletes the old one then issues a new pair.
   * Using DELETE...RETURNING prevents a race condition where two concurrent requests
   * with the same token both succeed — the first DELETE wins, the second gets nothing.
   */
  async refresh(oldToken: string) {
    const hash = this.hashToken(oldToken);

    // Atomic delete — if two requests race with the same token, only one gets the row.
    const [stored] = await db
      .delete(refreshTokens)
      .where(eq(refreshTokens.tokenHash, hash))
      .returning();

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

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

  private async createExchangeCode(accessToken: string): Promise<string> {
    const code = randomBytes(32).toString('hex');
    await redis.set(`${AUTH_CODE_PREFIX}${code}`, accessToken, 'EX', AUTH_CODE_TTL_SECONDS);
    return code;
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
