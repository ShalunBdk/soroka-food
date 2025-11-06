import jwt, { SignOptions } from 'jsonwebtoken';

export interface TokenPayload {
  id: number;
  username: string;
  email: string;
  role: string;
}

export const generateToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET must be set in environment variables. This is critical for security.');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
};

export const verifyToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET must be set in environment variables. This is critical for security.');
  }

  return jwt.verify(token, secret) as TokenPayload;
};
