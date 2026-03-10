import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from '../lib/app-error';

interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/** Validated payloads; query is stored here because req.query may be readonly in Express. */
export interface ValidatedRequest extends Request {
  validated?: { body?: unknown; query?: unknown; params?: unknown };
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const validated = (req as ValidatedRequest).validated ?? {};
    for (const [key, schema] of Object.entries(schemas) as [keyof ValidationSchemas, ZodType][]) {
      if (!schema) continue;
      const result = schema.safeParse(req[key as keyof Request]);
      if (!result.success) {
        const messages = result.error.issues.map((i) => {
          const path = i.path.length ? `${i.path.join('.')}: ` : '';
          return `${path}${i.message}`;
        });
        throw new ValidationError(messages.join(', '));
      }
      validated[key as keyof typeof validated] = result.data;
      if (key === 'body' || key === 'params') {
        (req as Record<string, unknown>)[key] = result.data;
      }
    }
    (req as ValidatedRequest).validated = validated;
    next();
  };
}
