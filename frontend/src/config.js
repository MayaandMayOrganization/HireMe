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

const LIVEKIT_TOKEN_LAMBDA =
  import.meta.env.VITE_LIVEKIT_TOKEN_URL ||
  'https://iexzogfkyuunk7b5sunmodusay0whgku.lambda-url.us-east-1.on.aws/';

// Local dev mints tokens with name/role embedded (see vite/dev-livekit-token.js).
export const LIVEKIT_TOKEN_URL = import.meta.env.DEV
  ? '/api/livekit-token'
  : LIVEKIT_TOKEN_LAMBDA;
