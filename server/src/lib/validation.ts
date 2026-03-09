/** Blocks control characters, forward slashes, and backslashes in file/folder names. */
export function hasInvalidPathChars(name: string): boolean {
  for (const ch of name) {
    const code = ch.charCodeAt(0);
    if (code <= 0x1f || code === 0x7f || ch === '/' || ch === '\\') return true;
  }
  return false;
}

/** Escapes SQL LIKE wildcards to prevent pattern injection. */
export function escapeLikePattern(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&');
}
