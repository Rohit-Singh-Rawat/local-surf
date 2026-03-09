export function success<T>(data: T, meta?: Record<string, unknown>) {
  return { success: true as const, data, ...(meta && { meta }) };
}

export function error(code: string, message: string) {
  return { success: false as const, error: { code, message } };
}
