import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from '../lib/app-error';

interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    for (const [key, schema] of Object.entries(schemas) as [keyof ValidationSchemas, ZodType][]) {
      if (!schema) continue;
      const result = schema.safeParse(req[key]);
      if (!result.success) {
        const messages = result.error.issues.map((i) => {
          const path = i.path.length ? `${i.path.join('.')}: ` : '';
          return `${path}${i.message}`;
        });
        throw new ValidationError(messages.join(', '));
      }
      req[key] = result.data;
    }
    next();
  };
}
