import { handlers } from '@/auth';

// Auth.js v5 server-side route — handles sign-in, sign-out, session
// refresh, CSRF tokens, and provider callbacks for every configured
// provider.
export const { GET, POST } = handlers;
