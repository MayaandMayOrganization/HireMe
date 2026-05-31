// Must match the LiveKit project used by your token Lambda (same API key issuer).
export const LIVEKIT_URL =
  import.meta.env.VITE_LIVEKIT_URL ||
  'wss://hireme-khyjrqi7.livekit.cloud';

const AVATAR_CONTEXT_LAMBDA =
  import.meta.env.VITE_AVATAR_CONTEXT_URL ||
  'https://tiqv7tglmz2hb4qmpjrimr5pge0anuak.lambda-url.us-east-1.on.aws/';

// Always use same-origin path. Dev: Vite proxy (vite.config.js). Prod: Amplify rewrite (see plan below).
// Do NOT call the Lambda URL from the browser — its CORS headers are broken (duplicate Allow-Origin).
export const AVATAR_CONTEXT_URL = '/api/avatar-context';

// Same-origin in dev (Vite) and prod (Amplify rewrite). Embeds name/role in JWT via token Lambda.
export const LIVEKIT_TOKEN_URL = '/api/livekit-token';
