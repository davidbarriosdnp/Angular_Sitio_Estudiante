/** Claim de rol que emite .NET (`ClaimTypes.Role`) en el JWT. */
const ROLE_CLAIM_KEYS = [
  'role',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
] as const;

/** Decodifica el payload de un JWT (sin verificar firma). Solo para lectura de claims en el cliente. */
export function leerPayloadJwt(token: string | null): Record<string, unknown> | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Rol del token (`Administrador`, `Estudiante`, etc.). */
export function rolDesdeToken(token: string | null): string | null {
  const p = leerPayloadJwt(token);
  if (!p) return null;
  for (const k of ROLE_CLAIM_KEYS) {
    const raw = p[k];
    if (typeof raw === 'string' && raw.length > 0) return raw;
    if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string') return raw[0];
  }
  return null;
}

/** Claim `estudiante_id` emitido por la API cuando el usuario tiene perfil académico vinculado. */
export function estudianteIdDesdeToken(token: string | null): number | null {
  const p = leerPayloadJwt(token);
  if (!p) return null;
  const raw = p['estudiante_id'];
  if (typeof raw === 'string' || typeof raw === 'number') {
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}
