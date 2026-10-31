import type { AuthPayload } from './types';
import { USER_FIELDS } from './types';
export class ApiError extends Error { constructor(message: string, public code = 'UNKNOWN') { super(message); this.name = 'ApiError'; } }
type GraphqlResult<T> = { data?: T; errors?: { message: string; extensions?: { code?: string } }[] };
export function createGraphqlClient(url: string, onSession: (session: AuthPayload | null) => Promise<void> | void, fetcher: typeof fetch = fetch) {
  let session: AuthPayload | null = null;
  let revision = 0;
  let refreshing: Promise<AuthPayload> | null = null;
  async function raw<T>(query: string, variables: Record<string, unknown> = {}, token?: string): Promise<T> {
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetcher(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ query, variables }), signal: controller.signal });
      if (response.status === 401) throw new ApiError('Please log in again.', 'UNAUTHENTICATED');
      let result: GraphqlResult<T>;
      try { result = await response.json(); } catch { throw new ApiError('The server returned an unreadable response. Please try again.', 'BAD_RESPONSE'); }
      if (result.errors?.length) { const error = result.errors[0]; throw new ApiError(error.message, error.extensions?.code ?? 'GRAPHQL_ERROR'); }
      if (!response.ok || !result.data) throw new ApiError('The server could not complete this request.', 'SERVER_ERROR');
      return result.data;
    } catch (error) { if (error instanceof ApiError) throw error; throw new ApiError('Cannot reach the server. Check your connection and try again.', 'NETWORK'); }
    finally { clearTimeout(timeout); }
  }
  async function setSession(value: AuthPayload | null) { revision++; session = value; await onSession(value); }
  async function refresh(refreshToken = session?.refreshToken) {
    if (!refreshToken) throw new ApiError('Please log in again.', 'UNAUTHENTICATED');
    if (!refreshing) {
      const expectedRevision = revision;
      refreshing = raw<{ refreshToken: AuthPayload }>(`mutation Refresh($refreshToken: String!) { refreshToken(refreshToken: $refreshToken) { accessToken refreshToken user { ${USER_FIELDS} } } }`, { refreshToken }).then(async result => {
        if (revision !== expectedRevision) throw new ApiError('Session changed. Please try again.', 'SESSION_CHANGED');
        await setSession(result.refreshToken); return result.refreshToken;
      }).catch(async error => { if (revision === expectedRevision && error instanceof ApiError && error.code === 'UNAUTHENTICATED') await setSession(null); throw error; }).finally(() => { refreshing = null; });
    }
    return refreshing;
  }
  async function request<T>(query: string, variables: Record<string, unknown> = {}, authenticated = true): Promise<T> {
    if (authenticated && !session) throw new ApiError('Please log in to continue.', 'UNAUTHENTICATED');
    const usedToken = authenticated ? session?.accessToken : undefined;
    try { return await raw<T>(query, variables, usedToken); }
    catch (error) {
      if (authenticated && error instanceof ApiError && error.code === 'UNAUTHENTICATED' && session) { if (session.accessToken !== usedToken) return raw<T>(query, variables, session.accessToken); const next = await refresh(); return raw<T>(query, variables, next.accessToken); }
      throw error;
    }
  }
  return { request, setSession, refresh, getSession: () => session };
}
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const messages: Record<string, string> = { INSUFFICIENT_FUNDS: 'Your wallet balance is too low. Top up your wallet to continue.', TOKEN_EXPIRED: 'This QR code has expired. Refresh the patient card and scan again.', TOKEN_NOT_FOUND: 'This QR code is no longer valid. Refresh the patient card.', SESSION_ALREADY_ACTIVE: 'A consultation is already active for this patient.', PRICE_NOT_SET: 'The pharmacy needs to set a price before dispensing this medication.' };
    return messages[error.code] ?? error.message;
  }
  return 'Something went wrong. Please try again.';
}
