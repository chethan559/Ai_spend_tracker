/**
 * Normalize an API endpoint by trimming whitespace, removing trailing slashes,
 * and ensuring it has an http/https scheme.
 */
export function normalizeEndpoint(endpoint: string): string {
  let normalized = endpoint.trim();

  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  normalized = normalized.replace(/\/+$/, '');
  return normalized;
}

