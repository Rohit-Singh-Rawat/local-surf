import { type JWTPayload, jwtVerify, SignJWT } from 'jose';
import { env } from '../config/env';
import { ACCESS_TOKEN_EXPIRY } from './constants';

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

export interface TokenPayload extends JWTPayload {
	sub: string;
	email: string;
}

export async function signAccessToken(userId: string, email: string): Promise<string> {
	return new SignJWT({ email })
		.setProtectedHeader({ alg: 'HS256' })
		.setSubject(userId)
		.setIssuedAt()
		.setExpirationTime(ACCESS_TOKEN_EXPIRY)
		.sign(accessSecret);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
	const { payload } = await jwtVerify(token, accessSecret);

	if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
		throw new Error('Malformed token payload: missing sub or email');
	}

	return payload as TokenPayload;
}
